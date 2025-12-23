#!/bin/bash
# Полностью автоматическая установка и настройка Flips

set -e  # Остановиться при ошибке

echo "=========================================="
echo "  Автоматическая установка Flips"
echo "=========================================="
echo ""

# Определяем директории
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "Проект: $SCRIPT_DIR"
echo ""

# 1. Установка зависимостей backend
echo "1. Установка зависимостей backend..."
if [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
    echo "ОШИБКА: requirements.txt не найден!"
    exit 1
fi

cd "$BACKEND_DIR"

# Создаём виртуальное окружение, если его нет
if [ ! -d ".venv" ]; then
    echo "   Создание виртуального окружения..."
    python3 -m venv .venv
fi

# Активируем и устанавливаем зависимости
echo "   Установка Python пакетов..."
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "   ✓ Backend зависимости установлены"
echo ""

# 2. Установка зависимостей frontend
if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
    echo "2. Установка зависимостей frontend..."
    cd "$FRONTEND_DIR"

    # Увеличиваем память для Node.js и устанавливаем зависимости
    export NODE_OPTIONS="--max-old-space-size=4096"

    if [ ! -d "node_modules" ]; then
        echo "   Установка npm пакетов (это может занять некоторое время)..."
        npm install --prefer-offline --no-audit --progress=false || {
            echo "   Предупреждение: npm install завершился с ошибкой, пробуем с очисткой кэша..."
            rm -rf node_modules package-lock.json
            npm cache clean --force
            npm install --prefer-offline --no-audit --progress=false
        }
    else
        echo "   node_modules уже существует, пропускаем установку..."
    fi
    echo "   ✓ Frontend зависимости установлены"
    echo ""

    # 3. Сборка frontend
    echo "3. Сборка frontend..."
    # Увеличиваем память для сборки
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm run build || {
        echo "   Ошибка сборки, пробуем с увеличенной памятью..."
        NODE_OPTIONS="--max-old-space-size=6144" npm run build
    }
    echo "   ✓ Frontend собран"
    echo ""
else
    echo "2. Frontend не найден, пропускаем..."
    echo ""
fi

# 4. Настройка systemd сервиса
if [ -f "$SCRIPT_DIR/setup-service.sh" ]; then
    echo "4. Настройка systemd сервиса..."
    cd "$SCRIPT_DIR"
    bash setup-service.sh
else
    echo "4. Скрипт setup-service.sh не найден, пропускаем настройку сервиса..."
    echo ""
fi

echo "=========================================="
echo "  Установка завершена!"
echo "=========================================="
echo ""
echo "Приложение готово к работе."
echo ""
