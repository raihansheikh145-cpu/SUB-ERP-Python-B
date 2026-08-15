import asyncio
from app.core.db import prisma
import bcrypt

async def main():
    await prisma.connect()
    
    # Get all docs_users
    users = await prisma.docsuser.find_many()
    for user in users:
        # Check if authuser exists
        existing = await prisma.authuser.find_unique(where={"email": user.email})
        if not existing:
            # Use pin or default 123456
            password = user.pin if user.pin and len(user.pin) >= 6 else "123456"
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            await prisma.authuser.create(data={
                "id": user.userUuid,
                "email": user.email,
                "hashedPassword": hashed,
                "role": user.roleId or "role-admin",
                "isActive": True
            })
            print(f"Created AuthUser for {user.email}")
            
    await prisma.disconnect()

asyncio.run(main())
