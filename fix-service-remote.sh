#!/bin/bash
# Скрипт для исправления проблемы с flips.service на удаленном сервере

echo "=== Диагностика и исправление flips.service ==="
echo ""

# Проверяем текущий файл сервиса
echo "1. Проверка текущего файла сервиса:"
echo "---"
sudo cat /etc/systemd/system/flips.service
echo "---"
echo ""

# Определяем правильный путь к проекту
PROJECT_DIR="/root/flips"
BACKEND_DIR="$PROJECT_DIR/backend"
START_SCRIPT="$BACKEND_DIR/start.sh"

echo "2. Проверка существования файлов:"
echo "Проект: $PROJECT_DIR"
if [ -d "$PROJECT_DIR" ]; then
    echo "✓ Директория проекта существует"
else
    echo "✗ Директория проекта НЕ существует: $PROJECT_DIR"
    exit 1
fi

echo "Backend: $BACKEND_DIR"
if [ -d "$BACKEND_DIR" ]; then
    echo "✓ Директория backend существует"
else
    echo "✗ Директория backend НЕ существует: $BACKEND_DIR"
    exit 1
fi

echo "Скрипт запуска: $START_SCRIPT"
if [ -f "$START_SCRIPT" ]; then
    echo "✓ Файл start.sh существует"
else
    echo "✗ Файл start.sh НЕ существует: $START_SCRIPT"
    exit 1
fi

# Проверяем права на выполнение
echo ""
echo "3. Проверка прав на выполнение:"
ls -la "$START_SCRIPT"
if [ -x "$START_SCRIPT" ]; then
    echo "✓ Файл имеет права на выполнение"
else
    echo "✗ Файл НЕ имеет прав на выполнение, исправляем..."
    chmod +x "$START_SCRIPT"
    echo "✓ Права установлены"
fi

# Проверяем shebang в скрипте
echo ""
echo "4. Проверка shebang в start.sh:"
head -1 "$START_SCRIPT"
if [ "$(head -1 "$START_SCRIPT")" = "#!/bin/bash" ]; then
    echo "✓ Shebang корректен"
else
    echo "✗ Shebang некорректен!"
fi

# Создаём правильный файл сервиса
echo ""
echo "5. Создание правильного файла сервиса..."
sudo tee /etc/systemd/system/flips.service > /dev/null << EOF
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

echo "✓ Файл сервиса обновлён"
echo ""
echo "6. Перезагрузка systemd daemon..."
sudo systemctl daemon-reload
echo "✓ Daemon перезагружен"
echo ""

# Показываем обновлённый файл
echo "7. Обновлённый файл сервиса:"
echo "---"
sudo cat /etc/systemd/system/flips.service
echo "---"
echo ""

# Пытаемся запустить сервис
echo "8. Запуск сервиса..."
sudo systemctl restart flips.service
sleep 2

# Показываем статус
echo ""
echo "9. Статус сервиса:"
echo "---"
sudo systemctl status flips.service --no-pager || true
echo "---"
echo ""

# Если есть ошибки, показываем логи
if ! sudo systemctl is-active --quiet flips.service; then
    echo "10. Последние строки логов (для диагностики):"
    echo "---"
    sudo journalctl -u flips.service -n 20 --no-pager || true
    echo "---"
fi

echo ""
echo "=== Готово ==="
echo ""
echo "Полезные команды:"
echo "  sudo systemctl status flips.service"
echo "  sudo journalctl -u flips.service -f"
echo "  sudo systemctl restart flips.service"

