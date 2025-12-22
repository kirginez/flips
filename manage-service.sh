#!/bin/bash
# Скрипт для управления Flips service через systemd

SERVICE_NAME="flips.service"
SERVICE_FILE="flips.service"

case "$1" in
    install)
        echo "Установка сервиса..."
        sudo cp "$SERVICE_FILE" /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable "$SERVICE_NAME"
        echo "Сервис установлен и включен для автозапуска"
        echo "Запустите: sudo systemctl start $SERVICE_NAME"
        ;;
    start)
        sudo systemctl start "$SERVICE_NAME"
        echo "Сервис запущен"
        ;;
    stop)
        sudo systemctl stop "$SERVICE_NAME"
        echo "Сервис остановлен"
        ;;
    restart)
        sudo systemctl restart "$SERVICE_NAME"
        echo "Сервис перезапущен"
        ;;
    status)
        sudo systemctl status "$SERVICE_NAME"
        ;;
    logs)
        sudo journalctl -u "$SERVICE_NAME" -f
        ;;
    uninstall)
        echo "Удаление сервиса..."
        sudo systemctl stop "$SERVICE_NAME" 2>/dev/null
        sudo systemctl disable "$SERVICE_NAME" 2>/dev/null
        sudo rm /etc/systemd/system/"$SERVICE_NAME"
        sudo systemctl daemon-reload
        echo "Сервис удалён"
        ;;
    *)
        echo "Использование: $0 {install|start|stop|restart|status|logs|uninstall}"
        echo ""
        echo "Команды:"
        echo "  install   - Установить и включить автозапуск"
        echo "  start    - Запустить сервис"
        echo "  stop     - Остановить сервис"
        echo "  restart  - Перезапустить сервис"
        echo "  status   - Показать статус"
        echo "  logs     - Показать логи (следить за изменениями)"
        echo "  uninstall - Удалить сервис"
        exit 1
        ;;
esac

exit 0
