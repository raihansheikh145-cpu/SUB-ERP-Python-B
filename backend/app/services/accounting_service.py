import uuid
import json
from datetime import date
from prisma import Prisma
import logging

logger = logging.getLogger(__name__)

class AccountingService:

    @staticmethod
    async def get_or_create_account(tx, company_id: str, criteria: dict):
        """
        Helper to fetch an account or create it if missing.
        criteria format: {"codes": [...], "name_like": "...", "type": "...", "default_code": "...", "default_name": "..."}
        """
        # Search by name first (most reliable for user-renamed standard accounts)
        if "name_like" in criteria:
            name_like = criteria["name_like"]
            acc = await tx.query_raw(f"""
                SELECT id FROM docs_accounts 
                WHERE name ILIKE $1
                AND company_id = $2
                LIMIT 1
            """, f"%{name_like}%", company_id)
            if acc: return acc[0]["id"]

        # Search by code
        if "codes" in criteria:
            codes_str = "','".join(criteria["codes"])
            acc = await tx.query_raw(f"""
                SELECT id FROM docs_accounts 
                WHERE code IN ('{codes_str}')
                AND company_id = $1
                LIMIT 1
            """, company_id)
            if acc: return acc[0]["id"]
            
        # Fallback to any account if absolutely needed (for AP/expense)
        if criteria.get("fallback_any"):
            acc = await tx.query_raw("""
                SELECT id FROM docs_accounts WHERE company_id = $1 ORDER BY id LIMIT 1
            """, company_id)
            if acc: return acc[0]["id"]

        # Create new
        new_id = f'acc-{criteria["default_code"].lower()}-{company_id}'
        await tx.execute_raw("""
            INSERT INTO docs_accounts (id, company_id, code, name, type) 
            VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
        """, new_id, company_id, criteria["default_code"], criteria["default_name"], criteria["type"])
        
        return new_id


    @staticmethod
    async def rebuild_wac_for_document(tx, doc_type: str, doc_id: str, company_id: str = None):
        """
        IAS 2 / ASC 330 compliant moving-average (WAC) rebuild.
        After reversing a document's stock movements, recompute each affected
        product's weighted-average cost from the remaining IN/OUT transactions.
        OUT movements consume the running average; IN movements add at their
        actual landed unit cost.
        """
        try:
            if doc_type == 'INVOICE':
                prods = await tx.query_raw(
                    "SELECT DISTINCT product_id FROM docs_invoice_lines WHERE invoice_id = $1 AND product_id IS NOT NULL",
                    doc_id
                )
            elif doc_type == 'BILL':
                prods = await tx.query_raw(
                    "SELECT DISTINCT product_id FROM docs_bill_lines WHERE bill_id = $1 AND product_id IS NOT NULL",
                    doc_id
                )
            elif doc_type == 'CREDIT_NOTE':
                prods = await tx.query_raw(
                    "SELECT DISTINCT product_id FROM docs_credit_note_lines WHERE credit_note_id = $1 AND product_id IS NOT NULL",
                    doc_id
                )
            else:
                return

            if not company_id:
                if doc_type == 'INVOICE':
                    row = await tx.query_raw("SELECT company_id FROM docs_invoices WHERE id = $1 LIMIT 1", doc_id)
                elif doc_type == 'BILL':
                    row = await tx.query_raw("SELECT company_id FROM docs_bills WHERE id = $1 LIMIT 1", doc_id)
                else:
                    row = await tx.query_raw("SELECT company_id FROM docs_credit_notes WHERE id = $1 LIMIT 1", doc_id)
                if not row:
                    return
                company_id = row[0]["company_id"]

            for p in prods:
                product_id = p["product_id"]
                wh_rows = await tx.query_raw(
                    "SELECT DISTINCT warehouse_id FROM docs_inventory_transactions WHERE product_id = $1 AND company_id = $2",
                    product_id, company_id
                )
                warehouses = [w["warehouse_id"] for w in wh_rows] or [None]

                for wh_id in warehouses:
                    if wh_id is None:
                        continue
                    movements = await tx.query_raw("""
                        SELECT transaction_type, quantity, cost_price, unit_price, created_at
                        FROM docs_inventory_transactions
                        WHERE product_id = $1 AND warehouse_id = $2 AND company_id = $3
                        ORDER BY created_at ASC
                    """, product_id, wh_id, company_id)

                    running_qty = 0.0
                    running_cost = 0.0
                    for m in movements:
                        qty = float(m.get("quantity") or 0)
                        if m.get("transaction_type") == 'IN':
                            unit_cost = float(m.get("cost_price") or m.get("unit_price") or 0)
                            running_cost += qty * unit_cost
                            running_qty += qty
                        elif m.get("transaction_type") == 'OUT':
                            if running_qty > 0:
                                avg = running_cost / running_qty
                                running_cost -= qty * avg
                                running_qty -= qty

                    new_wac = round(running_cost / running_qty, 4) if running_qty > 0 else 0
                    await tx.execute_raw("""
                        INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, avg_cost, updated_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT (id) DO UPDATE SET avg_cost = EXCLUDED.avg_cost, updated_at = NOW()
                    """, f"cost-{product_id}-{wh_id}", company_id, product_id, wh_id, new_wac)

                    if new_wac > 0:
                        await tx.execute_raw("""
                            UPDATE docs_products SET cost_price = $1 WHERE id = $2
                        """, new_wac, product_id)
        except Exception as e:
            logger.error(f"WAC rebuild failed for {doc_type} {doc_id}: {e}")
            raise


    @staticmethod
    async def post_invoice(prisma: Prisma, invoice_id: str, company_id: str = None):
        async with prisma.tx() as tx:
            inv = await tx.query_raw("SELECT * FROM docs_invoices WHERE id = $1 LIMIT 1", invoice_id)
            if not inv:
                raise Exception(f"Invoice {invoice_id} not found")
            invoice = inv[0]
            
            effective_company_id = invoice.get("company_id") or company_id
            journal_id = f"JE-{str(invoice_id).upper()}"
            
            # Check if already posted
            check_journal = await tx.query_raw("SELECT 1 FROM docs_journals WHERE id = $1 AND status = 'POSTED'", journal_id)
            if check_journal:
                return {"success": True, "journal_id": journal_id, "message": "Already posted"}
                
            # Clear old lines
            await tx.execute_raw("DELETE FROM docs_journal_lines WHERE journal_id = $1", journal_id)
            
            # Upsert Journal Header
            inv_num = invoice.get("invoice_number")
            created_by_id = invoice.get("created_by_id")
            if not inv_num or str(inv_num).startswith("DRAFT-") or inv_num == 'NEW':
                from app.core.sequence import get_next_sequence_number
                inv_num = await get_next_sequence_number("INVOICE", effective_company_id, "INV", tx)
                await tx.execute_raw("UPDATE docs_invoices SET invoice_number = $1 WHERE id = $2", inv_num, invoice_id)
                invoice["invoice_number"] = inv_num
            else:
                inv_num = inv_num or invoice_id
            inv_date = invoice.get("date") or invoice.get("invoice_date") or date.today()
            if hasattr(inv_date, 'isoformat'): inv_date = inv_date.isoformat()
            try:
                await tx.execute_raw("""
                    INSERT INTO docs_journals (id, company_id, date, journal_date, reference, reference_number, description, status, created_by_id, journal_type)
                    VALUES ($1, $2, $3::date, $3::date, $4, $5, $6, 'DRAFT', $7, 'INV')
                    ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, journal_date = EXCLUDED.journal_date, reference = EXCLUDED.reference, reference_number = EXCLUDED.reference_number, description = EXCLUDED.description, status = 'DRAFT', created_by_id = EXCLUDED.created_by_id
                """, journal_id, effective_company_id, inv_date, inv_num, inv_num, f"Invoice {inv_num}", created_by_id)
            except Exception as e:
                logger.error(f"Failed at docs_journals insert: {e}")
                raise

            # Fetch Accounts
            ar_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1012','100200','100201','AR'], "name_like": "receivable", "type": "ASSET",
                "default_code": "AR", "default_name": "Accounts Receivable"
            })
            rev_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['4011', '4000', '400102', 'REVENUE', 'SALES'], "type": "REVENUE",
                "default_code": "REV", "default_name": "General Revenue"
            })
            tax_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['2011', '200100', 'TAX_PAYABLE'], "name_like": "tax payable", "type": "LIABILITY",
                "default_code": "TAX", "default_name": "Tax Payable"
            })
            cogs_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['5011', '500100', '500101', 'COGS'], "name_like": "cost of goods", "type": "EXPENSE",
                "default_code": "COGS", "default_name": "Cost of Goods Sold"
            })
            inv_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1013', '100500', '100501', 'INVENTORY'], "name_like": "inventory", "type": "ASSET",
                "default_code": "INV", "default_name": "Inventory Asset"
            })

            lines_rec = await tx.query_raw("SELECT * FROM docs_invoice_lines WHERE invoice_id = $1", invoice_id)
            items = []
            for l in lines_rec:
                items.append({
                    "id": l.get("id"),
                    "type": l.get("type", "PRODUCT"),
                    "lineValue": float(l.get("line_value") or 0),
                    "quantity": float(l.get("quantity") or 0),
                    "unitPrice": float(l.get("unit_price") or 0),
                    "description": l.get("description", "Item"),
                    "productId": l.get("product_id"),
                    "tax": float(l.get("tax") or 0)
                })
            global_discount = sum(abs(float(item.get("lineValue") or 0)) for item in items if item.get("type") == "DISCOUNT")
            
            # Per GAAP/IFRS 15, revenue must be presented net of output VAT.
            # Inline tax embedded in each product line is split out and
            # credited to Tax Payable instead of being recognised as revenue.
            total_revenue_subtotal = 0.0
            total_inline_tax = 0.0
            product_items_count = 0
            for item in items:
                t = item.get("type")
                if t == "PRODUCT" or not t:
                    product_items_count += 1
                    qty = float(item.get("quantity") or 0)
                    price = float(item.get("unitPrice") or 0)
                    line_val = float(item.get("lineValue") or 0)
                    inline_tax = float(item.get("tax") or 0)
                    gross = line_val if line_val else (qty * price)
                    total_revenue_subtotal += (gross - inline_tax)
                    total_inline_tax += inline_tax

            total_credit = 0.0
            discount_distributed = 0.0
            current_item_idx = 0
            
            for idx, item in enumerate(items, start=1):
                t = item.get("type")
                if t == "PRODUCT" or not t:
                    current_item_idx += 1
                    qty = float(item.get("quantity") or 0)
                    price = float(item.get("unitPrice") or 0)
                    line_val = float(item.get("lineValue") or 0)
                    inline_tax = float(item.get("tax") or 0)
                    item_gross = line_val if line_val else (qty * price)
                    item_subtotal = item_gross - inline_tax

                    if current_item_idx == product_items_count:
                        proportional_discount = round(global_discount - discount_distributed, 2)
                    else:
                        proportional_discount = round((item_subtotal / total_revenue_subtotal) * global_discount, 2) if total_revenue_subtotal > 0 else 0
                        discount_distributed += proportional_discount
                        
                    revenue_net = round(item_subtotal - proportional_discount, 2)
                    
                    # Revenue Credit (net of output VAT — IFRS 15)
                    try:
                        await tx.execute_raw("""
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                            VALUES ($1, $2, $3, $4, 0, $5, $6)
                        """, f"JL-{journal_id}-rev-{idx}", journal_id, effective_company_id, rev_acc, revenue_net, f"Revenue: {item.get('description', 'Item')}")
                    except Exception as e:
                        logger.error(f"Failed at rev line {idx}: {e}")
                        raise
                    total_credit += revenue_net

                    # Output VAT split-out: Tax Payable credit (IAS 12 / VAT principles)
                    if inline_tax > 0:
                        try:
                            await tx.execute_raw("""
                                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                VALUES ($1, $2, $3, $4, 0, $5, $6)
                            """, f"JL-{journal_id}-tax-inline-{idx}", journal_id, effective_company_id, tax_acc, inline_tax, f"Output Tax: {item.get('description', 'Item')}")
                        except Exception as e:
                            logger.error(f"Failed at inline tax line {idx}: {e}")
                            raise
                        total_credit += inline_tax
                    
                    # COGS & Inventory Asset
                    product_id = item.get("productId") or item.get("product_id")
                    if product_id:
                        # GAAP: WAC (IAS 2 / ASC 330) — use consistent warehouse_id
                        wh_id = f"wh-{effective_company_id}"
                        wac_record = await tx.query_raw("""
                            SELECT avg_cost FROM docs_product_costs 
                            WHERE product_id = $1 AND warehouse_id = $2 AND company_id = $3
                            ORDER BY updated_at DESC LIMIT 1
                        """, product_id, wh_id, effective_company_id)
                        
                        wac_cost = float(wac_record[0]["avg_cost"]) if wac_record else None
                        
                        prod_record = await tx.query_raw("SELECT * FROM docs_products WHERE id = $1 LIMIT 1", product_id)
                        if not wac_cost and prod_record:
                            wac_cost = float(prod_record[0].get("cost_price") or 0)
                            
                        wac_cost = wac_cost or 0
                        
                        # Update cost price at sale
                        try:
                            await tx.execute_raw("UPDATE docs_invoice_lines SET cost_price_at_sale = $1 WHERE id = $2", wac_cost, item.get("id"))
                        except Exception as e:
                            logger.error(f"Failed at cost_price_at_sale update: {e}")
                            raise
                        
                        # Stock Deduction
                        if prod_record:
                            prod = prod_record[0]
                            current_stock = float(prod.get("quantity_on_hand") or 0)
                            new_stock = current_stock - qty
                            
                            try:
                                await tx.execute_raw("""
                                    UPDATE docs_products SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2
                                """, new_stock, product_id)
                            except Exception as e:
                                logger.error(f"Failed at docs_products update: {e}")
                                raise
                            
                            # Inventory Transaction (ON CONFLICT DO NOTHING prevents duplicate on re-post)
                            inv_tx_id = f"mov-inv-{invoice_id}-{idx}"
                            try:
                                await tx.execute_raw("""
                                    INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, updated_at)
                                    VALUES ($1, $2, $3, $4, 'OUT', $5, $6, 'INVOICE', $7::date, $8, NOW()) ON CONFLICT (id) DO NOTHING
                                """, inv_tx_id, effective_company_id, product_id, wh_id, qty, invoice_id, inv_date, wac_cost)
                            except Exception as e:
                                logger.error(f"Failed at inv tx insert: {e}")
                                raise
                        
                        cogs_amount = round(wac_cost * qty, 2)
                        
                        # GAAP Warning: Selling below cost (gross loss) — still allowed, just logged
                        if cogs_amount > revenue_net:
                            logger.warning(
                                f"GAAP Notice: Selling below cost on {invoice_id} item {idx}. "
                                f"COGS={cogs_amount}, Revenue={revenue_net}, "
                                f"WAC={wac_cost}, Qty={qty}. Gross loss on this line."
                            )
                        
                        if cogs_amount > 0:
                            try:
                                # ON CONFLICT DO NOTHING prevents duplicate COGS entries on re-post
                                await tx.execute_raw("""
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ($1, $2, $3, $4, $5, 0, $6)
                                    ON CONFLICT (id) DO NOTHING
                                """, f"JL-{journal_id}-cogs-{idx}", journal_id, effective_company_id, cogs_acc, cogs_amount, f"COGS: {item.get('description', 'Product')}")
                            except Exception as e:
                                logger.error(f"Failed at cogs line {idx}: {e}")
                                raise

                            try:
                                # ON CONFLICT DO NOTHING prevents duplicate Inventory credit entries on re-post
                                await tx.execute_raw("""
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ($1, $2, $3, $4, 0, $5, $6)
                                    ON CONFLICT (id) DO NOTHING
                                """, f"JL-{journal_id}-inv-{idx}", journal_id, effective_company_id, inv_acc, cogs_amount, f"Inventory: {item.get('description', 'Product')}")
                            except Exception as e:
                                logger.error(f"Failed at inv line {idx}: {e}")
                                raise
                        
                elif t == "TAX":
                    tax_total = float(item.get("lineValue") or item.get("taxAmount") or item.get("taxTotal") or 0)
                    if tax_total > 0:
                        try:
                            await tx.execute_raw("""
                                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                VALUES ($1, $2, $3, $4, 0, $5, $6)
                            """, f"JL-{journal_id}-tax-{idx}", journal_id, effective_company_id, tax_acc, tax_total, f"Tax: {item.get('description')}")
                        except Exception as e:
                            logger.error(f"Failed at tax line {idx}: {e}")
                            raise
                        total_credit += tax_total
                        
            total_credit = round(total_credit, 2)
            total_debit = total_credit
            
            try:
                cust_id_ar = invoice.get("customer_id")
                if cust_id_ar:
                    await tx.execute_raw("""
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                        VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
                    """, f"JL-{journal_id}-ar", journal_id, effective_company_id, ar_acc, cust_id_ar, total_debit, f"Accounts Receivable: {inv_num}")
                else:
                    await tx.execute_raw("""
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                        VALUES ($1, $2, $3, $4, $5, 0, $6)
                    """, f"JL-{journal_id}-ar", journal_id, effective_company_id, ar_acc, total_debit, f"Accounts Receivable: {inv_num}")
            except Exception as e:
                logger.error(f"Failed at AR line: {e}")
                raise
            
            if float(invoice.get("total") or 0) != total_debit:
                try:
                    await tx.execute_raw("UPDATE docs_invoices SET total = $1 WHERE id = $2", total_debit, invoice_id)
                except Exception as e:
                    logger.error(f"Failed at total update: {e}")
                    raise

            # Final double-entry balance assertion (every journal must balance)
            bal = await tx.query_raw("""
                SELECT COALESCE(SUM(debit),0) AS dr, COALESCE(SUM(credit),0) AS cr
                FROM docs_journal_lines WHERE journal_id = $1
            """, journal_id)
            dr_total = float(bal[0]["dr"]) if bal else 0
            cr_total = float(bal[0]["cr"]) if bal else 0
            if abs(dr_total - cr_total) > 0.01:
                raise Exception(f"Invoice {inv_num} journal unbalanced (Dr: {dr_total:.2f}, Cr: {cr_total:.2f}). Posting aborted.")

            # Update status
            try:
                await tx.execute_raw("UPDATE docs_invoices SET status = 'POSTED', journal_entry_id = $1 WHERE id = $2", journal_id, invoice_id)
            except Exception as e:
                logger.error(f"Failed at final status update: {e}")
                raise
                
            try:
                await tx.execute_raw("UPDATE docs_journals SET status = 'POSTED', updated_at = NOW() WHERE id = $1", journal_id)
            except Exception as e:
                logger.error(f"Failed at journal update: {e}")
                raise
            
            # Cash sale logic
            cust_id = invoice.get("customer_id")
            if cust_id:
                cust_record = await tx.query_raw("SELECT name FROM docs_contacts WHERE id = $1 LIMIT 1", cust_id)
                is_cash_sale = "cash sale" in (cust_record[0]["name"] or "").lower() if cust_record else "cash-sale" in cust_id.lower()
                
                if is_cash_sale:
                    # Check if auto payment already exists
                    pay_id = f"PAY-AUTO-{invoice_id}"
                    existing_pay = await tx.query_raw("SELECT 1 FROM docs_payments WHERE id = $1", pay_id)
                    if not existing_pay:
                        liq_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                            "codes": ['1011', '100100', '100101', 'CASH', 'BANK'], "name_like": "cash", "type": "ASSET",
                            "default_code": "CASH", "default_name": "Cash Account"
                        })
                        
                        # Create a valid payment number
                        from app.core.sequence import get_next_sequence_number
                        pay_number = await get_next_sequence_number("PAYMENT", effective_company_id, "PAY", tx)
                        
                        pay_data = {
                            "id": pay_id, "amount": total_debit, "contactId": cust_id, "date": inv_date.isoformat() if isinstance(inv_date, date) else inv_date,
                            "method": "CASH", "type": "RECEIPT", "accountId": liq_acc, "status": "DRAFT", "companyId": effective_company_id,
                            "appliedInvoices": [{"invoiceId": invoice_id, "invoiceNumber": inv_num, "amount": total_debit, "remaining": 0}],
                            "paymentNumber": pay_number
                        }
                        
                        try:
                            # Note: We insert DRAFT here, then call post_payment which will switch to POSTED
                            await tx.execute_raw("""
                                INSERT INTO docs_payments (id, company_id, date, contact_id, status, type, amount, payment_date, applied_invoices, updated_at, payment_number, method, account_id, created_by_id)
                                VALUES ($1, $2, $3::date, $4, 'DRAFT', 'RECEIPT', $5, $6::date, $7::jsonb, NOW(), $8, 'CASH', $9, $10)
                            """, pay_id, effective_company_id, inv_date, cust_id, total_debit, inv_date, json.dumps(pay_data["appliedInvoices"], default=str), pay_number, liq_acc, invoice.get("created_by_id"))
                        except Exception as e:
                            logger.error(f"Failed at docs_payments insert: {e}")
                            raise
                        
                        # Call Python post_payment directly in same transaction
                        await AccountingService._post_payment_tx(tx, pay_id, effective_company_id)
                                                
                        await tx.execute_raw("UPDATE docs_invoices SET status = 'PAID' WHERE id = $1", invoice_id)

            return {"success": True, "journal_id": journal_id}

    @staticmethod
    async def post_bill(prisma: Prisma, bill_id: str, company_id: str = None):
        async with prisma.tx() as tx:
            b = await tx.query_raw("SELECT * FROM docs_bills WHERE id = $1 LIMIT 1", bill_id)
            if not b:
                raise Exception(f"Bill not found: {bill_id}")
            bill = b[0]
            
            effective_company_id = bill.get("company_id") or company_id
            
            # Safe Date Fallback
            b_data = bill.get("data") or {}
            if isinstance(b_data, str): b_data = json.loads(b_data)
            
            safe_date = bill.get("date") or bill.get("bill_date") or date.today()
            if hasattr(safe_date, 'isoformat'): safe_date = safe_date.isoformat()
            if isinstance(safe_date, str):
                safe_date = safe_date.split("T")[0]
                
            final_status = bill.get("status")
            if final_status not in ('POSTED', 'PAID', 'PARTIAL'):
                final_status = 'POSTED'
                
            bill_number = bill.get("bill_number")
            if not bill_number or str(bill_number).startswith('DRAFT-') or bill_number == 'NEW':
                from app.core.sequence import get_next_sequence_number
                bill_number = await get_next_sequence_number("BILL", effective_company_id, "BILL", tx)

                await tx.execute_raw("UPDATE docs_bills SET bill_number = $1 WHERE id = $2", bill_number, bill_id)
                bill["bill_number"] = bill_number
            else:
                bill_number = bill_number or bill_id
                
            journal_id = f"JE-{str(bill_id).upper()}"
            
            # Journal Header
            created_by_id = bill.get("created_by_id")
            existing_j = await tx.query_raw("SELECT 1 FROM docs_journals WHERE id = $1", journal_id)
            if not existing_j:
                await tx.execute_raw("""
                    INSERT INTO docs_journals (id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, created_by_id, updated_at)
                    VALUES ($1, $2, $3::date, $3::date, $4, $4, 'BILL', 'POSTED', $5, $6, NOW())
                """, journal_id, effective_company_id, safe_date, bill_number, f"Bill {bill_number}", created_by_id)
            else:
                await tx.execute_raw("UPDATE docs_journals SET status = 'POSTED', updated_at = NOW(), reference_number = $1, journal_number = $2, created_by_id = $3 WHERE id = $4", bill_number, bill_number, created_by_id, journal_id)
                
            # Accounts
            ap_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['200100', '200101', '2001'], "name_like": "payable", "type": "LIABILITY",
                "default_code": "AP", "default_name": "Accounts Payable"
            })
            inv_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1013', '100500', '100501', 'INVENTORY'], "name_like": "inventory", "type": "ASSET",
                "default_code": "INV", "default_name": "Inventory Asset"
            })
            exp_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['5001', '5002', '5000', 'EXPENSE'], "name_like": "expense", "type": "EXPENSE",
                "default_code": "EXP", "default_name": "General Expense"
            })
            tax_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1015', '100400', 'TAX_REC'], "name_like": "tax", "type": "ASSET",
                "default_code": "TAX_REC", "default_name": "Tax Receivable" # Standard for input tax
            })
            
            # Generate Journal Lines
            await tx.execute_raw("DELETE FROM docs_journal_lines WHERE journal_id = $1", journal_id)
            await tx.execute_raw("DELETE FROM docs_inventory_transactions WHERE reference_id = $1", bill_id)
            
            vendor_id = bill.get("vendor_id")
            lines_rec = await tx.query_raw("SELECT * FROM docs_bill_lines WHERE bill_id = $1", bill_id)
            items = []
            for l in lines_rec:
                items.append({
                    "type": l.get("type", "PRODUCT"),
                    "lineValue": float(l.get("line_value") or 0),
                    "quantity": float(l.get("quantity") or 0),
                    "unitPrice": float(l.get("unit_price") or 0),
                    "description": l.get("description", "Item"),
                    "productId": l.get("product_id")
                })
            total_debit = 0.0
            
            for idx, item in enumerate(items, start=1):
                item_type = item.get("type", "PRODUCT")
                qty = float(item.get("quantity") or 0)
                price = float(item.get("unitPrice") or 0)
                line_val = float(item.get("lineValue") or 0)
                desc = item.get("description", "Item")
                
                if item_type in ("PRODUCT", "SERVICE", "CHARGE"):
                    # Calculate net item value excluding tax but including discount
                    # If frontend calculated lineValue properly, we can use it, but for bills let's rely on lineValue if present
                    item_net = line_val if line_val else (qty * price)
                    inline_tax = float(item.get("tax") or 0)
                    item_net_excl_tax = round(max(item_net - inline_tax, 0), 2)
                    
                    target_acc = inv_acc if item_type == "PRODUCT" else exp_acc
                    
                    # Split Journal Line (Debit) — net of input VAT (IFRS 15 / IAS 2)
                    if item_net_excl_tax > 0:
                        await tx.execute_raw("""
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW())
                        """, f"JL-{journal_id}-itm-{idx}", journal_id, effective_company_id, target_acc, vendor_id, item_net_excl_tax, f"{item_type}: {desc}")
                        total_debit += item_net_excl_tax
                        
                    # Input VAT split-out: Dr Tax Receivable (asset)
                    if inline_tax > 0:
                        await tx.execute_raw("""
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW())
                        """, f"JL-{journal_id}-tax-inline-{idx}", journal_id, effective_company_id, tax_acc, vendor_id, inline_tax, f"Input Tax: {desc}")
                        total_debit += inline_tax
                        
                    # Stock Update for Products
                    product_id = item.get("productId") or item.get("product_id")
                    if item_type == "PRODUCT" and product_id and qty > 0:
                        wh_id = f"wh-{effective_company_id}"
                        
                        # 1. Update docs_products
                        prod_record = await tx.query_raw("SELECT * FROM docs_products WHERE id = $1 LIMIT 1", product_id)
                        if prod_record:
                            prod = prod_record[0]
                            current_stock = float(prod.get("quantity_on_hand") or 0)
                            new_stock = current_stock + qty
                            
                            await tx.execute_raw("""
                                UPDATE docs_products SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2
                            """, new_stock, product_id)
                        
                        # WAC Recalculation (IAS 2)
                        wh_id = f"wh-{effective_company_id}"
                        current_cost_record = await tx.query_raw("""
                            SELECT avg_cost FROM docs_product_costs 
                            WHERE product_id = $1 AND warehouse_id = $2 AND company_id = $3 LIMIT 1
                        """, product_id, wh_id, effective_company_id)
                        
                        current_wac = float(current_cost_record[0]["avg_cost"]) if current_cost_record else float(prod.get("cost_price") or 0)
                        
                        total_new_qty = current_stock + qty
                        if total_new_qty > 0:
                            new_wac = ((current_stock * current_wac) + (qty * price)) / total_new_qty
                            new_wac = round(new_wac, 4)
                        else:
                            new_wac = current_wac
                            
                        # Upsert new WAC
                        await tx.execute_raw("""
                            INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, avg_cost, updated_at)
                            VALUES ($1, $2, $3, $4, $5, NOW())
                            ON CONFLICT (id) DO UPDATE SET avg_cost = EXCLUDED.avg_cost, updated_at = NOW()
                        """, f"cost-{product_id}-{wh_id}", effective_company_id, product_id, wh_id, new_wac)
                        
                        # Also update docs_products cost_price for quick reference
                        await tx.execute_raw("UPDATE docs_products SET cost_price = $1 WHERE id = $2", new_wac, product_id)
                        
                        # 2. Insert docs_inventory_transactions
                        inv_tx_id = f"mov-inv-in-{bill_id}-{idx}"
                        await tx.execute_raw("""
                            INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, unit_price, updated_at)
                            VALUES ($1, $2, $3, $4, 'IN', $5, $6, 'BILL', $7::date, $8, $9, NOW())
                        """, inv_tx_id, effective_company_id, product_id, wh_id, qty, bill_id, safe_date, price, price)
                        
                elif item_type == "TAX":
                    tax_val = float(item.get("lineValue") or item.get("taxAmount") or 0)
                    if tax_val > 0:
                        await tx.execute_raw("""
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW())
                        """, f"JL-{journal_id}-tax-{idx}", journal_id, effective_company_id, tax_acc, vendor_id, tax_val, f"Input Tax: {desc}")
                        total_debit += tax_val

            # AP Journal Line (Credit)
            total_debit = round(total_debit, 2)
            v_id = bill.get("vendor_id")
            if v_id:
                await tx.execute_raw("""
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                    VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
                """, f"JL-{journal_id}-ap", journal_id, effective_company_id, ap_acc, v_id, total_debit, f"Accounts Payable for {bill_number}")
            else:
                await tx.execute_raw("""
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ($1, $2, $3, $4, 0, $5, $6)
                """, f"JL-{journal_id}-ap", journal_id, effective_company_id, ap_acc, total_debit, f"Accounts Payable for {bill_number}")
            
            if float(bill.get("total") or 0) != total_debit:
                pass # Total is stored in total column natively
            
            # Final double-entry balance assertion (every journal must balance)
            bal = await tx.query_raw("""
                SELECT COALESCE(SUM(debit),0) AS dr, COALESCE(SUM(credit),0) AS cr
                FROM docs_journal_lines WHERE journal_id = $1
            """, journal_id)
            dr_total = float(bal[0]["dr"]) if bal else 0
            cr_total = float(bal[0]["cr"]) if bal else 0
            if abs(dr_total - cr_total) > 0.01:
                raise Exception(f"Bill {bill_number} journal unbalanced (Dr: {dr_total:.2f}, Cr: {cr_total:.2f}). Posting aborted.")
            
            # Update bill status

            await tx.execute_raw("""
                UPDATE docs_bills SET status = $1, bill_number = $2, journal_entry_id = $3, date = $4::date, bill_date = $5::date WHERE id = $6
            """, final_status, bill_number, journal_id, safe_date, safe_date, bill_id)
            
            return {"success": True, "journal_id": journal_id}

    @staticmethod
    async def post_payment(prisma: Prisma, payment_id: str, company_id: str = None):
        async with prisma.tx() as tx:
            return await AccountingService._post_payment_tx(tx, payment_id, company_id)

    @staticmethod
    async def _post_payment_tx(tx, payment_id: str, company_id: str = None):
        p = await tx.query_raw("SELECT * FROM docs_payments WHERE id = $1 LIMIT 1", payment_id)
        if not p:
            raise Exception(f"Payment not found: {payment_id}")
        payment = p[0]
        
        p_data = {}
        
        is_receipt = payment.get("type") in ("RECEIPT", "COLLECTION")
        is_refund = payment.get("type") == "REFUND"
        amount = float(payment.get("amount") or 0)
        date_val = payment.get("date") or payment.get("payment_date") or date.today()
        if hasattr(date_val, 'isoformat'): date_val = date_val.isoformat()
        if isinstance(date_val, str):
            date_val = date_val.split("T")[0]
            
        contact_id = payment.get("contact_id")
        effective_company_id = payment.get("company_id") or company_id
        
        journal_id = f"JE-{'CPAY' if is_receipt or is_refund else 'VPAY'}-{payment_id.replace('PAY-', '').upper()}"
        
        existing_j = await tx.query_raw("SELECT 1 FROM docs_journals WHERE id = $1", journal_id)
        if existing_j:
            await tx.execute_raw("UPDATE docs_payments SET status = 'POSTED', updated_at = NOW() WHERE id = $1", payment_id)
            return {"success": True, "journal_id": journal_id, "message": "Already posted"}
            
        # Liquidity Account
        liq_id = payment.get("account_id")
        if liq_id:
            liq_check = await tx.query_raw("SELECT id FROM docs_accounts WHERE id = $1 AND company_id = $2 LIMIT 1", liq_id, effective_company_id)
            if not liq_check: liq_id = None
            
        if not liq_id:
            liq_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1011', '100100'], "name_like": "cash", "type": "ASSET",
                "default_code": "CASH", "default_name": "Cash / Bank Account"
            })
            liq_id = liq_acc

        # Partner Account (AR/AP)
        partner_id = payment.get("partner_account_id")
        if partner_id:
            partner_check = await tx.query_raw("SELECT id FROM docs_accounts WHERE id = $1 AND company_id = $2 LIMIT 1", partner_id, effective_company_id)
            if not partner_check: partner_id = None
            
        if not partner_id:
            if is_receipt or is_refund:
                partner_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                    "codes": ['1012', '100201', 'AR'], "name_like": "receivable", "type": "ASSET",
                    "default_code": "AR", "default_name": "Accounts Receivable"
                })
            else:
                partner_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                    "codes": ['200100', '200101', '2001'], "name_like": "payable", "type": "LIABILITY",
                    "default_code": "AP", "default_name": "Accounts Payable"
                })
            partner_id = partner_acc
            
        ref_val = payment.get("payment_number") or payment_id
        if payment.get("reference"):
            ref_val = f"{ref_val} ({payment.get('reference')})"
            
        # Create Journal Header
        created_by_id = payment.get("created_by_id")
        await tx.execute_raw("""
            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, prepared_by, created_by_id, updated_at)
            VALUES ($1, $2, $3::date, $4::date, $5, 'POSTED', $6, $7, 'System', $8, NOW())
            ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW(), created_by_id = EXCLUDED.created_by_id
        """, journal_id, effective_company_id, date_val, date_val, 'CUST_PAY' if (is_receipt or is_refund) else 'VEND_PAY', ref_val, ref_val, created_by_id)
        
        await tx.execute_raw("DELETE FROM docs_journal_lines WHERE journal_id = $1", journal_id)
        
        run_id = str(uuid.uuid4())[:8]
        
        # Liquidity Line (Cash/Bank)
        liq_debit = amount if is_receipt else 0
        liq_credit = 0 if is_receipt else amount
        await tx.execute_raw("""
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, f"JL-{run_id}-{journal_id}-liq", journal_id, effective_company_id, liq_id, liq_debit, liq_credit, f"Payment: {ref_val}")
        
        # Partner Line (AR/AP)
        part_debit = 0 if is_receipt else amount
        part_credit = amount if is_receipt else 0
        if contact_id:
            await tx.execute_raw("""
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, f"JL-{run_id}-{journal_id}-part", journal_id, effective_company_id, partner_id, contact_id, part_debit, part_credit, f"Reconciliation: {ref_val}")
        else:
            await tx.execute_raw("""
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, f"JL-{run_id}-{journal_id}-part", journal_id, effective_company_id, partner_id, part_debit, part_credit, f"Reconciliation: {ref_val}")
        
        # Update Payment Status early

        # Final double-entry balance assertion (every journal must balance)
        bal = await tx.query_raw("""
            SELECT COALESCE(SUM(debit),0) AS dr, COALESCE(SUM(credit),0) AS cr
            FROM docs_journal_lines WHERE journal_id = $1
        """, journal_id)
        dr_total = float(bal[0]["dr"]) if bal else 0
        cr_total = float(bal[0]["cr"]) if bal else 0
        if abs(dr_total - cr_total) > 0.01:
            raise Exception(f"Payment {payment_id} journal unbalanced (Dr: {dr_total:.2f}, Cr: {cr_total:.2f}). Posting aborted.")

        await tx.execute_raw("""
            UPDATE docs_payments SET status = 'POSTED', updated_at = NOW() WHERE id = $1
        """, payment_id)
        
        # Document Allocation Logic
        if is_receipt and payment.get("applied_invoices"):
            applied_invoices = payment.get("applied_invoices")
            if isinstance(applied_invoices, str): applied_invoices = json.loads(applied_invoices)
            
            for alloc in applied_invoices:
                inv_id = alloc.get("invoiceId")
                if not inv_id: continue
                
                inv_rec = await tx.query_raw("SELECT id, total FROM docs_invoices WHERE id = $1", inv_id)
                if inv_rec:
                    inv = inv_rec[0]
                    inv_total = float(inv.get("total") or 0)
                    
                    # Sum all posted payments for this invoice
                    total_paid = await tx.query_raw("""
                        SELECT COALESCE(SUM((al->>'amount')::numeric), 0) as paid
                        FROM docs_payments p, jsonb_array_elements(
                            CASE WHEN jsonb_typeof(p.applied_invoices) = 'array' THEN p.applied_invoices ELSE '[]'::jsonb END
                        ) al
                        WHERE p.status = 'POSTED' AND p.company_id = $1 AND al->>'invoiceId' = $2
                    """, effective_company_id, inv_id)
                    
                    paid_amt = float(total_paid[0]["paid"]) if total_paid else 0
                    new_status = 'PAID' if paid_amt >= (inv_total - 0.01) else 'PARTIAL'
                    
                    await tx.execute_raw("UPDATE docs_invoices SET status = $1, updated_at = NOW() WHERE id = $2", new_status, inv_id)
                    
        elif not is_receipt and payment.get("applied_bills"):
            applied_bills = payment.get("applied_bills")
            if isinstance(applied_bills, str): applied_bills = json.loads(applied_bills)
            
            for alloc in applied_bills:
                bill_id_target = alloc.get("billId")
                if not bill_id_target: continue
                
                b_rec = await tx.query_raw("SELECT id, total FROM docs_bills WHERE id = $1", bill_id_target)
                if b_rec:
                    b = b_rec[0]
                    b_total = float(b.get("total") or 0)
                    
                    total_paid = await tx.query_raw("""
                        SELECT COALESCE(SUM((al->>'amount')::numeric), 0) as paid
                        FROM docs_payments p, jsonb_array_elements(
                            CASE WHEN jsonb_typeof(p.applied_bills) = 'array' THEN p.applied_bills ELSE '[]'::jsonb END
                        ) al
                        WHERE p.status = 'POSTED' AND p.company_id = $1 AND al->>'billId' = $2
                    """, effective_company_id, bill_id_target)
                    
                    paid_amt = float(total_paid[0]["paid"]) if total_paid else 0
                    new_status = 'PAID' if paid_amt >= (b_total - 0.01) else 'PARTIAL'
                    
                    await tx.execute_raw("UPDATE docs_bills SET status = $1, updated_at = NOW() WHERE id = $2", new_status, bill_id_target)
                    
        return {"success": True, "journal_id": journal_id}

    @staticmethod
    async def post_credit_note(tx, cn_id: str, company_id: str = None):
        try:
            """
            Replaces the SQL post_credit_note function.
            Generates Journal Entries (Revenue debit, AR credit) and explicitly updates Stock.
            """
            cn_res = await tx.query_raw("SELECT * FROM docs_credit_notes WHERE id = $1 LIMIT 1", cn_id)
            if not cn_res:
                raise Exception(f"Credit Note not found: {cn_id}")
            cn = cn_res[0]
        
            cn_data = {}
        
            effective_company_id = company_id or cn.get("company_id")
            date_val = cn.get("credit_note_date") or cn.get("date") or date.today()
            if hasattr(date_val, 'isoformat'): date_val = date_val.isoformat()
            if isinstance(date_val, str):
                date_val = date_val.split("T")[0]
            
            cn_number = cn.get("cn_number") or cn.get("credit_note_number")
            customer_id = cn.get("customer_id")
            if not customer_id: customer_id = None
            invoice_id = cn.get("origin_invoice_id")
            if not invoice_id: invoice_id = None
        
            journal_id = f"JE-{cn_id.replace('CN-', '').upper()}"
        
            # Resolve Accounts
            ar_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['100201', '100200', 'AR'], "name_like": "receivable", "type": "ASSET",
                "default_code": "AR", "default_name": "Accounts Receivable"
            })
            rev_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['400102', '400000', 'REV'], "name_like": "revenue", "type": "REVENUE",
                "default_code": "REV", "default_name": "Sales Revenue"
            })
            tax_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['200400', '200100', 'TAX'], "name_like": "tax", "type": "LIABILITY",
                "default_code": "TAX", "default_name": "Tax Payable"
            })
            cogs_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['5011', '500100', '500101', 'COGS'], "name_like": "cost of goods", "type": "EXPENSE",
                "default_code": "COGS", "default_name": "Cost of Goods Sold"
            })
            inv_acc = await AccountingService.get_or_create_account(tx, effective_company_id, {
                "codes": ['1013', '100500', '100501', 'INVENTORY'], "name_like": "inventory", "type": "ASSET",
                "default_code": "INV", "default_name": "Inventory Asset"
            })
        
            # Calculate Global Totals for Proportional Distribution
            total_revenue_subtotal = 0.0
            global_discount = 0.0
            tax_total = 0.0
        
            lines_rec = await tx.query_raw("SELECT * FROM docs_credit_note_lines WHERE credit_note_id = $1", cn_id)
            items = []
            for l in lines_rec:
                items.append({
                    "type": l.get("type", "PRODUCT"),
                    "lineValue": float(l.get("line_value") or 0),
                    "quantity": float(l.get("quantity") or 0),
                    "unitPrice": float(l.get("unit_price") or 0),
                    "discountRate": float(l.get("discount_rate") or 0),
                    "discountMode": l.get("discount_mode"),
                    "description": l.get("description", "Item"),
                    "productId": l.get("product_id")
                })
            
            for item in items:
                item_type = item.get("type", "PRODUCT")
                net_cost = float(item.get("lineValue") or 0)
            
                if net_cost == 0:
                    qty = float(item.get("quantity") or 0)
                    price = float(item.get("unitPrice") or 0)
                    disc_rate = float(item.get("discountRate") or 0)
                    if item.get("discountMode") == 'FIXED':
                        net_cost = round((qty * price) - disc_rate, 2)
                    else:
                        net_cost = round((qty * price) * (1 - disc_rate / 100), 2)
                    
                if item_type in ('PRODUCT', 'SERVICE', 'CHARGE'):
                    total_revenue_subtotal += net_cost
                elif item_type == 'DISCOUNT':
                    global_discount += net_cost if net_cost < 0 else -net_cost
                elif item_type == 'TAX':
                    tax_total += net_cost
                
            # Upsert Header
            created_by_id = cn.get("created_by_id")
            await tx.execute_raw("""
                INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, created_by_id, updated_at)
                VALUES ($1, $2, $3::date, $4::date, 'CREDIT_NOTE', 'POSTED', $5, $6, $7, NOW())
                ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW(), created_by_id = EXCLUDED.created_by_id
            """, journal_id, effective_company_id, date_val, date_val, cn_number, cn_number, created_by_id)
        
            await tx.execute_raw("DELETE FROM docs_journal_lines WHERE journal_id = $1", journal_id)
            # Delete old inventory transactions for this CN if any
            await tx.execute_raw("DELETE FROM docs_inventory_transactions WHERE reference_id = $1", cn_id)
        
            # AR Credit Line (Total)
            total_credit = round(float(cn.get("total") or 0), 2)
            await tx.execute_raw("""
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
            """, f"JL-{journal_id}-ar", journal_id, effective_company_id, ar_acc, customer_id, total_credit, f"Credit Note: {cn_number}")
        
            total_debit = 0.0
            discount_distributed = 0.0
        
            valid_items = [it for it in items if it.get("type") in ('PRODUCT', 'SERVICE', 'CHARGE')]
            items_count = len(valid_items)
        
            # Distribution Logic
            for idx, item in enumerate(items, start=1):
                item_type = item.get("type", "PRODUCT")
                desc = item.get("description", "Item")
            
                if item_type in ('PRODUCT', 'SERVICE', 'CHARGE'):
                    net_cost = float(item.get("lineValue") or 0)
                    if net_cost == 0:
                        qty = float(item.get("quantity") or 0)
                        price = float(item.get("unitPrice") or 0)
                        disc_rate = float(item.get("discountRate") or 0)
                        if item.get("discountMode") == 'FIXED':
                            net_cost = round((qty * price) - disc_rate, 2)
                        else:
                            net_cost = round((qty * price) * (1 - disc_rate / 100), 2)
                        
                    current_item_idx = valid_items.index(item) + 1
                    if current_item_idx == items_count:
                        proportional_discount = round(global_discount - discount_distributed, 2)
                    else:
                        proportional_discount = round((net_cost / total_revenue_subtotal) * global_discount, 2) if total_revenue_subtotal > 0 else 0
                        discount_distributed += proportional_discount
                    
                    revenue_net = round(net_cost + proportional_discount, 2)
                
                    # Revenue Debit
                    await tx.execute_raw("""
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                        VALUES ($1, $2, $3, $4, $5, 0, $6)
                    """, f"JL-{journal_id}-rev-{idx}", journal_id, effective_company_id, rev_acc, revenue_net, f"Return: {desc}")
                    total_debit += revenue_net
                
                    # Stock Update for Products
                    qty = float(item.get("quantity") or 0)
                    product_id = item.get("productId") or item.get("product_id")
                    if item_type == "PRODUCT" and product_id and qty > 0:
                        wh_id = f"wh-{effective_company_id}"
                    
                        prod_record = await tx.query_raw("SELECT * FROM docs_products WHERE id = $1 LIMIT 1", product_id)
                        if prod_record:
                            prod = prod_record[0]
                            current_stock = float(prod.get("quantity_on_hand") or 0)
                            new_stock = current_stock + qty  # Returning product increases stock!
                        
                            await tx.execute_raw("""
                                UPDATE docs_products SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2
                            """, new_stock, product_id)
                        
                            # Inventory transaction (IN)
                            inv_tx_id = f"mov-cn-in-{cn_id}-{idx}"
                            cost_price = float(item.get("costPrice") or prod.get("cost_price") or 0)
                        
                            await tx.execute_raw("""
                                INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, unit_price, updated_at)
                                VALUES ($1, $2, $3, $4, 'IN', $5, $6, 'CREDIT_NOTE', $7::date, $8, $9, NOW())
                            """, inv_tx_id, effective_company_id, product_id, wh_id, qty, cn_id, date_val, cost_price, cost_price)
                        
                            # COGS Reversal (Debit Inventory, Credit COGS)
                            cogs_amount = round(cost_price * qty, 2)
                            if cogs_amount > 0:
                                await tx.execute_raw("""
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ($1, $2, $3, $4, $5, 0, $6)
                                """, f"JL-{journal_id}-inv-{idx}", journal_id, effective_company_id, inv_acc, cogs_amount, f"Inventory Return: {desc}")
                            
                                await tx.execute_raw("""
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ($1, $2, $3, $4, 0, $5, $6)
                                """, f"JL-{journal_id}-cogs-{idx}", journal_id, effective_company_id, cogs_acc, cogs_amount, f"COGS Reversal: {desc}")
            
                elif item_type == 'TAX':
                    tax_val = float(item.get("lineValue") or 0)
                    if tax_val > 0:
                        await tx.execute_raw("""
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                            VALUES ($1, $2, $3, $4, $5, 0, $6)
                        """, f"JL-{journal_id}-tax-{idx}", journal_id, effective_company_id, tax_acc, tax_val, f"Tax Reverse: {desc}")
                        total_debit += tax_val
                    
            # Balancing fallback
            total_debit = round(total_debit, 2)
            if total_credit > 0 and total_debit == 0:
                net_return = round(total_credit - tax_total, 2)
                await tx.execute_raw("""
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ($1, $2, $3, $4, $5, 0, $6)
                """, f"JL-{journal_id}-rev-fb", journal_id, effective_company_id, rev_acc, net_return, f"Return Fallback: {cn_number}")
                total_debit += net_return
                if tax_total > 0:
                    await tx.execute_raw("""
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                        VALUES ($1, $2, $3, $4, $5, 0, $6)
                    """, f"JL-{journal_id}-tax-fb", journal_id, effective_company_id, tax_acc, tax_total, f"Tax Fallback: {cn_number}")
                    total_debit += tax_total
                
            total_debit = round(total_debit, 2)
            if total_debit != total_credit:
                if abs(total_debit - total_credit) <= 0.10:
                    await tx.execute_raw(f"UPDATE docs_journal_lines SET debit = debit + ({total_credit} - {total_debit}) WHERE journal_id = $1 AND id LIKE '%-rev-%'", journal_id)
                else:
                    raise Exception(f"Credit Note Unbalanced (Dr: {total_debit}, Cr: {total_credit})")
                
            # Final Status Update
            await tx.execute_raw("UPDATE docs_credit_notes SET status = 'POSTED', updated_at = NOW() WHERE id = $1", cn_id)
        
            # Evaluate Invoice Refund Status
            try:
                if invoice_id:
                    inv_rec = await tx.query_raw("SELECT total FROM docs_invoices WHERE id = $1", invoice_id)
                    if inv_rec:
                        inv_total = float(inv_rec[0].get("total") or 0)
                        refunds = await tx.query_raw("SELECT total FROM docs_credit_notes WHERE status = 'POSTED' AND origin_invoice_id = $1", invoice_id)
                    
                        refund_amt = sum([float(r.get("total") or 0) for r in refunds]) if refunds else 0
                    
                        new_status = 'FULL_REFUNDED' if refund_amt >= (inv_total - 0.01) else 'PARTIAL_REFUNDED'
                        await tx.execute_raw("UPDATE docs_invoices SET status = $1, updated_at = NOW() WHERE id = $2", new_status, invoice_id)
            except Exception as inv_err:
                import logging
                logging.error(f"Error updating invoice status: {inv_err}")
                raise inv_err

        
            return {"success": True, "journal_id": journal_id}

        except Exception as e:
            import traceback
            import logging
            logging.error(f"ERROR IN POST_CREDIT_NOTE: {str(e)}")
            logging.error(traceback.format_exc())
            raise e
