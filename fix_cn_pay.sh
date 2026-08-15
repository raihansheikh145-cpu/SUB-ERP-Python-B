#!/bin/bash
# Fix payment_service.py
sed -i '' -e 's/payment_number, updated_at/payment_number, created_by_id, updated_at/' backend/app/services/payment_service.py
sed -i '' -e 's/\$14, NOW()/\$14, \$15, NOW()/' backend/app/services/payment_service.py
sed -i '' -e 's/payment_number = \$13,/payment_number = \$13,\n                        created_by_id = \$15,/' backend/app/services/payment_service.py
sed -i '' -e 's/reference, method, p_date, payment_number, payment_id)/reference, method, p_date, payment_number, payment_id, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/payment_service.py
sed -i '' -e 's/reference, method, p_date, payment_number)/reference, method, p_date, payment_number, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/payment_service.py

# Fix credit_note_service.py
sed -i '' -e 's/tax_total, total, updated_at/tax_total, total, created_by_id, updated_at/' backend/app/services/credit_note_service.py
sed -i '' -e 's/\$10, NOW()/\$10, \$12, NOW()/' backend/app/services/credit_note_service.py
sed -i '' -e 's/tax_total = EXCLUDED.tax_total,/tax_total = EXCLUDED.tax_total,\n                    created_by_id = EXCLUDED.created_by_id,/' backend/app/services/credit_note_service.py
sed -i '' -e 's/inv_tax, inv_total, status)/inv_tax, inv_total, status, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/credit_note_service.py

echo "Done"
