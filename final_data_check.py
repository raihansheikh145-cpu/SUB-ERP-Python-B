import os
import re

def search_files(directory):
    patterns = [
        re.compile(r'(?<!json)(?<!res)(?<!response)(?<!result)(?<!\b_bRes)(?<!\b_invRes)(?<!\b_invRes2)(?<!\b_invTxRes)(?<!\b_jlRes)(?<!\b_loanRes)(?<!\b_prodRes)(?<!\b_billRes)(?<!\b_ubRes)(?<!\b_cnRes)\.data\b'),
        re.compile(r'\[\'data\'\]'),
        re.compile(r'\[\"data\"\]')
    ]
    
    # Exceptions we want to ignore
    ignore_files = ['search_data.cjs', 'search_data_precise.cjs', 'patch_frontend_stores.py', 'final_data_check.py']
    
    found = False
    
    for root, _, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or 'venv' in root or '.gemini' in root:
            continue
            
        for file in files:
            if not file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                continue
            if file in ignore_files:
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for i, line in enumerate(lines):
                    line_clean = line.strip()
                    # Skip lines that are just logging or comments if needed
                    # But let's check everything first
                    for pattern in patterns:
                        if pattern.search(line_clean):
                            # further heuristic ignore:
                            if 'form.data' in line_clean or 'formData' in line_clean:
                                continue
                            if 'setData' in line_clean:
                                continue
                            if 'type data ' in line_clean.lower():
                                continue
                            print(f"{filepath}:{i+1}: {line_clean[:200]}")
                            found = True
                            break
            except Exception as e:
                pass
                
    if not found:
        print(f"No problematic 'data' references found in {directory}!")

if __name__ == '__main__':
    print("Searching backend...")
    search_files('backend')
    print("Searching frontend (src)...")
    search_files('src')
