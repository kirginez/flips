#!/bin/bash
# Скрипт для автоматической настройки systemd сервиса на сервере

echo "=== Настройка Flips systemd сервиса ==="
echo ""

# Определяем текущего пользователя
CURRENT_USER=$(whoami)
echo "Текущий пользователь: $CURRENT_USER"

# Определяем рабочую директорию (где запущен скрипт)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
echo "Рабочая директория: $BACKEND_DIR"

# Ищем uv
UV_PATH=$(which uv 2>/dev/null)
if [ -z "$UV_PATH" ]; then
    echo "ОШИБКА: uv не найден в PATH!"
    echo "Установите uv или укажите полный путь к нему"
    exit 1
fi
echo "Путь к uv: $UV_PATH"

# Создаём временный файл сервиса
SERVICE_FILE="/tmp/flips.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Flips FastAPI Application
After=network.target

[Service]
Type=simple
WorkingDirectory=$BACKEND_DIR
Environment="PATH=/root/.local/bin:/root/.cargo/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin"
ExecStart=/bin/bash -c '$UV_PATH run uvicorn main:app --host 0.0.0.0 --port 8080'
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Создан файл сервиса:"
echo "---"
cat "$SERVICE_FILE"
echo "---"
echo ""

read -p "Установить этот сервис? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo cp "$SERVICE_FILE" /etc/systemd/system/flips.service
    sudo systemctl daemon-reload
    sudo systemctl enable flips.service
    echo ""
    echo "✓ Сервис установлен и включен для автозапуска"
    echo ""
    echo "Запустить сейчас? (y/n)"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl start flips.service
        sleep 2
        sudo systemctl status flips.service
    fi
else
    echo "Отменено. Файл сохранён в $SERVICE_FILE"
    echo "Вы можете отредактировать его и скопировать вручную:"
    echo "  sudo cp $SERVICE_FILE /etc/systemd/system/flips.service"
fi
