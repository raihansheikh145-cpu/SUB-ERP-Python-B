import asyncio
import json
import uuid
import traceback
from app.core.db import prisma

async def main():
    try:
        await prisma.connect()
        pid = str(uuid.uuid4())
        data_str = json.dumps({"test": "data"})
        # 1. Test standard string cast
        await prisma.execute_raw("""
            INSERT INTO docs_payments (id, data, company_id) VALUES ($1, CAST($2 AS jsonb), 'test-co')
        """, pid, data_str)
        with open("output.txt", "w") as f: f.write("Inserted successfully with CAST")
    except Exception as e:
        with open("output.txt", "w") as f:
            f.write(f"Error with CAST: {e}\n{traceback.format_exc()}")
    
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
