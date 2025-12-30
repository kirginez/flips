#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

echo "=========================================="
echo "  Генерация SSL сертификатов"
echo "=========================================="
echo ""

if [ ! -d "$CERTS_DIR" ]; then
    mkdir -p "$CERTS_DIR"
    echo "Создана директория: $CERTS_DIR"
fi

echo "Генерация самоподписанного сертификата..."
echo ""

read -p "Введите доменное имя или IP (по умолчанию: localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -p "Введите срок действия сертификата в днях (по умолчанию: 365): " DAYS
DAYS=${DAYS:-365}

CERT_FILE="$CERTS_DIR/cert.pem"
KEY_FILE="$CERTS_DIR/key.pem"

if [[ $DOMAIN =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo ""
    echo "⚠️  Обнаружен IP-адрес: $DOMAIN"
    echo "   Let's Encrypt НЕ выдает сертификаты для IP-адресов!"
    echo "   Будет создан самоподписанный сертификат для IP."
    echo ""
    SAN="IP:$DOMAIN,IP:127.0.0.1,DNS:localhost"
    CN="$DOMAIN"
else
    SAN="DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"
    CN="$DOMAIN"
fi

openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days "$DAYS" \
    -subj "/C=RU/ST=State/L=City/O=Flips/CN=$CN" \
    -addext "subjectAltName=$SAN"

chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo ""
echo "=========================================="
echo "  ✓ Сертификаты созданы!"
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

if [[ $DOMAIN =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "⚠️  ВАЖНО: Это самоподписанный сертификат для IP-адреса."
    echo "   Браузеры будут показывать предупреждение о безопасности."
    echo ""
    echo "Для продакшена с IP-адресом:"
    echo "  1. Настройте доменное имя, указывающее на этот IP"
    echo "  2. Используйте Let's Encrypt с доменным именем:"
    echo "     sudo certbot certonly --standalone -d yourdomain.com"
    echo ""
else
    echo "Для продакшена рекомендуется использовать Let's Encrypt:"
    echo "  sudo certbot certonly --standalone -d $DOMAIN"
    echo ""
    echo "⚠️  Let's Encrypt НЕ работает с IP-адресами, только с доменными именами!"
    echo ""
fi

