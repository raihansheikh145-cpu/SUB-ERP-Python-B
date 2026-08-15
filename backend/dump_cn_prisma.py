import asyncio
from prisma import Prisma

async def main():
    prisma = Prisma()
    await prisma.connect()
    
    try:
        funcs = ['create_credit_note', 'process_credit_note', 'post_credit_note']
        for fn in funcs:
            res = await prisma.query_raw(
                f"SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname='{fn}' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1"
            )
            if res:
                with open(f"backend/{fn}_dump.txt", "w") as f:
                    f.write(res[0]["def"])
                print(f"Dumped {fn}")
            else:
                print(f"{fn} not found")
    except Exception as e:
        print("Error:", e)
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
