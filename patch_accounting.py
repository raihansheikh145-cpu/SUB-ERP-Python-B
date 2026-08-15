import os
import re

file_path = "backend/app/services/accounting_service.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace empty strings for UUIDs and contact_id -> entity_id in post_credit_note
new_content = content.replace(
    'customer_id = cn.get("customer_id")',
    'customer_id = cn.get("customer_id")\n        if not customer_id: customer_id = None'
)

new_content = new_content.replace(
    'invoice_id = cn.get("origin_invoice_id")',
    'invoice_id = cn.get("origin_invoice_id")\n        if not invoice_id: invoice_id = None'
)

# Fix the AR insert query
old_ar_insert = """          await tx.execute_raw(\"\"\"
              INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
              VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
          \"\"\", f"JL-{journal_id}-ar", journal_id, effective_company_id, ar_acc, customer_id, total_credit, f"Credit Note: {cn_number}")"""

new_ar_insert = """          await tx.execute_raw(\"\"\"
              INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, entity_id, debit, credit, description)
              VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
          \"\"\", f"JL-{journal_id}-ar", journal_id, effective_company_id, ar_acc, customer_id, total_credit, f"Credit Note: {cn_number}")"""

new_content = new_content.replace(old_ar_insert, new_ar_insert)

# Also wrap the whole body in a try except to log to a file
old_def = 'async def post_credit_note(tx, cn_id: str, company_id: str = None):'
new_def = '''async def post_credit_note(tx, cn_id: str, company_id: str = None):
        try:'''

# Indent the whole body
parts = new_content.split('async def post_credit_note(tx, cn_id: str, company_id: str = None):')
body = parts[1]
next_def = body.find('    @staticmethod\n    async def post_payment(')
if next_def == -1:
    next_def = len(body)
    
post_cn_body = body[:next_def]
remaining = body[next_def:]

# indent
indented = '\n'.join(['    ' + line if line.strip() else line for line in post_cn_body.split('\n')])

# Add except block
indented += '''
        except Exception as e:
            import traceback
            import logging
            logging.error(f"ERROR IN POST_CREDIT_NOTE: {str(e)}")
            logging.error(traceback.format_exc())
            raise e
'''

final_content = parts[0] + new_def + indented + remaining

with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)
    
print("Patched accounting_service.py successfully.")
