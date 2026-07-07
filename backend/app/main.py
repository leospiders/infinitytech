import logging
import jwt
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.core.scheduler import start_scheduler, stop_scheduler
from app.api.api import api_router
from app.db.session import Base, _get_engine, _Session
from app.db.seeds import seed_data
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with _get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session = _Session()()
    try:
        await seed_data(session)
    except Exception as e:
        print(f"[SEED] {e}")
    finally:
        await session.close()
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

# Security headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        supabase_host = ""
        if settings.SUPABASE_URL:
            from urllib.parse import urlparse
            supabase_host = urlparse(settings.SUPABASE_URL).hostname or ""

        response.headers["Content-Security-Policy"] = (
            f"default-src 'self'; "
            f"script-src 'self' 'unsafe-inline'; "
            f"style-src 'self' 'unsafe-inline'; "
            f"img-src 'self' data: https://*.googleusercontent.com; "
            f"font-src 'self'; "
            f"connect-src 'self' https://{supabase_host} wss://{supabase_host}; "
            f"form-action 'self' https://accounts.google.com; "
            f"frame-ancestors 'self';"
        )
        return response

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["30/minute"],  # baseline; override per route with @limiter.limit("X/hour")
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.ngrok-free\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router, prefix="/api")

# Shared PDF endpoint (short-lived tokens, no JWT in URL)
@app.get("/_share/pdf/{token}")
@limiter.exempt
async def serve_shared_pdf(token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SHARE_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=410, detail="Share link has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid share link")

    resource_type = payload.get("type")
    resource_id = payload.get("id")
    if not resource_type or not resource_id:
        raise HTTPException(status_code=400, detail="Invalid share link payload")

    if resource_type == "sale":
        from sqlalchemy import select
        from app.models.models import Sale
        from app.repositories.base_repos import SaleRepository
        from app.pdf.generator import generate_pdf_receipt
        repo = SaleRepository(db)
        sale = await repo.get_by_id(resource_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Receipt not found")

        items_list = [{
            "name": item.custom_name or (item.product.name if item.product else "Unknown"),
            "quantity": item.quantity,
            "price": item.unit_price,
            "subtotal": item.subtotal
        } for item in sale.items]
        pdf_buf = generate_pdf_receipt(
            sale_id=sale.id,
            customer_name=sale.customer_name or "General Customer",
            date_str=sale.created_at.strftime('%Y-%m-%d %H:%M'),
            items=items_list,
            total=sale.total,
            payment_method=sale.payment_method,
            seller_name=sale.seller.name if sale.seller else "System",
            warranty_info=sale.warranty_info
        )
        if not pdf_buf:
            raise HTTPException(status_code=500, detail="Could not generate receipt PDF")
        return Response(
            content=pdf_buf.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=sale_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"}
        )

    if resource_type == "work_order":
        from app.pdf.generator import generate_work_order_pdf
        from app.repositories.base_repos import WorkOrderRepository, EmployeeRepository
        wo_repo = WorkOrderRepository(db)
        wo = await wo_repo.get_by_id(resource_id)
        if not wo:
            raise HTTPException(status_code=404, detail="Work order not found")

        emp_repo = EmployeeRepository(db)
        created = await emp_repo.get_by_id(wo.created_by_id) if wo.created_by_id else None
        pdf_items = []
        for item in wo.items:
            pdf_items.append({
                "brand": item.brand or "",
                "model": item.model or "",
                "imei": item.imei or "",
                "desperfecto": item.desperfecto or "",
                "diagnostico": item.diagnostico or "",
                "motivo": item.motivo or "",
                "total_cost": item.total_cost or 0,
                "security": item.security or "",
            })
        pdf_buf = generate_work_order_pdf(
            wo_id=wo.id,
            customer_name=wo.customer_name,
            date_str=wo.created_at.strftime('%Y-%m-%d %H:%M'),
            tech_name=created.name if created else "",
            tech_phone=created.phone if created else "",
            status=wo.status,
            cost=wo.total_cost,
            note=wo.note,
            items=pdf_items,
        )
        if not pdf_buf:
            raise HTTPException(status_code=500, detail="Could not generate work order PDF")
        return Response(
            content=pdf_buf.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=work_order_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"}
        )

    raise HTTPException(status_code=400, detail="Unknown resource type")


@app.get("/")
@limiter.exempt
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

# Healthcheck (not rate-limited)
@app.get("/api/health")
@limiter.exempt
async def health():
    return {"status": "ok", "version": "1.0.0"}

