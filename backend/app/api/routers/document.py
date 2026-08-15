from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
from app.core.pdf_generator import generate_pdf

router = APIRouter(tags=["Documents"])
logger = logging.getLogger(__name__)

@router.post("/unpost")
async def unpost_document(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        doc_type = body.get("type")
        doc_id = body.get("id")
        journal_entry_id = body.get("journalEntryId")
        
        if not doc_type or not doc_id:
            return {"success": False, "error": "Type and ID are required"}

        # Begin safe unpost sequence
        if doc_type == 'BILL':
            await prisma.execute_raw(
                "DELETE FROM docs_inventory_transactions WHERE reference_id = $1",
                doc_id
            )

        if journal_entry_id:
            await prisma.execute_raw(
                "UPDATE docs_journals SET status = 'DRAFT' WHERE id = $1",
                journal_entry_id
            )

        # Reset primary document
        table = ''
        if doc_type == 'INVOICE': table = 'docs_invoices'
        elif doc_type == 'BILL': table = 'docs_bills'
        elif doc_type == 'JOURNAL': table = 'docs_journals'
        elif doc_type == 'CREDIT_NOTE': table = 'docs_credit_notes'

        if table:
            # We fetch the record, modify its data JSONB, and save it back
            # or just rely on jsonb_set in Postgres to avoid parsing issues
            await prisma.execute_raw(f'''
                UPDATE {table} 
                SET status = 'DRAFT', 
                    data = CASE 
                        WHEN data IS NOT NULL AND jsonb_typeof(data) = 'object' THEN jsonb_set(data, '{{status}}', '"DRAFT"')
                        ELSE data 
                    END
                WHERE id = $1
            ''', doc_id)

        logger.info(f"Successfully unposted {doc_type} {doc_id}")
        return {"success": True, "message": f"{doc_type} unposted successfully"}

    except Exception as err:
        logger.error(f"Failed to unpost document: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/delete")
async def delete_document(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        doc_type = body.get("type")
        doc_id = body.get("id")
        
        if not doc_type or not doc_id:
            return {"success": False, "error": "Type and ID are required"}

        if doc_type == 'JOURNAL':
            try:
                await prisma.execute_raw(
                    "DELETE FROM docs_journals WHERE id = $1",
                    doc_id
                )
            except Exception as e:
                err_msg = str(e)
                if '23503' in err_msg or 'foreign key' in err_msg.lower():
                    raise HTTPException(status_code=400, detail="Cannot delete this journal entry because it is linked to other documents (like invoices, bills, or payments). Delete them first.")
                raise e

        logger.info(f"Successfully deleted {doc_type} {doc_id}")
        return {"success": True, "message": f"{doc_type} deleted successfully"}

    except Exception as err:
        logger.error(f"Failed to delete document: {err}")
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/upsert")
async def upsert_document(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        table = body.get("table")
        payload = body.get("payload")
        
        if not table or not payload:
            return {"success": False, "error": "Table and payload are required"}
            
        allowed_tables = [
            "docs_financial_periods", "docs_fiscal_periods", "docs_idempotency_keys", 
            "docs_system_logs", "docs_accounts"
        ]
        
        if table not in allowed_tables:
            logger.warning(f"Unauthorized table upsert attempted: {table}")
            return {"success": False, "error": f"Upserts to {table} are not allowed via generic endpoint."}
            
        # Perform dynamic upsert using jsonb
        doc_id = payload.get("id")
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
            payload["id"] = doc_id
            
        query = f"""
            INSERT INTO {table} (id, data, updated_at) 
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
        """
        await prisma.execute_raw(query, doc_id, json.dumps(payload))
        
        return {"success": True, "data": payload}
        
    except Exception as err:
        logger.error(f"Failed to generic upsert: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/invoice/{doc_id}/pdf")
async def get_invoice_pdf(doc_id: str):
    try:
        # Fetch invoice
        invoice_res = await prisma.query_raw(
            "SELECT data, company_id FROM docs_invoices WHERE id = $1 LIMIT 1", doc_id
        )
        if not invoice_res or len(invoice_res) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice_data = invoice_res[0].get("data")
        if isinstance(invoice_data, str):
            invoice_data = json.loads(invoice_data)
            
        company_id = invoice_res[0].get("company_id") or invoice_data.get("companyId")
        
        # Fetch company
        company_data = {}
        if company_id:
            comp_res = await prisma.query_raw(
                "SELECT data FROM docs_companies WHERE id = $1 LIMIT 1", company_id
            )
            if comp_res and len(comp_res) > 0:
                c_data = comp_res[0].get("data")
                company_data = json.loads(c_data) if isinstance(c_data, str) else c_data
                
        # Fetch contact (client)
        client_data = {}
        client_id = invoice_data.get("clientId") or invoice_data.get("contactId")
        if client_id:
            cont_res = await prisma.query_raw(
                "SELECT data FROM docs_contacts WHERE id = $1 LIMIT 1", client_id
            )
            if cont_res and len(cont_res) > 0:
                c_data = cont_res[0].get("data")
                client_data = json.loads(c_data) if isinstance(c_data, str) else c_data
                
        context = {
            "invoice": invoice_data,
            "company": company_data,
            "client": client_data
        }
        
        pdf_bytes = await generate_pdf("invoice.html", context)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{invoice_data.get('invoiceNumber', doc_id)}.pdf"
            }
        )
    except Exception as err:
        logger.error(f"Failed to generate invoice PDF: {err}")
        raise HTTPException(status_code=500, detail=str(err))
