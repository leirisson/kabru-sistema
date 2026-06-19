#!/bin/sh
set -e

echo "Rodando migrations..."
node_modules/.bin/prisma migrate deploy

echo "Rodando seed..."
node_modules/.bin/prisma db seed

echo "Iniciando aplicação..."
exec node server.js
