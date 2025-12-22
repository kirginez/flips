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
    if [ ! -d "node_modules" ]; then
        npm install --silent
    fi
    echo "   ✓ Frontend зависимости установлены"
    echo ""

    # 3. Сборка frontend
    echo "3. Сборка frontend..."
    npm run build
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
