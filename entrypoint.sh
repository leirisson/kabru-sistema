#!/bin/sh
set -e

echo "Rodando migrations..."
node_modules/.bin/prisma migrate deploy

echo "Rodando seed..."
node_modules/.bin/tsx prisma/seed.ts

echo "Iniciando aplicação..."
exec node server.js
