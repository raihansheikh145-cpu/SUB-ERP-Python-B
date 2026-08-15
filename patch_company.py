import os
filepath = 'backend/app/api/routers/company.py'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('return {"success": True, "data": companies}', 'print("COMPANIES RESPONSE:", companies)\n        return {"success": True, "data": companies}')

with open(filepath, 'w') as f:
    f.write(content)
