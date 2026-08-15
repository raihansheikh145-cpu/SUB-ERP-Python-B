
missing_tables = [
    "docs_companies", "docs_accounts", "docs_invoices", "docs_invoice_lines",
    "docs_bills", "docs_bill_lines", "docs_payments", "docs_credit_notes",
    "docs_credit_note_lines", "docs_roles", "docs_inventory_adjustments",
    "docs_inventory_transactions", "docs_inventory_ledger", "docs_tasks",
    "docs_attendance", "docs_loans", "docs_payslips", "docs_advance_salaries",
    "docs_categories", "docs_brands", "docs_commission_targets", "docs_holidays"
]

import os

schema_path = "prisma/schema.prisma"
with open(schema_path, "a") as f:
    for table in missing_tables:
        model_name = "Docs" + "".join(word.title() for word in table.replace("docs_", "").split("_"))
        f.write(f"\nmodel {model_name} {{\n")
        f.write(f"  id         String   @id\n")
        f.write(f"  data       Json?\n")
        f.write(f"  created_at DateTime @default(now())\n")
        f.write(f"  updated_at DateTime @updatedAt\n")
        f.write(f"  @@map(\"{table}\")\n")
        f.write("}\n")
print("Appended models to schema.prisma!")

