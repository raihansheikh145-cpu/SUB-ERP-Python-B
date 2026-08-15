import asyncio
import json
import os
from prisma import Prisma
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

async def main():
    p = Prisma()
    await p.connect()
    
    tables = [
        "docs_companies", "docs_users", "docs_accounts", "docs_contacts",
        "docs_products", "docs_inventory_transactions", "docs_invoices",
        "docs_invoice_lines", "docs_bills", "docs_bill_lines", 
        "docs_credit_notes", "docs_credit_note_lines", "docs_payments",
        "docs_journals", "docs_journal_lines", "docs_preferences"
    ]
    
    backup_data = {}
    
    for table in tables:
        try:
            records = await p.query_raw(f"SELECT * FROM {table}")
            
            # Serialize datetimes, decimals, etc.
            def serialize(obj):
                if hasattr(obj, 'isoformat'):
                    return obj.isoformat()
                import decimal
                if isinstance(obj, decimal.Decimal):
                    return float(obj)
                return obj

            serialized = []
            for r in records:
                serialized.append({k: serialize(v) for k, v in r.items()})
                
            backup_data[table] = serialized
            print(f"Backed up {table}: {len(records)} records")
        except Exception as e:
            print(f"Error backing up {table}: {e}")
            
    with open(os.path.join(os.path.dirname(__file__), '..', 'database_backup.json'), 'w') as f:
        json.dump(backup_data, f, indent=2)
        
    print("Backup complete!")
    await p.disconnect()

asyncio.run(main())
