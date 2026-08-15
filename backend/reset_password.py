import asyncio
import os
from dotenv import load_dotenv
from app.core.db import prisma
import bcrypt

load_dotenv()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def main():
    await prisma.connect()
    
    email = "raihansheikh145@gmail.com"
    new_password = "password123"
    hashed = hash_password(new_password)
    
    user = await prisma.authuser.update(
        where={"email": email},
        data={"hashedPassword": hashed}
    )
    
    print(f"Password for {email} reset to: {new_password}")
    
    await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
