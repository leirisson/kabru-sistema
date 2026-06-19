#!/bin/sh
set -e

echo "Rodando migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Rodando seed..."
node node_modules/prisma/build/index.js db seed

echo "Iniciando aplicação..."
exec node server.js
