import asyncio
from app.core.db import prisma
import json

INITIAL_ACCOUNTS = [
    {'id': '100100', 'code': '100100', 'name': 'Cash', 'type': 'ASSET', 'subType': 'CASH'},
    {'id': '100201', 'code': '100201', 'name': 'Accounts Receivable', 'type': 'ASSET', 'subType': 'ACCOUNTS_RECEIVABLE'},
    {'id': '100300', 'code': '100300', 'name': 'Advance to Suppliers', 'type': 'ASSET', 'subType': 'OTHER_CURRENT_ASSET'},
    {'id': '100400', 'code': '100400', 'name': 'Prepaid Expenses', 'type': 'ASSET', 'subType': 'OTHER_CURRENT_ASSET'},
    {'id': '100501', 'code': '100501', 'name': 'Inventory Asset', 'type': 'ASSET', 'subType': 'INVENTORY'},
    {'id': '100502', 'code': '100502', 'name': 'Finished Goods', 'type': 'ASSET', 'subType': 'INVENTORY'},
    {'id': '200101', 'code': '200101', 'name': 'Accounts Payable', 'type': 'LIABILITY', 'subType': 'ACCOUNTS_PAYABLE'},
    {'id': '200201', 'code': '200201', 'name': 'Credit Card', 'type': 'LIABILITY', 'subType': 'CREDIT_CARD'},
    {'id': '200300', 'code': '200300', 'name': 'Advance from Customers', 'type': 'LIABILITY', 'subType': 'OTHER_CURRENT_LIABILITY'},
    {'id': '200400', 'code': '200400', 'name': 'VAT/Tax Payable', 'type': 'LIABILITY', 'subType': 'OTHER_CURRENT_LIABILITY'},
    {'id': '200500', 'code': '200500', 'name': 'Accrued Expenses', 'type': 'LIABILITY', 'subType': 'OTHER_CURRENT_LIABILITY'},
    {'id': '300100', 'code': '300100', 'name': "Owner's Equity", 'type': 'EQUITY', 'subType': 'EQUITY'},
    {'id': '300200', 'code': '300200', 'name': 'Retained Earnings', 'type': 'EQUITY', 'subType': 'RETAINED_EARNINGS'},
    {'id': '400100', 'code': '400100', 'name': 'Sales Revenue', 'type': 'REVENUE', 'subType': 'REVENUE'},
    {'id': '400200', 'code': '400200', 'name': 'Service Revenue', 'type': 'REVENUE', 'subType': 'REVENUE'},
    {'id': '400300', 'code': '400300', 'name': 'Discount Given', 'type': 'REVENUE', 'subType': 'REVENUE'},
    {'id': '400400', 'code': '400400', 'name': 'Other Income', 'type': 'REVENUE', 'subType': 'OTHER_REVENUE'},
    {'id': '500101', 'code': '500101', 'name': 'Cost of Goods Sold', 'type': 'EXPENSE', 'subType': 'COGS'},
    {'id': '600100', 'code': '600100', 'name': 'Rent Expense', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600200', 'code': '600200', 'name': 'Utility Expense', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600300', 'code': '600300', 'name': 'Salary Expense', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600400', 'code': '600400', 'name': 'Office Supplies', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600500', 'code': '600500', 'name': 'Bank Charges', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600600', 'code': '600600', 'name': 'Travel Expense', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600700', 'code': '600700', 'name': 'Meals and Entertainment', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600800', 'code': '600800', 'name': 'Marketing & Advertising', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '600900', 'code': '600900', 'name': 'Repairs & Maintenance', 'type': 'EXPENSE', 'subType': 'EXPENSE'},
    {'id': '601000', 'code': '601000', 'name': 'Inventory Shrinkage', 'type': 'EXPENSE', 'subType': 'EXPENSE'}
]

async def seed():
    await prisma.connect()
    try:
        companies = await prisma.query_raw('SELECT id FROM docs_companies')
        print(f'Found {len(companies)} companies.')
        count = 0
        for comp in companies:
            c_id = comp['id']
            for acc in INITIAL_ACCOUNTS:
                acc_id = f"{c_id}-{acc['code']}"
                
                # Make sure the data column matches what the frontend expects
                data_json = json.dumps({
                    'id': acc_id,
                    'companyId': c_id,
                    'code': acc['code'],
                    'name': acc['name'],
                    'type': acc['type'],
                    'subType': acc['subType']
                })
                
                escaped_name = acc['name'].replace("'", "''")
                escaped_data = data_json.replace("'", "''")
                
                await prisma.execute_raw(f'''
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data)
                    VALUES (
                        '{acc_id}', 
                        '{c_id}', 
                        '{acc['code']}', 
                        '{escaped_name}', 
                        '{acc['type']}', 
                        '{escaped_data}'
                    )
                    ON CONFLICT (id) DO NOTHING
                ''')
                count += 1
        print(f'Successfully processed {count} potential account insertions.')
    except Exception as e:
        print('Error:', e)
    finally:
        await prisma.disconnect()

asyncio.run(seed())
