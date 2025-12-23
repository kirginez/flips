#!/bin/bash
# Скрипт для сборки и деплоя на сервер

set -e  # Остановиться при ошибке

echo "=========================================="
echo "  Деплой Flips"
echo "=========================================="
echo ""

# Определяем директории
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_SCRIPT="$SCRIPT_DIR/build-and-prepare.sh"

# 1. Собираем фронтенд
echo "1. Сборка фронтенда..."
if [ -f "$BUILD_SCRIPT" ]; then
    bash "$BUILD_SCRIPT"
else
    echo "ОШИБКА: Скрипт сборки не найден!"
    exit 1
fi

# 2. Проверяем статус git
echo ""
echo "2. Проверка статуса git..."
if ! git diff-index --quiet HEAD --; then
    echo "Есть незакоммиченные изменения:"
    git status --short
    echo ""
    read -p "Продолжить деплой? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Деплой отменён"
        exit 1
    fi
fi

# 3. Коммитим изменения (если есть)
if ! git diff-index --quiet HEAD --; then
    echo ""
    echo "3. Коммит изменений..."
    read -p "Введите сообщение коммита (или Enter для автоматического): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Build frontend and deploy"
    fi
    git add .
    git commit -m "$COMMIT_MSG"
    echo "   ✓ Изменения закоммичены"
fi

# 4. Отправляем на сервер
echo ""
echo "4. Отправка на сервер..."
read -p "Введите имя удалённого репозитория (по умолчанию: origin): " REMOTE
REMOTE=${REMOTE:-origin}

read -p "Введите ветку (по умолчанию: main): " BRANCH
BRANCH=${BRANCH:-main}

echo "Отправка в $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH"

echo ""
echo "=========================================="
echo "  ✓ Деплой завершён!"
echo "=========================================="
echo ""
echo "На сервере выполните:"
echo "  git pull"
echo "  # или если используете install.sh:"
echo "  ./install.sh"
echo ""

