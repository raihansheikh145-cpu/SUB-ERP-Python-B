import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.get('http://127.0.0.1:8000/api/docs?table=docs_invoices&company_ids=d9dbb775-6839-4201-9dda-caa39e271201')
        invoices = res.json().get('data', [])
        print("Statuses:", set(i.get('status') for i in invoices))
        
        pending = [i for i in invoices if i.get('status') == 'DRAFT']
        if not pending:
            print("No pending invoices found, creating one...")
            payload = {
                "company_id": "d9dbb775-6839-4201-9dda-caa39e271201",
                "customer_id": "9277ba2f-17f5-49c7-a342-c14128382473",
                "date": "2026-08-07",
                "due_date": "2026-08-14",
                "status": "DRAFT",
                "items": [{
                    "productId": "8f8da0ab-e95e-406a-935f-460ce9a0f0ce",
                    "description": "Test Product",
                    "quantity": 1,
                    "unitPrice": 500,
                    "type": "PRODUCT"
                }]
            }
            res = await client.post('http://127.0.0.1:8000/api/invoices/create', json=payload)
            print("Create response:", res.status_code, res.text)
            if res.status_code == 200:
                inv_id = res.json().get('id')
                print(f"Created DRAFT invoice {inv_id}")
            else:
                return
        else:
            inv_id = pending[0]['id']
            print(f"Found DRAFT invoice {inv_id}")
            
        print(f"Posting invoice {inv_id}")
        post_res = await client.post('http://127.0.0.1:8000/api/invoices/post', json={"id": inv_id})
        print(post_res.status_code)
        print(post_res.text)

asyncio.run(main())
