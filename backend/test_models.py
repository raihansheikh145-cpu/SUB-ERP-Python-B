import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        print(dir(prisma))
        print("Model docspayments exists:", hasattr(prisma, "docspayments"))
        print("Model docs_payments exists:", hasattr(prisma, "docs_payments"))
        print("Model docspayment exists:", hasattr(prisma, "docspayment"))
    except Exception as e:
        print("Err:", e)
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
