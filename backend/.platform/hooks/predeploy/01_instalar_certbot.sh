#!/bin/bash
set -euo pipefail

echo "[HTTPS] Instalando Certbot e plugin Nginx..."

dnf install -y certbot python3-certbot-nginx

echo "[HTTPS] Certbot instalado com sucesso."
