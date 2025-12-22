#!/bin/bash
# Скрипт для автоматической настройки systemd сервиса на сервере

set -e  # Остановиться при ошибке

echo "=== Автоматическая настройка Flips systemd сервиса ==="
echo ""

# Определяем рабочую директорию (где запущен скрипт - корень проекта)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
START_SCRIPT="$BACKEND_DIR/start.sh"

echo "✓ Корневая директория проекта: $SCRIPT_DIR"
echo "✓ Backend директория: $BACKEND_DIR"
echo "✓ Скрипт запуска: $START_SCRIPT"
echo ""

# Проверяем, что backend директория существует
if [ ! -d "$BACKEND_DIR" ]; then
    echo "ОШИБКА: Директория backend не найдена: $BACKEND_DIR"
    exit 1
fi

# Проверяем, что start.sh существует
if [ ! -f "$START_SCRIPT" ]; then
    echo "ОШИБКА: Скрипт start.sh не найден: $START_SCRIPT"
    exit 1
fi

# Убеждаемся, что скрипт исполняемый
chmod +x "$START_SCRIPT"
echo "✓ Права на выполнение установлены для start.sh"
echo ""

# Создаём файл сервиса
SERVICE_FILE="/tmp/flips.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Flips FastAPI Application
After=network.target

[Service]
Type=simple
WorkingDirectory=$BACKEND_DIR
ExecStart=$START_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Файл сервиса создан:"
echo "---"
cat "$SERVICE_FILE"
echo "---"
echo ""

# Устанавливаем сервис
echo "Установка systemd сервиса..."
sudo cp "$SERVICE_FILE" /etc/systemd/system/flips.service
sudo systemctl daemon-reload
sudo systemctl enable flips.service
echo "✓ Сервис установлен и включен для автозапуска"
echo ""

# Запускаем сервис
echo "Запуск сервиса..."
sudo systemctl restart flips.service
sleep 2

# Показываем статус
echo ""
echo "Статус сервиса:"
echo "---"
sudo systemctl status flips.service --no-pager || true
echo "---"
echo ""

echo "✓ Готово! Сервис настроен и запущен."
echo ""
echo "Полезные команды:"
echo "  sudo systemctl status flips.service  # Статус"
echo "  sudo systemctl restart flips.service # Перезапуск"
echo "  sudo journalctl -u flips.service -f  # Логи"
echo ""
