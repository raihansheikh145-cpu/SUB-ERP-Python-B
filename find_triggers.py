with open('backend/trigger_fns_dump.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if 'CREATE OR REPLACE FUNCTION' in line:
            print(line.strip())
