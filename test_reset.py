import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.post("http://127.0.0.1:8000/api/auth/forgot-password", json={"email": "raihansheikh145@hotmail.com"})
        print(response.status_code)
        print(response.text)

asyncio.run(main())
