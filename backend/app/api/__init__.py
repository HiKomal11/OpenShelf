from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.admin import router as admin_router
from app.api.routes.categories import router as categories_router
from app.api.routes.documents import router as documents_router
from app.api.routes.document_files import router as document_files_router
from app.api.routes.document_interactions import (
    router as document_interactions_router,
    user_router as user_router,
)
from app.api.routes.public_documents import router as public_documents_router
from app.api.routes.public_categories import (
    router as public_categories_router,
)
from app.api.routes.notifications import router as notifications_router

api_router = APIRouter(
    prefix="/api/v1",
)


api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(categories_router)
api_router.include_router(documents_router)
api_router.include_router(document_files_router)
api_router.include_router(document_interactions_router)
api_router.include_router(user_router)
api_router.include_router(public_documents_router)
api_router.include_router(public_categories_router)
api_router.include_router(notifications_router)