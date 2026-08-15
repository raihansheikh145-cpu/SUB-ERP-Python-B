
import httpx
import asyncio

async def test_flow():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Login to get token
        login_res = await client.post("/api/auth/login", json={"email": "superadmin@sub-erp.local", "password": "000000"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
        
        token = login_res.json()["token"]
        print("Got token")
        
        # 2. Fetch companies
        headers = {"Authorization": f"Bearer {token}"}
        comp_res = await client.get("/api/companies/", headers=headers)
        if comp_res.status_code != 200:
            comp_res = await client.get("/api/companies", headers=headers)
        
        companies = comp_res.json().get("data", [])
        print(f"Found {len(companies)} companies")
        if len(companies) == 0:
            print("No companies found!")
            return
            
        company_id = companies[0]["id"]
        company_name = companies[0].get("name")
        print(f"Selected company: {company_id} ({company_name})")
        
        # 3. Create a chart of account
        acc_payload = {
            "id": f"acc_{company_id}_test1",
            "data": {
                "name": "Test Account by AI",
                "type": "ASSET",
                "company_id": company_id
            }
        }
        upsert_res = await client.post("/api/accounts/upsert", json=acc_payload, headers=headers)
        print("Upsert account result:", upsert_res.text)

asyncio.run(test_flow())

