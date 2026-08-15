from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
from app.core.sequence import generate_sequence
from datetime import datetime
import uuid

router = APIRouter(tags=["Journals"])
logger = logging.getLogger(__name__)

@router.post("/create")
async def create_journal(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_journal_data = body.get("p_journal_data")
        p_company_id = body.get("p_company_id")

        if not p_journal_data:
            return {"success": False, "error": "Invalid journal payload"}
            
        if not p_journal_data.get('id'):
            p_journal_data['id'] = str(uuid.uuid4())
            
        status = p_journal_data.get('status', 'DRAFT')
        ref = p_journal_data.get('reference')
        if status not in ('DRAFT', 'DELETED', 'VOID') and (not ref or str(ref).startswith('DRAFT-') or ref == 'NEW'):
            p_journal_data['reference'] = await generate_sequence(p_company_id, 'JEN')

        if not p_journal_data.get("lines") or not isinstance(p_journal_data.get("lines"), list):
            return {"success": False, "error": "Invalid journal payload"}

        journal_date = p_journal_data.get("date")
        if not journal_date:
            journal_date = datetime.utcnow().isoformat().split('T')[0]

        # 1. Closed Fiscal Period Check
        try:
            # We don't have docs_fiscal_periods mapped in Prisma schema, use raw query
            closed_period = await prisma.query_raw(
                '''
                SELECT id FROM docs_fiscal_periods 
                WHERE company_id = $1 
                AND is_locked = true 
                AND start_date <= $2 
                AND end_date >= $2 
                LIMIT 1
                ''',
                p_company_id,
                journal_date
            )
            if closed_period and len(closed_period) > 0:
                logger.warning(f"Journal entry rejected: Date {journal_date} falls in a locked fiscal period.")
                raise HTTPException(status_code=403, detail=f"The fiscal period for date {journal_date} is locked/closed.")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.debug('Fiscal period check bypassed or table missing.')

        # 2. Zero-Amount Line Stripping
        valid_lines = []
        for line in p_journal_data.get("lines", []):
            debit = float(line.get("debit", 0))
            credit = float(line.get("credit", 0))
            if debit != 0 or credit != 0:
                valid_lines.append(line)

        if len(valid_lines) == 0:
            return {"success": False, "error": "Journal entry must have at least one non-zero line."}

        p_journal_data["lines"] = valid_lines

        # 3. Debit === Credit Math Check
        total_debit = 0.0
        total_credit = 0.0
        for line in valid_lines:
            total_debit += float(line.get("debit", 0))
            total_credit += float(line.get("credit", 0))

        if abs(total_debit - total_credit) > 0.01:
            logger.warning(f"Unbalanced Journal Entry Attempt. Debit: {total_debit}, Credit: {total_credit}")
            return {
                "success": False, 
                "error": f"Math verification failed. Journal is unbalanced. Total Debit: {total_debit:.2f}, Total Credit: {total_credit:.2f}"
            }

        # 4. Use Python JournalService
        from app.services.journal_service import JournalService
        res = await JournalService.create_journal_entry(prisma, p_journal_data, p_company_id)

        return {"success": True, **res}

    except Exception as err:
        logger.error(f"Failed to process journal entry: {err}")
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/reverse")
async def reverse_journal(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_journal_id = body.get("p_journal_id")
        p_user_id = body.get("p_user_id")

        if not p_journal_id:
            return {"success": False, "error": "Journal ID is required"}

        from app.services.journal_service import JournalService
        res = await JournalService.reverse_journal_entry(prisma, p_journal_id, p_user_id)

        return {"success": True, **res}

    except Exception as err:
        logger.error(f"Failed to reverse journal entry: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/discount")
async def process_partner_discount(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_contact_id = body.get("p_contact_id")
        p_amount = body.get("p_amount")
        p_date = body.get("p_date")
        p_description = body.get("p_description")
        p_company_id = body.get("p_company_id")

        if not p_contact_id or not p_amount or not p_company_id:
            return {"success": False, "error": "Missing required fields"}

        # Enterprise Validation: Ensure contact exists
        # docs_contacts is in prisma schema, we can use ORM or raw query.
        contact = await prisma.docscontact.find_unique(where={"id": p_contact_id})
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        from app.services.journal_service import JournalService
        res = await JournalService.process_partner_discount(prisma, p_contact_id, p_amount, p_date, p_description, p_company_id)

        return {"success": True, **res}

    except Exception as err:
        logger.error(f"Failed to process partner discount: {err}")
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/cash-ledger")
async def get_cash_ledger(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_company_ids = body.get("p_company_ids")
        p_start_date = body.get("p_start_date")
        p_end_date = body.get("p_end_date")

        if not p_company_ids:
            return {"opening_balance": 0, "transactions": []}

        # 1. Get Opening Balance
        ob_res = await prisma.query_raw('''
            SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS opening_balance
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            WHERE a.code = '100100'
              AND j.date < $1::date
              AND j.company_id = ANY($2::text[])
        ''', p_start_date, p_company_ids)
        ob = float(ob_res[0].get('opening_balance', 0)) if ob_res else 0.0

        # 2. Get Transactions
        tx_res = await prisma.query_raw('''
            SELECT
              jl.id AS line_id,
              j.id AS journal_id,
              j.date::text AS date,
              j.reference_number,
              j.journal_type,
              COALESCE(jl.description, j.description) AS description,
              jl.debit,
              jl.credit,
              (jl.debit - jl.credit) AS impact,
              j.company_id,
              j.created_at::text AS created_at,
              c.name AS partner_name,
              u.name AS prepared_by
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            LEFT JOIN docs_contacts c ON jl.contact_id = c.id
            LEFT JOIN docs_users u ON j.created_by_id = u.id
            WHERE a.code = '100100'
              AND j.date >= $1::date
              AND j.date <= $2::date
              AND j.company_id = ANY($3::text[])
            ORDER BY j.date ASC, j.created_at ASC
        ''', p_start_date, p_end_date, p_company_ids)

        return {
            "opening_balance": ob,
            "transactions": [dict(r) for r in tx_res]
        }

    except Exception as err:
        logger.error(f"Failed to fetch cash ledger: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/general-ledger-report")
async def get_general_ledger_report(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_company_id = body.get("p_company_id")
        p_start_date = body.get("p_start_date")
        p_end_date = body.get("p_end_date")

        if not p_company_id:
            return []

        # Get all journal lines in date range for the company
        tx_res = await prisma.query_raw('''
            SELECT
              j.date::text AS transaction_date,
              j.journal_type AS type,
              j.reference_number AS invoice_bill_num,
              COALESCE(jl.description, j.description) AS narration,
              c.name AS partner,
              u.name AS "user",
              jl.debit AS amount,
              0 AS paid,
              0 AS due,
              0 AS balance,
              (jl.debit - jl.credit) AS cash_impact
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            LEFT JOIN docs_contacts c ON jl.contact_id = c.id
            LEFT JOIN docs_users u ON j.created_by_id = u.id
            WHERE j.date >= $1::date
              AND j.date <= $2::date
              AND j.company_id = $3::text
            ORDER BY j.date ASC, j.created_at ASC
        ''', p_start_date, p_end_date, p_company_id)

        return [dict(r) for r in tx_res]

    except Exception as err:
        logger.error(f"Failed to fetch general ledger report: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/account-ledger")
async def get_account_ledger(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_company_id = body.get("p_company_id")
        p_account_id = body.get("p_account_id")
        p_start_date = body.get("p_start_date")
        p_end_date = body.get("p_end_date")

        if not p_account_id:
            return []

        # Get opening balance
        ob_res = await prisma.query_raw('''
            SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            WHERE ($1::text IS NULL OR j.company_id = $1::text)
              AND jl.account_id = $2::text
              AND j.date < $3::date
        ''', p_company_id, p_account_id, p_start_date)
        
        ob_balance = float(ob_res[0]['balance']) if ob_res and len(ob_res) > 0 else 0.0

        # Get transactions
        tx_res = await prisma.query_raw('''
            SELECT 
                j.id,
                j.date::text as date,
                j.created_at::text as created_at,
                COALESCE(jl.description, j.description) as description,
                j.reference_number as reference,
                jl.debit,
                jl.credit,
                u.name as responsible_name
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            LEFT JOIN docs_users u ON j.created_by_id = u.id
            WHERE j.status = 'POSTED'
              AND ($1::text IS NULL OR j.company_id = $1::text)
              AND jl.account_id = $2::text
              AND j.date >= $3::date
              AND j.date <= $4::date
            ORDER BY j.date ASC, j.created_at ASC
        ''', p_company_id, p_account_id, p_start_date, p_end_date)

        results = []
        
        # Add opening balance row
        results.append({
            "is_opening": True,
            "date": p_start_date,
            "description": "Opening Balance",
            "reference": "",
            "debit": 0,
            "credit": 0,
            "running_balance": ob_balance,
            "responsible_name": "System"
        })
        
        running_bal = ob_balance
        for tx in tx_res:
            debit = float(tx['debit'] or 0)
            credit = float(tx['credit'] or 0)
            running_bal += (debit - credit)
            
            results.append({
                "id": tx['id'],
                "date": tx['date'],
                "description": tx['description'] or "",
                "reference": tx['reference'] or "",
                "debit": debit,
                "credit": credit,
                "running_balance": running_bal,
                "responsible_name": tx['responsible_name'] or "System"
            })
            
        return results

    except Exception as err:
        logger.error(f"Failed to fetch account ledger: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/partner-ledger")
async def get_partner_ledger(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_company_ids = body.get("p_company_ids")
        p_partner_ids = body.get("p_partner_ids")
        p_start_date = body.get("p_start_date")
        p_end_date = body.get("p_end_date")
        p_partner_type = body.get("p_partner_type")

        # Start building the WHERE clause dynamically
        where_clauses = ["j.status = 'POSTED'"]
        params = []
        
        if p_start_date:
            params.append(p_start_date)
            where_clauses.append(f"j.date >= ${len(params)}::date")
            
        if p_end_date:
            params.append(p_end_date)
            where_clauses.append(f"j.date <= ${len(params)}::date")
            
        if p_company_ids and len(p_company_ids) > 0:
            params.append(",".join(p_company_ids))
            where_clauses.append(f"j.company_id = ANY(string_to_array(${len(params)}, ','))")
            
        if p_partner_ids and len(p_partner_ids) > 0:
            params.append(",".join(p_partner_ids))
            where_clauses.append(f"jl.contact_id = ANY(string_to_array(${len(params)}, ','))")
            
        if p_partner_type:
            params.append(p_partner_type)
            where_clauses.append(f"c.type = ${len(params)}")

        # ALWAYS only show lines that are actually tagged with a contact in the ledger
        where_clauses.append("jl.contact_id IS NOT NULL")

        where_sql = " AND ".join(where_clauses)
        
        # We need to map to: partner_id, journal_id, journal_date, account_name, reference, description, responsible_name, debit, credit
        query = f'''
            SELECT 
                jl.contact_id as partner_id,
                c.name as contact_name,
                jl.company_id as company_id,
                j.id as journal_id,
                j.date::text as journal_date,
                a.name as account_name,
                a.type as account_type,
                j.reference_number as reference,
                COALESCE(jl.description, j.description) as description,
                u.name as responsible_name,
                jl.debit,
                jl.credit
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            LEFT JOIN docs_contacts c ON jl.contact_id = c.id
            LEFT JOIN docs_users u ON j.created_by_id = u.id
            WHERE {where_sql}
            ORDER BY j.date ASC, j.created_at ASC
        '''

        tx_res = await prisma.query_raw(query, *params)
        
        logger.info(f"Partner Ledger Result Count: {len(tx_res)}")
        
        return [dict(r) for r in tx_res]

    except Exception as err:
        logger.error(f"Failed to fetch partner ledger: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/dashboard-summary")
async def get_dashboard_summary(req: Request, user=Depends(get_current_user)):
    try:
        body = await req.json()
        company_id = body.get("p_company_id")
        as_of_date = body.get("as_of_date") or datetime.utcnow().date().isoformat()
        start_date = body.get("start_date") or datetime.utcnow().date().isoformat()[:7] + "-01"
        end_date = body.get("end_date") or as_of_date

        where_company = "AND j.company_id = $1::text" if company_id else ""
        params_base = [company_id] if company_id else []
        p_idx = 2 if company_id else 1

        # Assets, Liabilities, Equity — balance sheet accounts as of today
        bs_rows = await prisma.query_raw(f"""
            SELECT a.type, SUM(jl.debit - jl.credit) AS net
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            WHERE j.status = 'POSTED'
              AND j.date <= ${p_idx}::date
              {where_company}
            GROUP BY a.type
        """, *params_base, as_of_date)

        type_sums: dict = {}
        for row in (bs_rows or []):
            type_sums[row["type"]] = float(row["net"] or 0)

        assets = type_sums.get("ASSET", 0)
        liabilities = -type_sums.get("LIABILITY", 0)
        equity = -type_sums.get("EQUITY", 0)

        # Revenue & Expenses — current period P&L
        pl_rows = await prisma.query_raw(f"""
            SELECT a.type, SUM(jl.debit - jl.credit) AS net
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            WHERE j.status = 'POSTED'
              AND j.date >= ${p_idx}::date
              AND j.date <= ${p_idx + 1}::date
              {where_company}
            GROUP BY a.type
        """, *params_base, start_date, end_date)

        for row in (pl_rows or []):
            type_sums[row["type"]] = float(row["net"] or 0)

        revenue = -type_sums.get("REVENUE", 0) + (-type_sums.get("OTHER_REVENUE", 0))
        expenses = type_sums.get("EXPENSE", 0) + type_sums.get("COST_OF_REVENUE", 0) + type_sums.get("OTHER_EXPENSE", 0)
        net_income = revenue - expenses

        # Cash balance — sum of ASSET accounts with 'cash' or 'bank' in name
        cash_rows = await prisma.query_raw(f"""
            SELECT SUM(jl.debit - jl.credit) AS cash
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            WHERE j.status = 'POSTED'
              AND j.date <= ${p_idx}::date
              AND a.type = 'ASSET'
              AND (LOWER(a.name) LIKE '%cash%' OR LOWER(a.name) LIKE '%bank%')
              {where_company}
        """, *params_base, as_of_date)

        cash_balance = float(cash_rows[0]["cash"] or 0) if cash_rows else 0

        return {
            "assets": round(assets, 2),
            "liabilities": round(liabilities, 2),
            "equity": round(equity, 2),
            "revenue": round(revenue, 2),
            "expenses": round(expenses, 2),
            "netIncome": round(net_income, 2),
            "cashBalance": round(cash_balance, 2),
            "cashInToday": 0,
            "cashOutToday": 0
        }

    except Exception as err:
        logger.error(f"Failed to fetch dashboard summary: {err}")
        raise HTTPException(status_code=500, detail=str(err))
