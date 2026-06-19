#!/bin/sh
set -e

echo "Rodando migrations..."
node_modules/.bin/prisma migrate deploy

echo "Iniciando aplicação..."
exec node server.js
