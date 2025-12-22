from pathlib import Path

import uvicorn
from app.api import router as api_router
from app.core.database import init_db
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()


@app.on_event('startup')
async def startup_event():
    """Инициализирует базу данных при старте приложения."""
    init_db()


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
