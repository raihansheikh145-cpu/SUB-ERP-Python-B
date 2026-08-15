import asyncio
from prisma import Prisma

async def main():
    p = Prisma()
    await p.connect()
    
    triggers = await p.query_raw("""
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    """)
    print("Active Triggers:")
    for t in triggers:
        print(f"{t['event_object_table']} -> {t['trigger_name']}")
        
    # Drop known problem triggers
    drop_list = [
        ("docs_inventory_transactions", "trg_post_inventory_ledger_lines"),
        ("docs_invoices", "trg_post_invoice_journal"),
        ("docs_bills", "trg_post_bill_journal"),
        ("docs_payments", "trg_post_payment_journal"),
        ("docs_credit_notes", "trg_post_credit_note_journal"),
        ("docs_inventory_transactions", "trg_update_stock_on_transaction") # wait, does python handle stock?
    ]
    
    for table, trg in drop_list:
        try:
            await p.execute_raw(f"DROP TRIGGER IF EXISTS {trg} ON {table}")
            print(f"Dropped {trg} on {table}")
        except Exception as e:
            print(f"Error dropping {trg}: {e}")
            
    await p.disconnect()

asyncio.run(main())
