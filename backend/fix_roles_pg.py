import os
import psycopg2

def update_users():
    db_url = "postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true"
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("UPDATE public.auth_users SET role = 'role-superadmin' WHERE role = 'authenticated'")
    print('UPDATED USERS:', cur.rowcount)
    conn.commit()
    cur.close()
    conn.close()

update_users()
