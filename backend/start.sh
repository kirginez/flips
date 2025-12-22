#!/bin/bash
# Скрипт запуска Flips приложения

cd "$(dirname "$0")"

# Пробуем найти uv в разных местах
if command -v uv &> /dev/null; then
    UV_CMD="uv"
elif [ -f "$HOME/.local/bin/uv" ]; then
    UV_CMD="$HOME/.local/bin/uv"
elif [ -f "$HOME/.cargo/bin/uv" ]; then
    UV_CMD="$HOME/.cargo/bin/uv"
elif [ -f "/usr/local/bin/uv" ]; then
    UV_CMD="/usr/local/bin/uv"
else
    echo "ОШИБКА: uv не найден!" >&2
    exit 1
fi

# Запускаем приложение
exec "$UV_CMD" run uvicorn main:app --host 0.0.0.0 --port 8080
