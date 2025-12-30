#!/bin/bash
# Скрипт развёртывания Flips после клонирования с git

set -e

echo "=========================================="
echo "  Развёртывание Flips"
echo "=========================================="
echo ""

# Определяем директорию проекта
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

# Создаём виртуальное окружение
if [ ! -d ".venv" ]; then
    echo "   Создание виртуального окружения..."
    python3 -m venv .venv
fi

# Активируем и устанавливаем зависимости
echo "   Установка Python пакетов..."
source .venv/bin/activate
pip install --upgrade pip --quiet --no-cache-dir
pip install -r requirements.txt --quiet --no-cache-dir
echo "   ✓ Backend зависимости установлены"
echo ""

# 2. Проверка frontend
cd "$SCRIPT_DIR"
if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
    if [ -d "$FRONTEND_DIR/dist" ] && [ -f "$FRONTEND_DIR/dist/index.html" ]; then
        echo "2. Frontend уже собран (dist найден)"
        echo "   ✓ Используется готовый dist из git"
        echo ""
    else
        echo "2. ⚠️  Frontend не собран!"
        echo "   Соберите его локально и закоммитьте dist:"
        echo "   cd frontend && npm run build && git add dist && git commit -m 'Build' && git push"
        echo ""
    fi
else
    echo "2. Frontend не найден"
    echo ""
fi

# 3. Проверка переменных окружения
echo "3. Проверка переменных окружения..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "   ⚠️  Файл .env не найден!"
    if [ -f "$SCRIPT_DIR/.env.template" ]; then
        echo "   Создайте .env из шаблона:"
        echo "   cp .env.template .env"
        echo "   nano .env"
    fi
    echo ""
else
    echo "   ✓ .env найден"
    echo ""
fi

# 4. Проверка users.json
echo "4. Проверка users.json..."
if [ ! -f "$BACKEND_DIR/users.json" ]; then
    echo "   ⚠️  Файл users.json не найден!"
    echo "   Создайте его в backend/users.json"
    echo ""
else
    echo "   ✓ users.json найден"
    echo ""
fi

# 5. Проверка SSL сертификатов
echo "5. Проверка SSL сертификатов..."
if [ -f "$SCRIPT_DIR/.env" ] && grep -q "^SSL_ENABLED=true" "$SCRIPT_DIR/.env"; then
    SSL_CERT=$(grep "^SSL_CERT_PATH=" "$SCRIPT_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    SSL_KEY=$(grep "^SSL_KEY_PATH=" "$SCRIPT_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$SSL_CERT" ] && [ -f "$SSL_CERT" ] && [ -n "$SSL_KEY" ] && [ -f "$SSL_KEY" ]; then
        echo "   ✓ SSL сертификаты найдены"
        echo "   Cert: $SSL_CERT"
        echo "   Key:  $SSL_KEY"
    else
        echo "   ⚠️  SSL включен, но сертификаты не найдены!"
        echo "   Запустите: ./generate-ssl-cert.sh"
    fi
    echo ""
else
    echo "   ℹ️  SSL не настроен (по умолчанию HTTP)"
    echo "   Для включения HTTPS:"
    echo "   1. Запустите: ./generate-ssl-cert.sh"
    echo "   2. Добавьте в .env:"
    echo "      SSL_ENABLED=true"
    echo "      SSL_CERT_PATH=/path/to/cert.pem"
    echo "      SSL_KEY_PATH=/path/to/key.pem"
    echo ""
fi

echo "=========================================="
echo "  ✓ Развёртывание завершено!"
echo "=========================================="
echo ""
echo "Теперь можно запустить приложение:"
echo ""
echo "  # Вариант 1: Через systemd (рекомендуется)"
echo "  # Создайте /etc/systemd/system/flips.service:"
echo "  sudo nano /etc/systemd/system/flips.service"
echo ""
echo "  # Пример содержимого:"
echo "  [Unit]"
echo "  Description=Flips Application"
echo "  After=network.target"
echo ""
echo "  [Service]"
echo "  Type=simple"
echo "  User=$USER"
echo "  WorkingDirectory=$SCRIPT_DIR/backend"
echo "  Environment=\"PATH=$SCRIPT_DIR/backend/.venv/bin\""
echo "  ExecStart=$SCRIPT_DIR/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080"
echo "  Restart=always"
echo ""
echo "  [Install]"
echo "  WantedBy=multi-user.target"
echo ""
echo "  # Затем:"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable flips.service"
echo "  sudo systemctl start flips.service"
echo ""
echo "  # Вариант 2: Вручную"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 8080"
echo ""

