from fastapi import APIRouter, Depends, HTTPException, Body, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
import json
import logging
import bcrypt
import secrets

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Users"])

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[str] = None
    company_ids: Optional[Any] = None
    password: Optional[str] = None

@router.get("")
async def get_users(email: Optional[str] = Query(None), current_user=Depends(get_current_user)):
    try:
        if email:
            rows = await prisma.query_raw("SELECT * FROM docs_users WHERE email = $1 OR data->>'email' = $1", email)
        else:
            rows = await prisma.query_raw("SELECT * FROM docs_users LIMIT 1000")
            
        users = []
        for row in rows:
            data = row.get("data")
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    data = {}
            user_dict = dict(row)
            user_dict.pop("data", None)
            users.append({ **user_dict, **(data or {}) })
            
        return {"success": True, "data": users, "users": users}
    except Exception as e:
        logger.error(f"get_users query_raw error: {e}")
        try:
            orm_users = await prisma.docsuser.find_many()
            data = [u.model_dump() for u in orm_users]
            return {"success": True, "data": data, "users": data}
        except Exception as err:
            raise HTTPException(status_code=500, detail=str(err))

@router.put("/{user_id}")
async def update_user(user_id: str, req: UserUpdateRequest, current_user=Depends(require_roles(["ADMIN"]))):
    try:
        update_data = {}
        if req.name is not None:
            update_data["name"] = req.name
        if req.email is not None:
            update_data["email"] = req.email
        if req.role_id is not None:
            update_data["role_id"] = req.role_id
        if req.company_ids is not None:
            update_data["company_ids"] = req.company_ids if isinstance(req.company_ids, str) else json.dumps(req.company_ids)

        if update_data:
            fields = []
            params = [user_id]
            idx = 2
            for k, v in update_data.items():
                if k == "company_ids":
                    fields.append(f"{k} = ${idx}::jsonb")
                else:
                    fields.append(f"{k} = ${idx}")
                params.append(v)
                idx += 1
                
            query = f"UPDATE docs_users SET {', '.join(fields)}, updated_at = NOW() WHERE id = $1 RETURNING *"
            res = await prisma.query_raw(query, *params)
            if res:
                row_dict = dict(res[0])
                data_attr = row_dict.get("data")
                if isinstance(data_attr, str):
                    try:
                        data_attr = json.loads(data_attr)
                    except Exception:
                        data_attr = {}
                row_dict.pop("data", None)
                
                # If a new password is provided, update the AuthUser (lookup by email)
                if req.password:
                    hashed = _hash_password(req.password)
                    try:
                        await prisma.authuser.update(
                            where={"email": row_dict["email"]},
                            data={"hashedPassword": hashed}
                        )
                    except Exception as pass_err:
                        logger.error(f"Failed to update auth_user password: {pass_err}")

                return {"success": True, "data": { **row_dict, **(data_attr or {}) }}

        # Fallback if no update_data but password provided
        if req.password:
            docs_user = await prisma.docsuser.find_unique(where={"id": user_id})
            if docs_user and docs_user.email:
                hashed = _hash_password(req.password)
                await prisma.authuser.update(
                    where={"email": docs_user.email},
                    data={"hashedPassword": hashed}
                )

        user = await prisma.docsuser.update(
            where={"id": user_id},
            data={"name": req.name, "email": req.email, "roleId": req.role_id}
        )
        return {"success": True, "data": user.model_dump()}
    except Exception as e:
        logger.error(f"update_user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

@router.post("/lockdown")
async def trigger_lockdown(current_user=Depends(require_roles(["ADMIN", "SUPERADMIN"]))):
    try:
        users_to_lock = await prisma.authuser.find_many(
            where={"id": {"not": current_user["id"]}}
        )
        
        locked_count = 0
        for user in users_to_lock:
            new_pass = secrets.token_urlsafe(12)
            hashed = _hash_password(new_pass)
            
            await prisma.authuser.update(
                where={"id": user.id},
                data={
                    "hashedPassword": hashed,
                    "isActive": False
                }
            )
            locked_count += 1
            
        if locked_count > 0:
            await prisma.docsuser.update_many(
                where={"userUuid": {"not": current_user["id"]}},
                data={"status": "INACTIVE"}
            )
            
        return {"success": True, "message": f"Lockdown complete. {locked_count} users locked out and passwords randomized."}
    except Exception as e:
        logger.error(f"Lockdown failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
