#!/bin/bash
# Fix schema files
sed -i '' -e 's/status: str = "DRAFT"/status: str = "DRAFT"\n    created_by_id: Optional[str] = Field(None, alias="createdById")/' backend/app/schemas/bill.py
sed -i '' -e 's/status: str = "DRAFT"/status: str = "DRAFT"\n    created_by_id: Optional[str] = Field(None, alias="createdById")/' backend/app/schemas/invoice.py

# Fix bill_service.py
sed -i '' -e 's/reference, /reference, created_by_id, /' backend/app/services/bill_service.py
sed -i '' -e 's/\$13, NOW()/\$13, \$14, NOW()/' backend/app/services/bill_service.py
sed -i '' -e 's/reference = EXCLUDED.reference,/reference = EXCLUDED.reference,\n                    created_by_id = EXCLUDED.created_by_id,/' backend/app/services/bill_service.py
sed -i '' -e 's/payload.reference/payload.reference, payload.created_by_id/' backend/app/services/bill_service.py

# Fix invoice_service.py
sed -i '' -e 's/customer_note, delivery_person, updated_at/customer_note, delivery_person, created_by_id, updated_at/' backend/app/services/invoice_service.py
sed -i '' -e 's/\$16, NOW()/\$16, \$17, NOW()/' backend/app/services/invoice_service.py
sed -i '' -e 's/delivery_person = EXCLUDED.delivery_person,/delivery_person = EXCLUDED.delivery_person,\n                    created_by_id = EXCLUDED.created_by_id,/' backend/app/services/invoice_service.py
sed -i '' -e 's/payload.customer_note, payload.delivery_person/payload.customer_note, payload.delivery_person, payload.created_by_id/' backend/app/services/invoice_service.py

echo "Done"
