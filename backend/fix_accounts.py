import asyncio
import json
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        # AR
        await prisma.execute_raw("""
            UPDATE docs_accounts 
            SET code = '100201', name = 'Accounts Receivable', 
                data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(COALESCE(data, '{}'::jsonb), '{code}', '"100201"'),
                            '{name}', '"Accounts Receivable"'
                        ),
                        '{type}', '"ASSET"'
                    ),
                    '{subType}', '"ACCOUNTS_RECEIVABLE"'
                )
            WHERE code = 'AR'
        """)
        
        # REV
        await prisma.execute_raw("""
            UPDATE docs_accounts 
            SET code = '400100', name = 'Sales Revenue', 
                data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(COALESCE(data, '{}'::jsonb), '{code}', '"400100"'),
                            '{name}', '"Sales Revenue"'
                        ),
                        '{type}', '"REVENUE"'
                    ),
                    '{subType}', '"REVENUE"'
                )
            WHERE code = 'REV'
        """)

        # TAX
        await prisma.execute_raw("""
            UPDATE docs_accounts 
            SET code = '200400', name = 'VAT/Tax Payable', 
                data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(COALESCE(data, '{}'::jsonb), '{code}', '"200400"'),
                            '{name}', '"VAT/Tax Payable"'
                        ),
                        '{type}', '"LIABILITY"'
                    ),
                    '{subType}', '"OTHER_CURRENT_LIABILITY"'
                )
            WHERE code = 'TAX'
        """)

        # COGS
        await prisma.execute_raw("""
            UPDATE docs_accounts 
            SET code = '500101', name = 'Cost of Goods Sold', 
                data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(COALESCE(data, '{}'::jsonb), '{code}', '"500101"'),
                            '{name}', '"Cost of Goods Sold"'
                        ),
                        '{type}', '"EXPENSE"'
                    ),
                    '{subType}', '"COGS"'
                )
            WHERE code = 'COGS'
        """)

        # INV
        await prisma.execute_raw("""
            UPDATE docs_accounts 
            SET code = '100501', name = 'Inventory Asset', 
                data = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(COALESCE(data, '{}'::jsonb), '{code}', '"100501"'),
                            '{name}', '"Inventory Asset"'
                        ),
                        '{type}', '"ASSET"'
                    ),
                    '{subType}', '"INVENTORY"'
                )
            WHERE code = 'INV'
        """)
        
        print("Successfully updated accounts.")
    except Exception as e:
        print("Error:", e)
    finally:
        await prisma.disconnect()

asyncio.run(main())
