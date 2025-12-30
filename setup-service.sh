#!/bin/bash
# Скрипт установки systemd сервиса для Flips

set -e

echo "=========================================="
echo "  Установка systemd сервиса Flips"
echo "=========================================="
echo ""

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/flips.service"
SYSTEMD_FILE="/etc/systemd/system/flips.service"

# Проверяем наличие шаблона сервиса
if [ ! -f "$SERVICE_FILE" ]; then
    echo "ОШИБКА: Файл flips.service не найден!"
    exit 1
fi

# Проверяем наличие виртуального окружения
VENV_PATH="$SCRIPT_DIR/backend/.venv/bin/uvicorn"
if [ ! -f "$VENV_PATH" ]; then
    echo "ОШИБКА: Виртуальное окружение не найдено!"
    echo "Сначала запустите deploy.sh для установки зависимостей"
    exit 1
fi

echo "Проект: $SCRIPT_DIR"
echo ""

# Создаём файл сервиса с правильными путями
echo "1. Создание файла сервиса..."
sudo cp "$SERVICE_FILE" "$SYSTEMD_FILE"

# Заменяем пути в файле
sudo sed -i "s|/path/to/flips|$SCRIPT_DIR|g" "$SYSTEMD_FILE"

# Определяем пользователя (текущий пользователь или root)
CURRENT_USER=${SUDO_USER:-$USER}
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=$(whoami)
fi

echo "   Используется пользователь: $CURRENT_USER"
sudo sed -i "s|^User=.*|User=$CURRENT_USER|" "$SYSTEMD_FILE" 2>/dev/null || true

# Добавляем User если его нет
if ! grep -q "^User=" "$SYSTEMD_FILE"; then
    sudo sed -i "/^\[Service\]/a User=$CURRENT_USER" "$SYSTEMD_FILE"
fi

# Проверяем SSL настройки из .env
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "^SSL_ENABLED=true" "$ENV_FILE"; then
        SSL_CERT=$(grep "^SSL_CERT_PATH=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        SSL_KEY=$(grep "^SSL_KEY_PATH=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
            echo "   Обнаружены SSL настройки, обновление ExecStart..."
            CURRENT_EXEC=$(grep "^ExecStart=" "$SYSTEMD_FILE" | cut -d'=' -f2-)
            NEW_EXEC="$CURRENT_EXEC --ssl-certfile $SSL_CERT --ssl-keyfile $SSL_KEY"
            sudo sed -i "s|^ExecStart=.*|ExecStart=$NEW_EXEC|" "$SYSTEMD_FILE"
            echo "   ✓ SSL параметры добавлены"
        fi
    fi
fi

echo "   ✓ Файл создан: $SYSTEMD_FILE"
echo ""

# Перезагружаем systemd
echo "2. Перезагрузка systemd..."
sudo systemctl daemon-reload
echo "   ✓ Systemd перезагружен"
echo ""

# Включаем автозапуск
echo "3. Включение автозапуска..."
sudo systemctl enable flips.service
echo "   ✓ Автозапуск включён"
echo ""

echo "=========================================="
echo "  ✓ Сервис установлен!"
echo "=========================================="
echo ""
echo "Управление сервисом:"
echo "  sudo systemctl start flips.service    # Запустить"
echo "  sudo systemctl stop flips.service     # Остановить"
echo "  sudo systemctl restart flips.service  # Перезапустить"
echo "  sudo systemctl status flips.service   # Статус"
echo "  sudo journalctl -u flips.service -f   # Логи"
echo ""
echo "Запустить сервис сейчас? (y/n)"
read -p "> " START_NOW
if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
    echo ""
    echo "Запуск сервиса..."
    sudo systemctl start flips.service
    sleep 2
    sudo systemctl status flips.service --no-pager
fi
echo ""

