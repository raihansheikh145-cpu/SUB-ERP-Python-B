from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import logging
import os
import sys
from .config import settings

security = HTTPBearer(auto_error=True)
logger = logging.getLogger(__name__)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    secret = getattr(settings, "JWT_SECRET", None) or getattr(settings, "SUPABASE_JWT_SECRET", None) or os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        logger.critical("SECURITY ERROR: JWT_SECRET is not set in the environment.")
        raise HTTPException(status_code=503, detail="Authentication is not configured. Please contact the administrator.")

    try:
        # Strictly verify our native JWT signature
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        
        user_id = decoded.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token structure")
            
        from app.core.db import prisma
        # We need this query to await, but get_current_user is async so we can use await
        db_user = await prisma.authuser.find_unique(where={"id": user_id})
        
        if not db_user:
            raise HTTPException(status_code=401, detail="User no longer exists")
            
        if not db_user.isActive:
            raise HTTPException(status_code=401, detail="Account is disabled or locked down")
            
        return {
            "id": db_user.id,
            "email": db_user.email,
            "role": db_user.role
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")



def require_roles(allowed_roles: list[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "").upper()
        if user_role.startswith("ROLE-"):
            user_role = user_role[5:]
            
        allowed_upper = [r.upper() for r in allowed_roles]
        
        # Superadmins bypass all role checks
        if user_role == "SUPERADMIN":
            return user
            
        if not user_role or user_role not in allowed_upper:
            logger.warning(f"SECURITY BREACH ATTEMPT: User {user.get('email')} (Role: {user_role}) attempted to access restricted route.")
            raise HTTPException(
                status_code=403, 
                detail="Access denied. Insufficient permissions."
            )
        return user
    return role_checker
