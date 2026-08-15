import asyncio
from prisma import Prisma
import os

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    db = Prisma()
    await db.connect()
    c = await db.query_raw("SELECT id, name FROM docs_contacts WHERE id LIKE 'f75e1e%'")
    print("Contacts in DB:", c)
    await db.disconnect()
asyncio.run(main())
