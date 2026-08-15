
import asyncio
from app.core.db import prisma

async def test():
    await prisma.connect()
    try:
        pid = 'test-id-12345'
        cid = '00000000-0000-0000-0000-000000000000'
        company_ids = [cid]
        ptype = 'PRODUCT'
        name = 'Test Name'
        sku = 'TEST-SKU-1'
        price = 100.0
        cost_price = 50.0
        uom = 'Pcs'
        brand = None
        category = 'All'
        description = ''
        tracking_type = 'NONE'
        inv_policy = 'Ordered quantities'
        initial_cost = 50.0
        lpp = 50.0
        qoh = 0
        is_in_pos = True
        can_be_sold = True
        can_be_purchased = True
        can_be_expensed = False
        track_inventory = True
        external_id = None
        tax_code = None
        import json
        serials = json.dumps([])
        data_json = json.dumps({'name': name, 'sku': sku})
        locked_ids = []

        res = await prisma.query_raw(
            '''
            INSERT INTO docs_products (
                id, company_id, company_ids, type,
                name, sku, price, cost_price, uom, brand, category,
                description, tracking_type, invoicing_policy,
                initial_cost, last_purchase_rate, last_purchase_price,
                quantity_on_hand, is_in_pos, can_be_sold, can_be_purchased,
                can_be_expensed, track_inventory, external_id, tax_code,
                serial_numbers, data, updated_at
            ) VALUES (
                \, \, \::text[], \,
                \, \, \, \, \, \, \,
                \, \, \,
                \, \, \,
                \, \, \, \,
                \, \, \, \,
                \::jsonb, \::jsonb, now()
            )
            ON CONFLICT (id) DO UPDATE SET
                company_id        = EXCLUDED.company_id,
                company_ids       = EXCLUDED.company_ids,
                type              = EXCLUDED.type,
                name              = EXCLUDED.name,
                sku               = COALESCE(EXCLUDED.sku, docs_products.sku),
                price             = EXCLUDED.price,
                cost_price        = CASE WHEN docs_products.id = ANY(\::text[])
                                         THEN docs_products.cost_price
                                         ELSE EXCLUDED.cost_price END,
                uom               = EXCLUDED.uom,
                brand             = EXCLUDED.brand,
                category          = EXCLUDED.category,
                description       = EXCLUDED.description,
                tracking_type     = EXCLUDED.tracking_type,
                invoicing_policy  = EXCLUDED.invoicing_policy,
                initial_cost      = EXCLUDED.initial_cost,
                last_purchase_rate  = EXCLUDED.last_purchase_rate,
                last_purchase_price = EXCLUDED.last_purchase_price,
                quantity_on_hand  = EXCLUDED.quantity_on_hand,
                is_in_pos         = EXCLUDED.is_in_pos,
                can_be_sold       = EXCLUDED.can_be_sold,
                can_be_purchased  = EXCLUDED.can_be_purchased,
                can_be_expensed   = EXCLUDED.can_be_expensed,
                track_inventory   = EXCLUDED.track_inventory,
                external_id       = EXCLUDED.external_id,
                tax_code          = EXCLUDED.tax_code,
                serial_numbers    = EXCLUDED.serial_numbers,
                data              = EXCLUDED.data,
                updated_at        = now()
            RETURNING id, name, sku, company_id
            ''',
            pid, cid, company_ids, ptype,
            name, sku, price, cost_price, uom, brand, category,
            description, tracking_type, inv_policy,
            initial_cost, lpp,
            qoh, is_in_pos, can_be_sold, can_be_purchased,
            can_be_expensed, track_inventory, external_id, tax_code,
            serials, data_json,
            locked_ids
        )
        print('RESULT:', res)
    except Exception as e:
        print('ERROR:', str(e))
    finally:
        await prisma.disconnect()

asyncio.run(test())

