import os

file_path = "../src/store/useAccountingStore.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Simple string replace
old_str = "token ? `Bearer ${token}` : ''"
new_str = "localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : ''"

content = content.replace(old_str, new_str)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched tokens successfully!")
