import os

def check():
    path = "backend/app/services"
    found = False
    for fn in os.listdir(path):
        if fn.endswith('.py'):
            with open(os.path.join(path, fn), 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    if "data = " in line and ("EXCLUDED.data" in line or "::jsonb" in line):
                        print(f"FOUND IN {fn}:{i+1}: {line.strip()}")
                        found = True
    if not found:
        print("NO DATA ASSIGNMENTS FOUND IN SERVICES")

check()
