import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User
from app.auth import hash_password, verify_password, create_token, get_current_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email:    EmailStr
    password: str
    role:     str = "viewer"


@router.post("/register", status_code=201)
async def register(
    body: RegisterRequest,
    db:   AsyncSession = Depends(get_db),
    _:    User         = Depends(require_admin),
):
    """Create a new user — admin only."""
    if body.role not in ("admin", "viewer"):
        raise HTTPException(status_code=400, detail="role must be 'admin' or 'viewer'")

    dup_user  = await db.execute(select(User).where(User.username == body.username))
    dup_email = await db.execute(select(User).where(User.email    == body.email))
    if dup_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if dup_email.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        email=str(body.email),
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    logger.info("User %s (%s) created by admin", body.username, body.role)
    return {"status": "registered", "username": body.username, "role": body.role}


@router.post("/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db:   AsyncSession              = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == form.username))
    user   = result.scalars().first()
    if not user or not verify_password(form.password, user.hashed_password):
        logger.warning("Failed login attempt for username=%r", form.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user.role,
        "username":     user.username,
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email":    current_user.email,
        "role":     current_user.role,
    }


@router.post("/setup-admin")
async def setup_admin(db: AsyncSession = Depends(get_db)):
    """Bootstrap: create the default admin on first run — idempotent, call once."""
    existing = await db.execute(select(User).where(User.username == "admin"))
    if existing.scalars().first():
        return {"status": "admin already exists"}
    import os
    default_pw = os.getenv("ADMIN_DEFAULT_PASSWORD", "cloudcost2024")
    user = User(
        id=str(uuid.uuid4()),
        username="admin",
        email="admin@cloudcost.local",
        hashed_password=hash_password(default_pw),
        role="admin",
    )
    db.add(user)
    await db.commit()
    logger.info("Default admin account created")
    return {"status": "admin created", "username": "admin"}


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_admin),
):
    """List all registered users — admin only."""
    result = await db.execute(select(User))
    users  = result.scalars().all()
    return [
        {"id": u.id, "username": u.username, "email": u.email, "role": u.role}
        for u in users
    ]
