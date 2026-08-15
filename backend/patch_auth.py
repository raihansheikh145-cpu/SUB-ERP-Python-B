
path = "app/api/routers/auth.py"
with open(path, "r") as f:
    content = f.read()

new_endpoint = """
@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"success": True, "user": user}
"""

if "/me" not in content:
    with open(path, "a") as f:
        f.write(new_endpoint)
    print("Added /me endpoint to auth.py")
else:
    print("Endpoint already exists")

