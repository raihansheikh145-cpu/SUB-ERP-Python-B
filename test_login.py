import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/api/auth/login", json={"email": "raihansheikh145@hotmail.com", "password": "password"})
        print(response.status_code)
        print(response.text)

asyncio.run(main())
