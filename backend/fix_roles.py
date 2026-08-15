import asyncio
from app.core.db import prisma

async def update_users():
    await prisma.connect()
    res = await prisma.execute_raw("UPDATE public.auth_users SET role = 'role-superadmin' WHERE role = 'authenticated'")
    print('UPDATED USERS:', res)
    await prisma.disconnect()

asyncio.run(update_users())
