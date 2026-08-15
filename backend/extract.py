import json

with open("post_invoice_fn.json", "r", encoding="utf-8") as f:
    data = json.load(f)

fn_code = data["data"][0]["fn"]

with open("post_invoice_original.sql", "w", encoding="utf-8") as f:
    f.write(fn_code)
