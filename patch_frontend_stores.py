import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace fetchReq.data -> fetchReq
    content = re.sub(r'fetchReq\.data', 'fetchReq', content)
    # Replace dbRecord.data -> dbRecord
    content = re.sub(r'dbRecord\.data', 'dbRecord', content)
    # Replace updatedRow.data -> updatedRow
    content = re.sub(r'updatedRow\.data', 'updatedRow', content)
    # Replace row.data || {} -> row
    content = re.sub(r'\.\.\.\(row\.data\s*\|\|\s*\{\}\)', '...row', content)
    # Replace r.data || {} -> r
    content = re.sub(r'\.\.\.\(r\.data\s*\|\|\s*\{\}\)', '...r', content)
    # Replace record.data || {} -> record
    content = re.sub(r'\.\.\.\(record\.data\s*\|\|\s*\{\}\)', '...record', content)
    
    # In useSalesStore line 640: if (data && data.data) inv = data.data as Invoice;
    # Usually data is the API wrapper, so data.data is correct for API. 
    # But updatedInvData.data might be API wrapper too. Let's be careful.
    
    # Replace item.data.items -> item.items
    content = re.sub(r'item\.data\.items', 'item.items', content)
    content = re.sub(r'invoice\.data\.items', 'invoice.items', content)
    content = re.sub(r'bill\.data\.items', 'bill.items', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched: {filepath}")

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
