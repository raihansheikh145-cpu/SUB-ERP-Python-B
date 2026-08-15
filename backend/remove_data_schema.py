def process_schema():
    path = 'prisma/schema.prisma'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    tables_for_audit = [
        'DocsInvoices', 'DocsBills', 'DocsPayments', 'DocsJournals',
        'DocsCreditNotes', 'DocsInventoryTransactions', 'DocsInventoryAdjustments'
    ]

    new_lines = []
    for line in lines:
        if 'data' in line and 'Json' in line and 'datasource db' not in ''.join(new_lines[-5:]):
            continue
        new_lines.append(line)
        for table in tables_for_audit:
            if f'model {table} {{' in line:
                new_lines.append('  audit_log  Json?\n')

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Schema updated.")

if __name__ == '__main__':
    process_schema()
