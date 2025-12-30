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

openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days "$DAYS" \
    -subj "/C=RU/ST=State/L=City/O=Flips/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"

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
echo "Для продакшена рекомендуется использовать Let's Encrypt:"
echo "  sudo certbot certonly --standalone -d yourdomain.com"
echo ""

