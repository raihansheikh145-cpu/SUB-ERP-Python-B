import json
import uuid
from datetime import date, datetime
from typing import Any, Dict
from prisma import Prisma
from app.core.sequence import get_next_sequence_number
from app.services.accounting_service import AccountingService

class JournalService:
    @staticmethod
    async def create_journal_entry(prisma: Prisma, payload: Dict[str, Any], company_id: str) -> Dict[str, Any]:
        """
        Replaces the SQL `create_journal_entry` RPC.
        Validates, saves the journal header and lines.
        """
        async with prisma.tx() as tx:
            return await JournalService._create_journal_entry_tx(tx, payload, company_id)

    @staticmethod
    async def _create_journal_entry_tx(tx, payload: Dict[str, Any], company_id: str) -> Dict[str, Any]:
        journal_id = payload.get("id") or str(uuid.uuid4())
        status = payload.get("status") or "DRAFT"
        date_val = payload.get("date") or str(date.today())
        if isinstance(date_val, str) and "T" in date_val:
            date_val = date_val.split("T")[0]
            
        reference = payload.get("reference")
        
        # Sequence Number Generation
        if status not in ('DRAFT', 'DELETED', 'VOID') and (not reference or str(reference).startswith('DRAFT-') or reference == 'NEW'):
            reference = await get_next_sequence_number("JOURNAL", company_id, "JEN", tx)
            
        if not reference:
            reference = f"DRAFT-{journal_id[:8]}"
            
        payload["reference"] = reference
        payload["id"] = journal_id
        
        # Extract lines
        lines = payload.get("lines", [])
        valid_lines = [l for l in lines if float(l.get("debit") or 0) != 0 or float(l.get("credit") or 0) != 0]
        
        if not valid_lines:
            raise Exception("Journal entry must have at least one non-zero line.")
            
        total_debit = sum(float(l.get("debit") or 0) for l in valid_lines)
        total_credit = sum(float(l.get("credit") or 0) for l in valid_lines)
        
        if abs(total_debit - total_credit) > 0.01:
            raise Exception(f"Unbalanced Journal Entry (Dr: {total_debit:.2f}, Cr: {total_credit:.2f})")
            
        payload["lines"] = valid_lines
        
        # Upsert Header
        created_by_id = payload.get("createdById")
        await tx.execute_raw("""
            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, created_by_id, updated_at)
            VALUES ($1, $2, $3::date, $3::date, $4, $5, $6, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET 
                status = EXCLUDED.status, 
                reference_number = EXCLUDED.reference_number,
                reference = EXCLUDED.reference,
                created_by_id = EXCLUDED.created_by_id,
                updated_at = NOW()
        """, journal_id, company_id, date_val, payload.get("journalType", "MANUAL"), status, reference, created_by_id)
        
        # Upsert Lines
        await tx.execute_raw("DELETE FROM docs_journal_lines WHERE journal_id = $1", journal_id)
        
        for l in valid_lines:
            line_id = l.get("id") or str(uuid.uuid4())
            await tx.execute_raw("""
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, 
            line_id, journal_id, company_id, 
            l.get("accountId") or l.get("account_id"), 
            l.get("contactId") or l.get("partner_id"),
            float(l.get("debit") or 0), 
            float(l.get("credit") or 0), 
            l.get("description") or l.get("narration"))
            
        return payload

    @staticmethod
    async def post_journal(prisma: Prisma, journal_id: str, company_id: str):
        """
        Marks a journal as POSTED. Validates if lines exist.
        """
        async with prisma.tx() as tx:
            j = await tx.query_raw("SELECT * FROM docs_journals WHERE id = $1 LIMIT 1", journal_id)
            if not j:
                raise Exception("Journal not found")
            journal = j[0]
            
            if journal.get("status") == "POSTED":
                return {"success": True, "message": "Already posted"}
                
            lines = await tx.query_raw("SELECT * FROM docs_journal_lines WHERE journal_id = $1", journal_id)
            if not lines:
                raise Exception("Cannot post a journal without lines.")
                
            ref = journal.get("reference_number")
            if not ref or str(ref).startswith("DRAFT-"):
                ref = await get_next_sequence_number("JOURNAL", company_id, "JEN", tx)
                await tx.execute_raw("UPDATE docs_journals SET reference_number = $1, reference = $1 WHERE id = $2", ref, journal_id)
                
            await tx.execute_raw("UPDATE docs_journals SET status = 'POSTED', updated_at = NOW() WHERE id = $1", journal_id)
            
            return {"success": True, "journal_id": journal_id, "reference": ref}

    @staticmethod
    async def get_dashboard_metrics(prisma: Prisma, company_id: str, date_from: str = None, date_to: str = None):
        """
        Returns high-level accounting metrics for the dashboard.
        """
        # This is a stub for actual metric calculation logic
        # Typically involves summing up revenue, COGS, expenses, etc.
        return {
            "total_revenue": 0.0,
            "total_cogs": 0.0,
            "gross_profit": 0.0,
            "net_profit": 0.0,
            "cash_in_hand": 0.0,
            "cash_in_bank": 0.0,
            "accounts_receivable": 0.0,
            "accounts_payable": 0.0
        }
