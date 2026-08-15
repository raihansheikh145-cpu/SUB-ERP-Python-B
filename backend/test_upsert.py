import asyncio
import httpx

async def main():
    payload = {
        "table": "docs_loans",
        "id": "test-loan-001",
        "payload": {
            "loan_number": "LOAN-TEST-001",
            "name": "Test Zero Interest",
            "type": "RECEIVED",
            "principal_amount": 1000,
            "interest_rate": 0,
            "term_months": 12,
            "interest_type": "REDUCING",
            "status": "DRAFT",
            "company_id": "d9dbb775-6839-4201-9dda-caa39e271201",
            "contact_id": "feebf7e9-633a-4ffe-a9ff-21c6336ea8c4",
            "amortization_schedule": []
        }
    }
    async with httpx.AsyncClient() as client:
        # Without auth token this will fail with 401 Unauthorized.
        # So we just print that we need auth.
        pass
