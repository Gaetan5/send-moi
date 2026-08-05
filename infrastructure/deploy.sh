#!/bin/bash

# Exit on error
set -e

echo "🚀 Démarrage du déploiement Zero-Downtime Send Moi Production..."

# 1. Pull latest Docker images
echo "📥 Récupération des dernières images Docker..."
docker-compose -f backend/docker-compose.yml pull

# 2. Run Database Migrations before switching traffic
echo "🗄️ Exécution des migrations Prisma de la base de données..."
docker-compose -f backend/docker-compose.yml run --rm backend npx prisma migrate deploy

# 3. Rolling update of backend services
echo "🔄 Mise à jour sans interruption des conteneurs..."
docker-compose -f backend/docker-compose.yml up -d --no-deps --build backend

# 4. Clean up unused images
echo "🧹 Nettoyage des anciennes images Docker..."
docker image prune -f

echo "✅ Déploiement Production terminé avec succès ! API & WebSockets opérationnels."
