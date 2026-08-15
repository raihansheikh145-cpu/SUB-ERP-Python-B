import json
import uuid
import httpx
import jwt

# Generate a fake user payload
payload = {
    "sub": str(uuid.uuid4()),
    "email": "demo@example.com",
    "role": "authenticated"
}

secret = "enterprise-erp-jwt-secret-fallback-key-2026"
token = jwt.encode(payload, secret, algorithm="HS256")

company_id = "00000000-0000-0000-0000-000000000000"
product_id = str(uuid.uuid4())

data = {
    "p_product": {
        "id": product_id,
        "company_id": company_id,
        "type": "PRODUCT",
        "company_ids": [company_id],
        "data": {
            "sku": "DEMO-003",
            "name": "Demo Product Pro",
            "cost_price": 25.00,
            "sales_price": 59.99,
            "description": "Created automatically."
        }
    }
}

response = httpx.post(
    "http://127.0.0.1:3001/api/products/upsert",
    json=data,
    headers={"Authorization": f"Bearer {token}"},
    timeout=10.0
)

print(response.status_code)
print(response.text)
