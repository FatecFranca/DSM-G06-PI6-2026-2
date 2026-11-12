#!/bin/bash
set -euo pipefail

DOMINIO="doefacil.duckdns.org"
EMAIL="pedrohcsilva77@gmail.com"
CERT="/etc/letsencrypt/live/$DOMINIO/fullchain.pem"
CHAVE="/etc/letsencrypt/live/$DOMINIO/privkey.pem"
CONFIG="/etc/nginx/conf.d/doefacil-https.conf"

echo "[HTTPS] Verificando certificado..."

if [ ! -s "$CERT" ] || [ ! -s "$CHAVE" ]; then
    certbot certonly \
        --webroot \
        --webroot-path /var/www/letsencrypt \
        --domain "$DOMINIO" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring
fi
BACKUP="${CONFIG}.backup"

if [ -f "$CONFIG" ]; then
    cp "$CONFIG" "$BACKUP"
fi

echo "[HTTPS] Criando configuracao Nginx..."

cat > "$CONFIG" <<EOF
server {
    listen 443 ssl;
    server_name $DOMINIO;

    ssl_certificate $CERT;
    ssl_certificate_key $CHAVE;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

echo "[HTTPS] Validando Nginx..."

if nginx -t; then
    systemctl reload nginx
    echo "[HTTPS] HTTPS configurado com sucesso."
else
    echo "[HTTPS] Configuracao invalida. Restaurando Nginx..."

    if [ -f "$BACKUP" ]; then
        mv "$BACKUP" "$CONFIG"
    else
        rm -f "$CONFIG"
    fi

    nginx -t || true
    exit 1
fi

rm -f "$BACKUP"

echo "[HTTPS] Configurando renovacao automatica..."

cat > /etc/systemd/system/doefacil-certbot-renew.service <<EOF
[Unit]
Description=Renovar certificado HTTPS DoeFacil

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "/usr/bin/systemctl reload nginx"
EOF

cat > /etc/systemd/system/doefacil-certbot-renew.timer <<EOF
[Unit]
Description=Verificar renovacao HTTPS DoeFacil

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=30m
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now doefacil-certbot-renew.timer

echo "[HTTPS] Renovacao automatica configurada."
