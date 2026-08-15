# Database — Backup & Migration Guide

This folder contains everything needed to set up the database from scratch on any fresh PostgreSQL server.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Complete database schema — all tables, functions, indexes, and foreign keys |
| `dump_schema.cjs` | Script to re-generate `schema.sql` from the live database (run from `backend/` folder) |

---

## How to Set Up a New Database

### 1. Create a fresh PostgreSQL database

```sql
CREATE DATABASE sub_erp;
```

### 2. Run the schema file

Using `psql`:
```bash
psql -h <host> -U <user> -d sub_erp -f backend/database/schema.sql
```

Or using a GUI tool like **DBeaver**, **TablePlus**, or **pgAdmin**:
- Open the connection to your new database
- Open `backend/database/schema.sql`
- Execute the entire file

### 3. Update the connection string

Update `DATABASE_URL` in your `.env` file:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/sub_erp?sslmode=require
```

### 4. Run Prisma migrations (if any)

```bash
cd backend
npx prisma db push
```

---

## How to Regenerate `schema.sql`

If you've made structural changes to the database and want to update the schema file:

```bash
cd backend
node dump_schema.cjs
```

This will connect to the live database and overwrite `backend/database/schema.sql` with the latest structure.

---

## What's Included in `schema.sql`

- **52 tables** — all docs_*, auth_users, and supporting tables
- **158 functions** — including `post_invoice`, `post_payment`, `post_bill`, `get_cash_ledger`, etc.
- **All indexes** — for performance
- **All foreign key constraints** — for data integrity
