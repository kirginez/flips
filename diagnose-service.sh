#!/bin/bash
# Скрипт для диагностики проблем с systemd сервисом flips

echo "=== Диагностика Flips Service ==="
echo ""

# Проверяем файл сервиса
echo "1. Проверка файла сервиса:"
if [ -f /etc/systemd/system/flips.service ]; then
    echo "✓ Файл сервиса существует"
    echo ""
    echo "Содержимое файла сервиса:"
    echo "---"
    cat /etc/systemd/system/flips.service
    echo "---"
    echo ""
    
    # Извлекаем пути из файла сервиса
    WORKING_DIR=$(grep "^WorkingDirectory=" /etc/systemd/system/flips.service | cut -d'=' -f2)
    EXEC_START=$(grep "^ExecStart=" /etc/systemd/system/flips.service | cut -d'=' -f2)
    
    echo "2. Проверка путей:"
    echo "   WorkingDirectory: $WORKING_DIR"
    echo "   ExecStart: $EXEC_START"
    echo ""
    
    # Проверяем существование директории
    if [ -d "$WORKING_DIR" ]; then
        echo "✓ Рабочая директория существует: $WORKING_DIR"
    else
        echo "✗ ОШИБКА: Рабочая директория не существует: $WORKING_DIR"
    fi
    
    # Проверяем существование скрипта
    if [ -f "$EXEC_START" ]; then
        echo "✓ Скрипт запуска существует: $EXEC_START"
        
        # Проверяем права на выполнение
        if [ -x "$EXEC_START" ]; then
            echo "✓ Скрипт имеет права на выполнение"
        else
            echo "✗ ОШИБКА: Скрипт не имеет прав на выполнение"
            echo "  Исправление: chmod +x $EXEC_START"
        fi
        
        # Проверяем shebang
        echo ""
        echo "3. Проверка скрипта запуска:"
        echo "   Первая строка скрипта:"
        head -n 1 "$EXEC_START"
        
        # Проверяем наличие bash
        SHEBANG=$(head -n 1 "$EXEC_START")
        if [[ "$SHEBANG" == *"bash"* ]]; then
            if command -v bash &> /dev/null; then
                echo "✓ Bash найден: $(which bash)"
            else
                echo "✗ ОШИБКА: Bash не установлен!"
            fi
        fi
    else
        echo "✗ ОШИБКА: Скрипт запуска не существует: $EXEC_START"
    fi
else
    echo "✗ ОШИБКА: Файл сервиса не найден: /etc/systemd/system/flips.service"
fi

echo ""
echo "4. Статус сервиса:"
systemctl status flips.service --no-pager || true

echo ""
echo "5. Последние логи:"
journalctl -u flips.service -n 20 --no-pager || true

echo ""
echo "=== Конец диагностики ==="

