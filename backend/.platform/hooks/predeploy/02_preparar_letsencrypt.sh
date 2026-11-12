#!/bin/bash
set -euo pipefail

echo "[HTTPS] Preparando diretorio de validacao..."

mkdir -p /var/www/letsencrypt/.well-known/acme-challenge

echo "[HTTPS] Diretorio de validacao preparado."