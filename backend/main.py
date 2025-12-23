import logging
from pathlib import Path

import uvicorn
from app.api import router as api_router
from app.core.database import init_db
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Настройка логирования
logging.basicConfig(
    level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.on_event('startup')
async def startup_event():
    """Инициализирует базу данных при старте приложения."""
    try:
        init_db()
        logger.info('База данных инициализирована успешно')
    except Exception as e:
        logger.error(f'Ошибка при инициализации базы данных: {e}', exc_info=True)
        raise


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Глобальный обработчик исключений для логирования всех ошибок."""
    logger.error(
        f'Необработанное исключение: {exc.__class__.__name__}: {exc}',
        exc_info=True,
        extra={'path': request.url.path, 'method': request.method},
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={'detail': 'Internal server error'})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Обработчик ошибок валидации."""
    logger.warning(f'Ошибка валидации запроса: {exc.errors()}')
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={'detail': exc.errors()})


# API routes (важно что это идёт ПЕРЕД статикой)
app.include_router(api_router, prefix='/api')

# Путь к собранному фронтенду
frontend_dist = Path(__file__).parent.parent / 'frontend' / 'dist'

if frontend_dist.exists():
    # Раздаём статические файлы (JS, CSS, images)
    app.mount('/assets', StaticFiles(directory=str(frontend_dist / 'assets')), name='assets')

    # Для всех остальных путей отдаём index.html (для React Router)
    @app.get('/{full_path:path}')
    async def serve_frontend(full_path: str):
        # Если это не API запрос и не файл, отдаём index.html
        index_file = frontend_dist / 'index.html'
        if index_file.exists():
            return FileResponse(str(index_file))
        return {'error': "Frontend not built. Run 'npm run build' in frontend directory."}
else:

    @app.get('/')
    async def root():
        return {
            'message': 'Flips API',
            'frontend': "Not built. Run 'npm run build' in frontend directory.",
            'api_docs': '/docs',
        }


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8080)
