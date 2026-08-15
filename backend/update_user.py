import asyncio
from app.core.db import prisma

async def update():
    await prisma.connect()
    await prisma.execute_raw("UPDATE docs_users SET role_id = 'role-superadmin'")
    print('Updated role to superadmin')
    await prisma.disconnect()

asyncio.run(update())
