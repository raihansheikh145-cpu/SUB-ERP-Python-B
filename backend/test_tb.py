import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    
    query = """
        SELECT a.type as account_type, SUM(jl.debit) as total_debit, SUM(jl.credit) as total_credit,
               SUM(jl.debit - jl.credit) as net
        FROM docs_journal_lines jl
        JOIN docs_accounts a ON jl.account_id = a.id
        JOIN docs_journals j ON jl.journal_id = j.id
        WHERE j.status = 'POSTED'
        GROUP BY a.type
    """
    res = await db.query_raw(query)
    
    total_assets = 0
    total_liabilities = 0
    total_equity = 0
    total_revenue = 0
    total_expenses = 0
    
    print(f"{'Account Type':<20} | {'Debit':<15} | {'Credit':<15} | {'Net':<15}")
    print("-" * 70)
    for row in res:
        print(f"{row['account_type']:<20} | {row['total_debit']:<15.2f} | {row['total_credit']:<15.2f} | {row['net']:<15.2f}")
        t = row['account_type']
        net = row['net']
        if t == 'ASSET': total_assets += net
        elif t == 'LIABILITY': total_liabilities -= net
        elif t == 'EQUITY': total_equity -= net
        elif t == 'REVENUE': total_revenue -= net
        elif t == 'EXPENSE': total_expenses += net
        
    print("-" * 70)
    print(f"Total Assets:       {total_assets:.2f}")
    print(f"Total Liabilities:  {total_liabilities:.2f}")
    print(f"Total Equity:       {total_equity:.2f}")
    print(f"Total Revenue:      {total_revenue:.2f}")
    print(f"Total Expenses:     {total_expenses:.2f}")
    
    net_income = total_revenue - total_expenses
    print(f"Net Income:         {net_income:.2f}")
    
    total_l_and_e = total_liabilities + total_equity + net_income
    print(f"\nAssets ({total_assets:.2f}) == Liabilities + Equity ({total_l_and_e:.2f}) ? {abs(total_assets - total_l_and_e) < 0.01}")

    await db.disconnect()

asyncio.run(main())
