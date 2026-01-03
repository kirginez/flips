from fastapi import APIRouter

from .auth import router as auth_router
from .backup import router as backup_router
from .cards import router as cards_router
from .stats import router as stats_router
from .study import router as study_router

router = APIRouter()
router.include_router(auth_router, prefix='/auth')
router.include_router(cards_router, prefix='/cards')
router.include_router(study_router, prefix='/study')
router.include_router(stats_router, prefix='/stats')
router.include_router(backup_router, prefix='/backup')
