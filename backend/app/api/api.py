from fastapi import APIRouter
from app.api.employees import router as employees_router
from app.api.categories import router as categories_router
from app.api.products import router as products_router
from app.api.work_orders import router as work_orders_router
from app.api.sales import router as sales_router
from app.api.dashboard import router as dashboard_router
from app.api.history import router as history_router

api_router = APIRouter()

api_router.include_router(employees_router)
api_router.include_router(categories_router)
api_router.include_router(products_router)
api_router.include_router(work_orders_router)
api_router.include_router(sales_router)
api_router.include_router(dashboard_router)
api_router.include_router(history_router)
