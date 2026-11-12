#!/bin/bash
set -euo pipefail

echo "[HTTPS] Preparando teste de validacao..."

mkdir -p /var/www/letsencrypt/.well-known/acme-challenge

echo "doefacil-validacao-ok" > /var/www/letsencrypt/.well-known/acme-challenge/teste

echo "[HTTPS] Arquivo de teste criado."