#!/bin/bash
# Скрипт полной очистки приложения Flips

set -e

echo "=========================================="
echo "  Полная очистка Flips"
echo "=========================================="
echo ""
echo "⚠️  ВНИМАНИЕ: Этот скрипт удалит ВСЁ!"
echo ""

read -p "Вы уверены? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "1. Остановка и удаление systemd сервиса..."

# Проверяем существование файла сервиса
SERVICE_FILE="/etc/systemd/system/flips.service"
if [ -f "$SERVICE_FILE" ]; then
    echo "   Остановка сервиса..."
    sudo systemctl stop flips.service 2>/dev/null || true
    echo "   Отключение автозапуска..."
    sudo systemctl disable flips.service 2>/dev/null || true
    echo "   Удаление сервиса..."
    sudo rm -f "$SERVICE_FILE"
    sudo systemctl daemon-reload
    echo "   ✓ Сервис удалён"
else
    echo "   Сервис не найден, пропускаем..."
fi

echo ""
echo "2. Остановка процессов приложения..."

# Убиваем процессы uvicorn на порту 8080
PID=$(lsof -ti:8080 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo "   Найден процесс на порту 8080 (PID: $PID), останавливаем..."
    kill -9 $PID 2>/dev/null || true
    echo "   ✓ Процесс остановлен"
else
    echo "   Процессы не найдены"
fi

echo ""
echo "3. Удаление виртуального окружения backend..."

if [ -d "$SCRIPT_DIR/backend/.venv" ]; then
    rm -rf "$SCRIPT_DIR/backend/.venv"
    echo "   ✓ Виртуальное окружение удалено"
else
    echo "   Виртуальное окружение не найдено"
fi

echo ""
echo "4. Удаление node_modules frontend..."

if [ -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    rm -rf "$SCRIPT_DIR/frontend/node_modules"
    echo "   ✓ node_modules удалён"
else
    echo "   node_modules не найден"
fi

echo ""
echo "5. Удаление собранного dist..."

if [ -d "$SCRIPT_DIR/frontend/dist" ]; then
    rm -rf "$SCRIPT_DIR/frontend/dist"
    echo "   ✓ dist удалён"
else
    echo "   dist не найден"
fi

echo ""
echo "6. Удаление кэшей Python..."

find "$SCRIPT_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$SCRIPT_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
echo "   ✓ Кэши Python очищены"

echo ""
echo "7. Удаление базы данных..."

if [ -f "$SCRIPT_DIR/backend/flips.db" ]; then
    rm -f "$SCRIPT_DIR/backend/flips.db"
    echo "   ✓ База данных удалена"
else
    echo "   База данных не найдена"
fi

echo ""
echo "=========================================="
echo "  ✓ Очистка завершена!"
echo "=========================================="
echo ""
echo "Теперь вы можете:"
echo "  1. Удалить всю директорию проекта:"
echo "     cd .. && rm -rf flips"
echo ""
echo "  2. Или заново клонировать с git:"
echo "     cd .."
echo "     git clone <your-repo-url> flips"
echo "     cd flips"
echo ""
echo "  3. Затем развернуть заново:"
echo "     # Установить зависимости backend"
echo "     cd backend"
echo "     python3 -m venv .venv"
echo "     source .venv/bin/activate"
echo "     pip install -r requirements.txt"
echo ""
echo "     # Frontend уже собран в git (dist коммитится)"
echo "     # Просто запустить backend"
echo "     cd .."
echo "     # Настроить systemd сервис (если нужно)"
echo ""

