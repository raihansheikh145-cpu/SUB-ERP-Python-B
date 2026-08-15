from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Settings"])
logger = logging.getLogger(__name__)

@router.post("/brands")
async def upsert_brands(req: Request, user=Depends(require_roles(["ADMIN"]))):
    try:
        body = await req.json()
        brands = body.get("brands", [])
        
        if not brands or not isinstance(brands, list):
            return {"success": False, "error": "Brands array is required"}

        async with prisma.tx() as transaction:
            for b in brands:
                await transaction.execute_raw(
                    '''
                    INSERT INTO docs_brands (id, name, updated_at) 
                    VALUES ($1, $2, now()) 
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name,
                        updated_at = now()
                    ''',
                    b.get("id"),
                    b.get("name")
                )

        logger.info("Brands upserted successfully.")
        return {"success": True, "message": "Brands upserted successfully"}

    except Exception as err:
        logger.error(f"Failed to upsert brands: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/categories")
async def upsert_categories(req: Request, user=Depends(require_roles(["ADMIN"]))):
    try:
        body = await req.json()
        categories = body.get("categories", [])
        
        if not categories or not isinstance(categories, list):
            return {"success": False, "error": "Categories array is required"}

        async with prisma.tx() as transaction:
            for c in categories:
                await transaction.execute_raw(
                    '''
                    INSERT INTO docs_categories (id, name, type, updated_at) 
                    VALUES ($1, $2, $3, now()) 
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name,
                        type = EXCLUDED.type,
                        updated_at = now()
                    ''',
                    c.get("id"),
                    c.get("name"),
                    c.get("type", "PRODUCT")
                )

        logger.info("Categories upserted successfully.")
        return {"success": True, "message": "Categories upserted successfully"}

    except Exception as err:
        logger.error(f"Failed to upsert categories: {err}")
        raise HTTPException(status_code=500, detail=str(err))
