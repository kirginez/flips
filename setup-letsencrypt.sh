#!/bin/bash

set -e

echo "=========================================="
echo "  Настройка Let's Encrypt сертификата"
echo "=========================================="
echo ""

echo "⚠️  ВАЖНО: Let's Encrypt НЕ выдает сертификаты для IP-адресов!"
echo "   Необходимо использовать доменное имя (DNS)."
echo ""

read -p "Введите доменное имя (например: example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "ОШИБКА: Доменное имя обязательно!"
    exit 1
fi

if [[ $DOMAIN =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo ""
    echo "ОШИБКА: Это IP-адрес, а не доменное имя!"
    echo ""
    echo "Решения:"
    echo "  1. Настройте DNS запись типа A, указывающую на этот IP:"
    echo "     example.com  A  193.124.112.8"
    echo ""
    echo "  2. Используйте самоподписанный сертификат для IP:"
    echo "     ./generate-ssl-cert.sh"
    echo ""
    exit 1
fi

echo ""
echo "Проверка доступности домена..."
if ! host "$DOMAIN" > /dev/null 2>&1; then
    echo "⚠️  Предупреждение: домен $DOMAIN не найден в DNS"
    echo "   Убедитесь, что DNS запись настроена правильно"
    echo ""
    read -p "Продолжить? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

if [ ! -d "$CERTS_DIR" ]; then
    mkdir -p "$CERTS_DIR"
fi

echo ""
echo "Получение сертификата Let's Encrypt..."
echo "⚠️  Убедитесь, что:"
echo "   1. Домен указывает на этот сервер (DNS A запись)"
echo "   2. Порт 80 открыт для проверки Let's Encrypt"
echo "   3. Приложение остановлено (certbot использует порт 80)"
echo ""
read -p "Продолжить? (y/n): " CONTINUE
if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
    exit 1
fi

sudo certbot certonly --standalone -d "$DOMAIN"

CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
KEY_FILE="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo ""
    echo "=========================================="
    echo "  ✓ Сертификат получен!"
    echo "=========================================="
    echo ""
    echo "Сертификат: $CERT_FILE"
    echo "Ключ:       $KEY_FILE"
    echo ""
    echo "Добавьте в .env файл:"
    echo "  SSL_ENABLED=true"
    echo "  SSL_CERT_PATH=$CERT_FILE"
    echo "  SSL_KEY_PATH=$KEY_FILE"
    echo ""
    echo "Автообновление сертификата:"
    echo "  sudo certbot renew --dry-run"
    echo ""
    echo "Настройте cron для автообновления:"
    echo "  sudo crontab -e"
    echo "  Добавьте: 0 0 * * * certbot renew --quiet && systemctl restart flips.service"
    echo ""
else
    echo ""
    echo "ОШИБКА: Сертификаты не найдены!"
    echo "Проверьте логи: /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

