from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.auth import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email:    str
    password: str
    role:     str = "viewer"

@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    return {"status": "registered", "username": body.username, "role": body.role}

@router.post("/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db:   AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.username == form.username))
    user   = result.scalars().first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    token = create_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "role": user.role, "username": user.username}

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email":    current_user.email,
        "role":     current_user.role,
    }

@router.post("/setup-admin")
async def setup_admin(db: AsyncSession = Depends(get_db)):
    """Create default admin on first run — call once then remove."""
    existing = await db.execute(select(User).where(User.username == "admin"))
    if existing.scalars().first():
        return {"status": "admin already exists"}
    user = User(
        id=str(uuid.uuid4()),
        username="admin",
        email="admin@cloudcost.local",
        hashed_password=hash_password("cloudcost2024"),
        role="admin",
    )
    db.add(user)
    await db.commit()
    return {"status": "admin created", "username": "admin",
            "password": "cloudcost2024"}

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all registered users — admin only in production."""
    result = await db.execute(select(User))
    users  = result.scalars().all()
    return [{"id": u.id, "username": u.username,
             "email": u.email, "role": u.role} for u in users]

@router.post("/create-viewer")
async def create_viewer(db: AsyncSession = Depends(get_db)):
    """Create a demo viewer account."""
    existing = await db.execute(
        select(User).where(User.username == "viewer")
    )
    if existing.scalars().first():
        return {"status": "viewer already exists"}
    user = User(
        id=str(uuid.uuid4()),
        username="viewer",
        email="viewer@cloudcost.local",
        hashed_password=hash_password("viewer2024"),
        role="viewer",
    )
    db.add(user)
    await db.commit()
    return {"status": "created", "username": "viewer",
            "password": "viewer2024"}
