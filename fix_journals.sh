#!/bin/bash
# Fix journal_service.py
sed -i '' -e 's/reference_number, reference, updated_at)/reference_number, reference, created_by_id, updated_at)/' backend/app/services/journal_service.py
sed -i '' -e 's/\$6, \$6, NOW()/\$6, \$6, \$7, NOW()/' backend/app/services/journal_service.py
sed -i '' -e 's/reference = EXCLUDED.reference,/reference = EXCLUDED.reference,\n                created_by_id = EXCLUDED.created_by_id,/' backend/app/services/journal_service.py
sed -i '' -e 's/date_val, status, reference_number, reference/date_val, status, reference_number, reference, payload.get("createdById") or payload.get("created_by_id")/' backend/app/services/journal_service.py

echo "Done"
