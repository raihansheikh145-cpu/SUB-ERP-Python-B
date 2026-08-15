#!/bin/bash
# Fix payment_service.py
sed -i '' -e 's/payment_number, updated_at/payment_number, created_by_id, updated_at/' backend/app/services/payment_service.py
sed -i '' -e 's/\$14, NOW()/\$14, \$15, NOW()/' backend/app/services/payment_service.py
sed -i '' -e 's/payment_number = \$13,/payment_number = \$13,\n                        created_by_id = \$15,/' backend/app/services/payment_service.py
sed -i '' -e 's/reference, method, p_date, payment_number, payment_id)/reference, method, p_date, payment_number, payment_id, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/payment_service.py
sed -i '' -e 's/reference, method, p_date, payment_number)/reference, method, p_date, payment_number, payload.get("createdById") or payload.get("created_by_id"))/' backend/app/services/payment_service.py

echo "Done"
