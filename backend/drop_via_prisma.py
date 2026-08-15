import asyncio
from prisma import Prisma

async def main():
    prisma = Prisma()
    await prisma.connect()
    
    try:
        await prisma.execute_raw("DROP FUNCTION IF EXISTS public.post_invoice(text, text)")
        await prisma.execute_raw("DROP FUNCTION IF EXISTS public.post_bill(text, text)")
        print("Legacy functions dropped via Prisma.")
    except Exception as e:
        print("Error:", e)
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
