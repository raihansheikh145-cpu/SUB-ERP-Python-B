import asyncio
from prisma import Prisma
import bcrypt

async def main():
    db = Prisma()
    await db.connect()
    
    password = b"12345678"
    hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
    
    await db.authuser.update(
        where={"email": "raihansheikh145@hotmail.com"},
        data={"hashedPassword": hashed}
    )
    print("Password updated to 12345678")
    await db.disconnect()

asyncio.run(main())
