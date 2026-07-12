from uuid import UUID

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str


class UserRoleUpdate(BaseModel):
    role: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
