import asyncio
import httpx
import uuid
import json
import base64

async def test():
    # Create fake JWT
    header = base64.b64encode(b'{"alg":"HS256","typ":"JWT"}').decode()
    payload = base64.b64encode(b'{"sub":"0915038d-27d3-441c-b702-ebf2ae411679"}').decode()
    token = f"{header}.{payload}.fake_signature"

    dbId = str(uuid.uuid4())
    cid = "00000000-0000-0000-0000-000000000000"
    
    newProductRest = {
      "taxCode": "TAX-0",
      "invoicingPolicy": "Ordered quantities",
      "trackInventory": True,
      "canBeSold": True,
      "canBeExpensed": False,
      "canBePurchased": True,
      "isInPos": True,
      "type": "Goods",
      "uom": "Pcs",
      "trackingType": "NONE",
      "serialNumbers": [],
      "lastPurchasePrice": 120,
      "initialCost": 120,
      "costPrice": 120
    }
    
    body = {
      "p_product": {
          "id": dbId,
          "data": newProductRest,
          "company_id": cid,
          "company_ids": [cid],
          "name": "Frontend Mimic Product",
          "sku": "",
          "price": 200,
          "description": "Test frontend",
          "category": "All",
          "brand": "",
          "type": "Goods",
          "uom": "Pcs",
          "track_inventory": True,
          "can_be_sold": True,
          "can_be_purchased": True,
          "updated_at": "2026-07-27T10:00:00Z"
      }
    }
    
    print(f"Sending payload for {dbId}")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://localhost:3000/api/products/upsert",
            json=body,
            headers={"Authorization": f"Bearer {token}"}
        )
        print("Status:", res.status_code)
        print("Body:", res.text)
        
if __name__ == "__main__":
    asyncio.run(test())
