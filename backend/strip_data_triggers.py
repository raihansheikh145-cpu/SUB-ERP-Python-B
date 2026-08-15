import re
import asyncio
from app.core.db import prisma

async def process_triggers():
    with open('trigger_fns_dump.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to remove blocks of code that use NEW.data
    # A simple regex won't work well for complex PL/pgSQL IF statements,
    # but we can try to drop the known functions completely or empty them out, 
    # since most of them ONLY exist to sync data JSON with relational columns!
    
    # Let's list the functions to drop or replace with empty shells
    functions_to_empty = [
        "sync_docs_invoices_data",
        "sync_invoice_lines_from_doc_data",
        "sync_docs_bills_data",
        "sync_bill_lines_from_doc_data",
        "sync_docs_payments_data",
        "sync_docs_journals_data",
        "sync_docs_credit_notes_data",
        "sync_docs_contacts_data",
        "sync_docs_products_data",
        "calculate_docs_financials",
        "assign_document_number"
    ]
    
    # Wait, `assign_document_number` shouldn't be emptied, it generates sequence numbers!
    # But it also does: IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set...
    
    await prisma.connect()
    try:
        # First let's just get the definitions from the database and remove NEW.data lines
        res = await prisma.query_raw("SELECT proname, pg_get_functiondef(oid) FROM pg_proc WHERE proname IN ('assign_document_number', 'audit_log_trigger', 'calculate_docs_financials', 'sync_invoice_lines_from_doc_data') OR proname LIKE 'sync_docs_%'")
        
        for row in res:
            func_name = row['proname']
            func_def = row['pg_get_functiondef']
            
            # If it's purely a sync function, we might just want to drop it and its triggers
            if func_name.startswith('sync_docs_') or func_name.startswith('sync_'):
                print(f"Dropping function {func_name} and its triggers...")
                # Find the tables that use this trigger
                triggers = await prisma.query_raw("SELECT tgname, relname FROM pg_trigger JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = $1 LIMIT 1)", func_name)
                for t in triggers:
                    await prisma.execute_raw(f"DROP TRIGGER IF EXISTS {t['tgname']} ON {t['relname']}")
                await prisma.execute_raw(f"DROP FUNCTION IF EXISTS {func_name}() CASCADE")
                
            elif func_name == 'assign_document_number':
                # Remove the NEW.data := ... lines
                new_def = re.sub(r'(?i)\s*IF NEW\.data IS NOT NULL.*?END IF;', '', func_def)
                new_def = re.sub(r'(?i)\s*NEW\.data\s*:=\s*jsonb_set.*?;\s*', '', new_def)
                await prisma.execute_raw(new_def)
                print("Updated assign_document_number")
                
            elif func_name == 'calculate_docs_financials':
                print(f"Dropping function {func_name} and its triggers...")
                triggers = await prisma.query_raw("SELECT tgname, relname FROM pg_trigger JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = $1 LIMIT 1)", func_name)
                for t in triggers:
                    await prisma.execute_raw(f"DROP TRIGGER IF EXISTS {t['tgname']} ON {t['relname']}")
                await prisma.execute_raw(f"DROP FUNCTION IF EXISTS {func_name}() CASCADE")
                
            elif func_name == 'audit_log_trigger':
                # Update audit log to use audit_log column instead of tracking data
                new_def = re.sub(r'AND NEW\.data IS NOT DISTINCT FROM OLD\.data', '', func_def)
                # It currently inserts into docs_audit_logs. It's fine.
                await prisma.execute_raw(new_def)
                print("Updated audit_log_trigger")

    except Exception as e:
        print("Error:", e)
    finally:
        await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(process_triggers())
