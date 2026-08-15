from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
import uuid
import json
import os
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from app.core.db import prisma
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.core.email_service import send_password_reset_email, send_admin_approval_email

router = APIRouter(tags=["Auth"])
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

SECRET_KEY = getattr(settings, "JWT_SECRET", None) or getattr(settings, "SUPABASE_JWT_SECRET", None) or os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET") or "enterprise-erp-jwt-secret-fallback-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class RegisterUserRequest(BaseModel):
    id: str
    name: str
    username: str
    email: str
    pin: str
    roleId: Optional[str] = None
    companyIds: Optional[List[str]] = None
    isCashier: Optional[bool] = False
    rules: Optional[Any] = None
    invitationToken: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register")
async def register(req: RegisterUserRequest):
    final_role_id = req.roleId or "role-admin"
    final_company_ids = req.companyIds or []
    
    email_lower = req.email.lower().strip()
    username_lower = req.username.lower().strip()
    
    password = req.pin
    if len(password) < 6:
        password = password.ljust(6, "0")
        
    hashed_password = hash_password(password)
    
    try:
        # Check if auth user exists
        existing_auth = await prisma.authuser.find_unique(where={"email": email_lower})
        
        auth_uid = None
        
        approval_token = str(uuid.uuid4())
        
        if existing_auth:
            auth_uid = existing_auth.id
            logger.info(f"Auth user already exists for {email_lower}, updating password and pending approval.")
            await prisma.authuser.update(
                where={"id": auth_uid},
                data={
                    "hashedPassword": hashed_password,
                    "isActive": False,
                    "approvalToken": approval_token
                }
            )
        else:
            new_auth = await prisma.authuser.create(
                data={
                    "email": email_lower,
                    "hashedPassword": hashed_password,
                    "role": final_role_id,
                    "isActive": False,
                    "approvalToken": approval_token
                }
            )
            auth_uid = new_auth.id

        # Upsert docs_users natively instead of using raw queries where possible, 
        # but docs_users is complex, so let's stick to raw or prisma create. 
        # Prisma supports docs_users now via schema.prisma.
        
        await prisma.docsuser.upsert(
            where={"id": req.id},
            data={
                "create": {
                    "id": req.id,
                    "name": req.name,
                    "username": username_lower,
                    "email": email_lower,
                    "pin": req.pin,
                    "roleId": final_role_id,
                    "status": "PENDING",
                    "companyIds": json.dumps(final_company_ids),
                    "companyId": final_company_ids[0] if final_company_ids else None,
                    "invitationToken": req.invitationToken,
                    "emailConfirmed": True,
                    "userUuid": auth_uid
                },
                "update": {
                    "name": req.name,
                    "username": username_lower,
                    "email": email_lower,
                    "pin": req.pin,
                    "roleId": final_role_id,
                    "status": "PENDING",
                    "companyIds": json.dumps(final_company_ids),
                    "companyId": final_company_ids[0] if final_company_ids else None,
                    "userUuid": auth_uid
                }
            }
        )
        
        logger.info(f"Registered user {username_lower} / {email_lower} with auth UUID: {auth_uid}")
        
        # Send admin approval email
        send_admin_approval_email(email_lower, req.name, approval_token)
        
        return {
            "success": True, 
            "message": "Registration successful. Please wait for admin approval."
        }

    except Exception as err:
        logger.error(f"Error registering user: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/login")
async def login(req: LoginRequest):
    email_lower = req.email.lower().strip()
    logger.warning(f"LOGIN ATTEMPT: Raw Email='{req.email}', Stripped='{email_lower}'")
    try:
        user = await prisma.authuser.find_unique(where={"email": email_lower})
        if not user:
            logger.warning(f"LOGIN FAILED: User not found for email '{email_lower}'")
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        if not user.isActive:
            logger.warning(f"LOGIN FAILED: Account pending for '{email_lower}'")
            raise HTTPException(status_code=403, detail="Account pending admin approval.")
            
        if not verify_password(req.password, user.hashedPassword):
            logger.warning(f"LOGIN FAILED: Invalid password for '{email_lower}'")
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        logger.warning(f"LOGIN SUCCESS: '{email_lower}'")
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role},
            expires_delta=access_token_expires
        )
        
        # Fetch the docs_user profile natively so frontend doesn't need to query Supabase
        docs_user = await prisma.docsuser.find_first(where={"userUuid": user.id})
        profile_data = None
        if docs_user:
            profile_data = docs_user.model_dump()
            # Handle JSON serialization issues
            profile_data["createdAt"] = profile_data["createdAt"].isoformat() if profile_data.get("createdAt") else None
            profile_data["updatedAt"] = profile_data["updatedAt"].isoformat() if profile_data.get("updatedAt") else None
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "profile": profile_data,
            "session": {
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role
                }
            }
        }
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Login error: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/approve/{token}")
async def approve_user(token: str):
    try:
        user = await prisma.authuser.find_first(where={"approvalToken": token})
        
        if not user:
            return RedirectResponse(url="http://localhost:5173/login?approved=false")
            
        await prisma.authuser.update(
            where={"id": user.id},
            data={
                "isActive": True,
                "approvalToken": None
            }
        )
        
        # Also set the DocsUser profile to ACTIVE
        await prisma.docsuser.update_many(
            where={"userUuid": user.id},
            data={"status": "ACTIVE"}
        )
        
        return RedirectResponse(url="http://localhost:5173/login?approved=true")
    except Exception as err:
        logger.error(f"Approval error: {err}")
        return RedirectResponse(url="http://localhost:5173/login?approved=error")

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/invite")
async def invite_user():
    return {"success": True, "message": "Email mocked to succeed while refactoring"}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email_lower = req.email.lower()
    try:
        user = await prisma.authuser.find_unique(where={"email": email_lower})
        if not user:
            # Return success even if user not found to prevent email enumeration
            return {"success": True, "message": "If that email exists, a reset link has been sent."}
            
        reset_token = str(uuid.uuid4())
        # Set expiration to 1 hour from now
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        
        await prisma.authuser.update(
            where={"id": user.id},
            data={
                "resetToken": reset_token,
                "resetTokenExpires": expires
            }
        )
        
        email_sent = send_password_reset_email(email_lower, reset_token)
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send reset email.")
            
        return {"success": True, "message": "Password reset email sent."}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Forgot password error: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    try:
        user = await prisma.authuser.find_first(
            where={
                "resetToken": req.token,
                "resetTokenExpires": {"gte": datetime.now(timezone.utc)}
            }
        )
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
            
        hashed_password = hash_password(req.new_password)
        
        await prisma.authuser.update(
            where={"id": user.id},
            data={
                "hashedPassword": hashed_password,
                "resetToken": None,
                "resetTokenExpires": None
            }
        )
        
        # Optionally, also update the docsUser PIN if that's still being used
        await prisma.docsuser.update_many(
            where={"userUuid": user.id},
            data={"pin": req.new_password}
        )
        
        return {"success": True, "message": "Password has been reset successfully."}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Reset password error: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"success": True, "user": user}
