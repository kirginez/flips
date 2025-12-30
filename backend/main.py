import logging
from pathlib import Path

import uvicorn
from app.api import router as api_router
from app.core.config import settings
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
    # Раздаём статические файлы из папки assets
    app.mount('/assets', StaticFiles(directory=str(frontend_dist / 'assets')), name='assets')

    # Для всех остальных путей отдаём index.html или статические файлы
    @app.get('/{full_path:path}')
    async def serve_frontend(full_path: str, request: Request):
        # Пропускаем API запросы (они уже обработаны выше)
        if full_path.startswith('api/'):
            return JSONResponse(status_code=404, content={'detail': 'Not found'})

        # Проверяем, существует ли запрашиваемый файл в dist
        requested_file = frontend_dist / full_path.lstrip('/')

        # Проверка безопасности: файл должен быть внутри frontend_dist
        try:
            requested_file.resolve().relative_to(frontend_dist.resolve())
        except ValueError:
            # Путь выходит за пределы frontend_dist - возвращаем 404
            return JSONResponse(status_code=404, content={'detail': 'Not found'})

        # Если запрашивается существующий статический файл, отдаём его
        if requested_file.exists() and requested_file.is_file():
            return FileResponse(str(requested_file))

        # Для всех остальных путей (включая маршруты React Router) отдаём index.html
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
    ssl_kwargs = {}
    if settings.SSL_ENABLED:
        cert_path = Path(settings.SSL_CERT_PATH)
        key_path = Path(settings.SSL_KEY_PATH)
        if not cert_path.exists() or not key_path.exists():
            logger.error(f'SSL сертификаты не найдены: cert={cert_path}, key={key_path}')
            raise FileNotFoundError('SSL сертификаты не найдены')
        ssl_kwargs = {
            'ssl_certfile': str(cert_path),
            'ssl_keyfile': str(key_path),
        }
        logger.info(f'HTTPS включен: cert={cert_path}, key={key_path}')
    uvicorn.run(app, host='0.0.0.0', port=8080, **ssl_kwargs)
