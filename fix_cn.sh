#!/bin/bash
# Fix credit_note_service.py
sed -i '' -e 's/tax_total, total, updated_at/tax_total, total, created_by_id, updated_at/' backend/app/services/credit_note_service.py
sed -i '' -e 's/\$10, NOW()/\$10, \$12, NOW()/' backend/app/services/credit_note_service.py
sed -i '' -e 's/tax_total = EXCLUDED.tax_total,/tax_total = EXCLUDED.tax_total,\n                    created_by_id = EXCLUDED.created_by_id,/' backend/app/services/credit_note_service.py
sed -i '' -e 's/inv_tax, inv_total, status)/inv_tax, inv_total, status, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/credit_note_service.py

echo "Done"
