#!/bin/bash
# Скрипт для сборки фронтенда и подготовки к деплою

set -e  # Остановиться при ошибке

echo "=========================================="
echo "  Сборка фронтенда для деплоя"
echo "=========================================="
echo ""

# Определяем директории
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

echo "Проект: $SCRIPT_DIR"
echo "Frontend: $FRONTEND_DIR"
echo ""

# Проверяем наличие frontend
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "ОШИБКА: Директория frontend не найдена!"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "ОШИБКА: package.json не найден!"
    exit 1
fi

# Переходим в директорию frontend
cd "$FRONTEND_DIR"

# Увеличиваем память для Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "1. Установка зависимостей frontend..."
    npm install --prefer-offline --no-audit --progress=false
    echo "   ✓ Зависимости установлены"
    echo ""
else
    echo "1. Зависимости уже установлены, пропускаем..."
    echo ""
fi

# Собираем фронтенд
echo "2. Сборка фронтенда..."
npm run build

if [ ! -d "$DIST_DIR" ]; then
    echo "ОШИБКА: Сборка не создала директорию dist!"
    exit 1
fi

echo "   ✓ Frontend собран успешно"
echo ""

# Проверяем наличие index.html
if [ ! -f "$DIST_DIR/index.html" ]; then
    echo "ПРЕДУПРЕЖДЕНИЕ: index.html не найден в dist!"
fi

# Показываем размер собранных файлов
echo "3. Информация о собранных файлах:"
echo "   Размер dist:"
du -sh "$DIST_DIR" | awk '{print "   " $1}'
echo "   Файлы в dist:"
find "$DIST_DIR" -type f | wc -l | awk '{print "   " $1 " файлов"}'
echo ""

echo "=========================================="
echo "  ✓ Готово к деплою!"
echo "=========================================="
echo ""
echo "Теперь можно:"
echo "  1. Закоммитить изменения: git add . && git commit -m '...'"
echo "  2. Отправить на сервер: git push"
echo ""

