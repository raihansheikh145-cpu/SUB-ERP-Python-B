import asyncio
from prisma import Prisma

sql = """
DO $$
DECLARE
    rec RECORD;
    v_loan_acc uuid;
BEGIN
    FOR rec IN SELECT * FROM docs_companies LOOP
        -- Ensure 100601 exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '100601') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, updated_at) 
            VALUES (v_loan_acc, rec.id, '100601', 'Loan Receivable', 'ASSET', NOW());
        END IF;

        -- Ensure 210100 exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '210100') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, updated_at) 
            VALUES (v_loan_acc, rec.id, '210100', 'Loan Payable', 'LIABILITY', NOW());
        END IF;

        -- Ensure 500208 (Interest Expense) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '500208') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, updated_at) 
            VALUES (v_loan_acc, rec.id, '500208', 'Interest Expense', 'EXPENSE', NOW());
        END IF;

        -- Ensure 400200 (Interest Income) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '400200') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, updated_at) 
            VALUES (v_loan_acc, rec.id, '400200', 'Interest Income', 'REVENUE', NOW());
        END IF;
    END LOOP;
END;
$$;
"""

async def main():
    db = Prisma()
    await db.connect()
    print("Running patch_loan_accounts.sql...")
    await db.execute_raw(sql)
    print("Patch applied successfully.")
    
    # Also update post_loan_rpc in the DB
    with open("../database/schema.sql", "r") as f:
        schema_sql = f.read()
    
    import re
    match = re.search(r'(CREATE OR REPLACE FUNCTION public\.post_loan_rpc.*?)\$function\$;', schema_sql, re.DOTALL)
    if match:
        print("Updating post_loan_rpc...")
        await db.execute_raw(match.group(0))
        print("Updated post_loan_rpc successfully.")
    else:
        print("Could not find post_loan_rpc in schema.sql")
        
    await db.disconnect()

asyncio.run(main())
