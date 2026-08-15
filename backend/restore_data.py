import json
import psycopg2
from psycopg2 import sql

def main():
    conn = psycopg2.connect("postgresql://postgres:123456@localhost:5432/sub_erp")
    conn.autocommit = True
    cur = conn.cursor()

    with open('database_backup.json', 'r') as f:
        data = json.load(f)

    # Fetch column types to handle JSON/JSONB properly
    cur.execute("""
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
    """)
    col_types = {}
    for table, col, dtype in cur.fetchall():
        if table not in col_types:
            col_types[table] = {}
        col_types[table][col] = dtype

    for table, records in data.items():
        if not records:
            continue
        print(f"Restoring {table} ({len(records)} records)...")
        for record in records:
            columns = list(record.keys())
            values = []
            
            for col in columns:
                v = record[col]
                dtype = col_types.get(table, {}).get(col, '')
                if dtype in ('json', 'jsonb'):
                    if v is not None:
                        values.append(json.dumps(v))
                    else:
                        values.append(None)
                else:
                    values.append(v)
            
            query = sql.SQL("INSERT INTO {} ({}) VALUES ({}) ON CONFLICT DO NOTHING").format(
                sql.Identifier(table),
                sql.SQL(', ').join(map(sql.Identifier, columns)),
                sql.SQL(', ').join(sql.Placeholder() * len(columns))
            )
            try:
                cur.execute(query, values)
            except Exception as e:
                print(f"Error inserting into {table}: {e}")

    cur.close()
    conn.close()
    print("Restore completed.")

if __name__ == "__main__":
    main()
