import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.api import api_router
from app.db.session import Base, _get_engine, _Session
from app.db.seeds import seed_data

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
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/pdf", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
