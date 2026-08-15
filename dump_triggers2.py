import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'docs_invoices'")
res = cur.fetchall()
for r in res:
    print(f"Trigger: {r[0]}")
    print(r[1])
    print("-" * 20)
conn.close()
