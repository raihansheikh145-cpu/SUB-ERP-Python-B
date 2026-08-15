import asyncio
from app.core.db import prisma
from app.services.payment_service import PaymentService

async def main():
    await prisma.connect()
    payload = {
        "amount": 500,
        "type": "PAYMENT",
        "status": "POSTED",
        "companyId": "test-co",
        "applied_bills": []
    }
    try:
        payment_id = await PaymentService.save_payment(prisma, payload)
        print("Payment saved:", payment_id)
        from app.services.accounting_service import AccountingService
        await AccountingService.post_payment(prisma, payment_id, None)
        print("Payment posted")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", repr(e))
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
