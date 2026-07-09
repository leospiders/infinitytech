import logging
import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import get_db
from app.models.models import Employee, generate_uuid

logger = logging.getLogger("infinity")

router = APIRouter(prefix="/auth", tags=["Auth"])

# --- Schemas ---

class SignUpRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(...)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class ResetPasswordRequest(BaseModel):
    email: str


# --- Helpers ---

SUPABASE_AUTH_URL: str | None = None


def _auth_url() -> str:
    global SUPABASE_AUTH_URL
    if SUPABASE_AUTH_URL is None:
        base = settings.SUPABASE_URL.rstrip("/")
        SUPABASE_AUTH_URL = f"{base}/auth/v1"
    return SUPABASE_AUTH_URL


async def _supabase_post(path: str, body: dict, headers_extra: dict | None = None) -> tuple[int, dict]:
    """POST to Supabase Auth REST API, returns (status_code, body_dict)."""
    url = f"{_auth_url()}/{path.lstrip('/')}"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    if headers_extra:
        headers.update(headers_extra)
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=body, headers=headers, timeout=15)
        except httpx.RequestError as e:
            logger.error("Supabase Auth request failed: %s", e)
            return 502, {"error": f"Upstream request failed: {e}"}
        try:
            data = resp.json()
        except Exception:
            data = {}
        if resp.status_code >= 400:
            logger.warning("Supabase Auth error [%s]: %s", path, data)
        return resp.status_code, data


# --- Endpoints ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: SignUpRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email + password and create a pending profile.

    Creates the user in Supabase Auth AND creates a pending Employee record
    in SQLite so the admin can see and approve the registration immediately.
    """
    supabase_body = {
        "email": req.email,
        "password": req.password,
        "data": {
            "display_name": req.username,
        },
    }

    code, data = await _supabase_post("signup", supabase_body)

    if code == 200 or code == 201:
        supabase_user = data.get("user") or data.get("id", {})
        user_id = supabase_user.get("id") if isinstance(supabase_user, dict) else None

        # Create pending Employee in SQLite so admin sees it immediately
        result = await db.execute(select(Employee).filter(Employee.email == req.email))
        existing_employee = result.scalars().first()

        if not existing_employee:
            employee = Employee(
                email=req.email,
                uuid=user_id or generate_uuid(),
                name=req.username,
                role="PENDING",
                status="PENDING",
                is_active=False,  # pending approval
            )
            db.add(employee)
            await db.commit()

        return {
            "message": "Registration submitted. An administrator will activate your account shortly.",
            "email": req.email,
            "user_id": user_id,
        }

    msg = (
        data.get("msg", "")
        or data.get("error_description", "")
        or data.get("message", "")
        or ""
    )
    if "already registered" in msg.lower() or "duplicate" in msg.lower():
        raise HTTPException(status_code=409, detail="This email is already registered.")
    if "password" in msg.lower():
        raise HTTPException(status_code=400, detail=msg)

    raise HTTPException(
        status_code=code if code >= 400 else 500,
        detail=msg or "Registration failed. Please try again.",
    )


@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate with email + password via Supabase.

    Returns a JWT access_token for the user to use in subsequent requests.
    If the user hasn't been approved by an admin, our /employees/me endpoint
    will still return 403 — the frontend handles this via the pending approval screen.
    """
    code, data = await _supabase_post(
        "token?grant_type=password",
        {"email": req.email, "password": req.password},
    )

    if code == 200:
        return {
            "access_token": data["access_token"],
            "token_type": "bearer",
            "user": {
                "id": data["user"]["id"],
                "email": data["user"]["email"],
                "display_name": data["user"]
                .get("user_metadata", {})
                .get("display_name", ""),
            },
        }

    msg = (
        data.get("error_description", "")
        or data.get("msg", "")
        or "Invalid credentials"
    )
    if "invalid grant" in msg.lower() or "email not confirmed" in msg.lower():
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    raise HTTPException(status_code=401, detail=msg)


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Send a password reset email via Supabase.

    Supabase handles the email delivery. The user clicks the link to reset their password.

    Note: The Supabase project must have the "Reset Password" email template configured
    with a valid site URL, otherwise the API silently accepts but no email is sent.
    """
    code, data = await _supabase_post("recover", {"email": req.email})

    if code == 200:
        return {"message": "If the email exists, a password reset link has been sent."}

    msg = data.get("msg", "") or data.get("error_description", "") or "Failed to send reset email"
    logger.error("Password reset failed: HTTP %d — %s", code, msg)
    raise HTTPException(
        status_code=code if code >= 400 else 500,
        detail=msg,
    )
