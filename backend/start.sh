#!/bin/bash
# Скрипт запуска Flips приложения

cd "$(dirname "$0")"

# Определяем путь к виртуальному окружению
VENV_DIR=".venv"

# Если виртуальное окружение не существует, создаем его
if [ ! -d "$VENV_DIR" ]; then
    echo "Создание виртуального окружения..." >&2
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "ОШИБКА: Не удалось создать виртуальное окружение!" >&2
        exit 1
    fi

    # Активируем и устанавливаем зависимости
    source "$VENV_DIR/bin/activate"
    pip install --upgrade pip
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        echo "ОШИБКА: requirements.txt не найден!" >&2
        exit 1
    fi
else
    # Активируем существующее виртуальное окружение
    source "$VENV_DIR/bin/activate"
fi

# Проверяем наличие uvicorn
if ! command -v uvicorn &> /dev/null; then
    echo "ОШИБКА: uvicorn не найден! Установите зависимости: pip install -r requirements.txt" >&2
    exit 1
fi

# Запускаем приложение
exec uvicorn main:app --host 0.0.0.0 --port 8080
