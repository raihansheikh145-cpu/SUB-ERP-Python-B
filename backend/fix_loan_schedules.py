import asyncio
from prisma import Prisma
import os, json
from datetime import datetime
from dateutil.relativedelta import relativedelta

def calculate_schedule(principal, rate, months, type, start_date):
    schedule = []
    if months <= 0 or principal <= 0:
        return schedule
    
    monthly_rate = (rate / 100) / 12
    if type == "REDUCING":
        if monthly_rate == 0:
            pmt = float(principal) / months
        else:
            pmt = float(principal) * monthly_rate * pow(1 + monthly_rate, months) / (pow(1 + monthly_rate, months) - 1)
        
        balance = float(principal)
        current_date = start_date
        
        for i in range(1, months + 1):
            current_date = current_date + relativedelta(months=1)
            interest = balance * monthly_rate
            principal_payment = pmt - interest
            
            if i == months:
                principal_payment = balance
            
            balance -= principal_payment
            
            schedule.append({
                "period": i,
                "date": current_date.isoformat() + "Z",
                "principal": round(principal_payment, 2),
                "interest": round(interest, 2),
                "payment": round(principal_payment + interest, 2),
                "balance": max(0.0, round(balance, 2)),
                "status": "PENDING"
            })
    else: # FLAT
        total_interest = float(principal) * (rate / 100) * (months / 12)
        monthly_interest = total_interest / months
        monthly_principal = float(principal) / months
        pmt = monthly_principal + monthly_interest
        
        balance = float(principal)
        current_date = start_date
        
        for i in range(1, months + 1):
            current_date = current_date + relativedelta(months=1)
            principal_payment = monthly_principal
            if i == months:
                principal_payment = balance
            balance -= principal_payment
            
            schedule.append({
                "period": i,
                "date": current_date.isoformat() + "Z",
                "principal": round(principal_payment, 2),
                "interest": round(monthly_interest, 2),
                "payment": round(pmt, 2),
                "balance": max(0.0, round(balance, 2)),
                "status": "PENDING"
            })
    return schedule

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    
    db = Prisma()
    await db.connect()
    
    loans = await db.query_raw("SELECT id, principal_amount, amount, interest_rate, term_months, interest_type, start_date, amortization_schedule FROM docs_loans WHERE jsonb_array_length(COALESCE(amortization_schedule, '[]'::jsonb)) = 0 AND term_months > 0")
    print(f"Found {len(loans)} loans without schedules.")
    
    for loan in loans:
        principal = float(loan["principal_amount"] or loan["amount"] or 0)
        if principal <= 0:
            continue
            
        rate = float(loan["interest_rate"] or 0)
        months = int(loan["term_months"])
        ltype = loan["interest_type"] or "REDUCING"
        
        start_dt = loan["start_date"]
        if isinstance(start_dt, str):
            start_dt = datetime.fromisoformat(start_dt.replace("Z", ""))
        elif not start_dt:
            start_dt = datetime.utcnow()
            
        schedule = calculate_schedule(principal, rate, months, ltype, start_dt)
        if schedule:
            await db.execute_raw("UPDATE docs_loans SET amortization_schedule = $1::jsonb WHERE id = $2", json.dumps(schedule), loan["id"])
            print(f"Fixed schedule for loan {loan['id']}")
            
    await db.disconnect()

asyncio.run(main())
