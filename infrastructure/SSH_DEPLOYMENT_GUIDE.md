# Guide de Configuration du Déploiement SSH Automatique GitHub Actions

Ce document explique comment configurer les **Secrets GitHub** pour activer le déploiement automatique sans interruption (Zero-Downtime CD) sur votre serveur VPS (Douala / Yaoundé / Cloud).

---

## 🔑 1. Secrets GitHub à Déclarer dans le Dépôt

Rendez-vous dans votre dépôt GitHub : **Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**

| Nom du Secret | Valeur Exemple | Description |
|---|---|---|
| `SSH_HOST` | `api.sendmoi.cm` ou `198.51.100.42` | Adresse IP publique ou nom de domaine de votre serveur VPS. |
| `SSH_USER` | `deploy` ou `root` | Nom de l'utilisateur SSH sur le serveur VPS. |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Clé privée SSH (sans mot de passe) autorisée sur le VPS. |
| `SSH_PORT` | `22` (Optionnel) | Port SSH du serveur VPS (22 par défaut). |
| `TARGET_DIR` | `/var/www/send-moi` (Optionnel) | Chemin absolu du projet sur le disque du serveur VPS. |

---

## 🖥️ 2. Configuration Initiale sur le Serveur VPS (Une seule fois)

Sur votre serveur VPS, exécutez les commandes d'initialisation suivantes :

```bash
# 1. Création du dossier du projet
mkdir -p /var/www/send-moi
cd /var/www/send-moi

# 2. Cloner le dépôt Git
git clone https://github.com/votre-compte/send-moi.git .

# 3. Créer le fichier d'environnement de production
cp backend/.env.example backend/.env
nano backend/.env # Renseigner JWT_SECRET et DATABASE_URL de production

# 4. Autoriser la clé publique SSH dans authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 🚀 3. Fonctionnement Automatique

À chaque nouveau `git push` sur la branche `main` :
1. GitHub Actions exécute les tests unitaires et vérifie la compilation du Backend NestJS.
2. L'image Docker est construite et publiée sur GHCR.
3. Le job **SSH Remote Deployment** se connecte en SSH au VPS, applique les migrations Prisma (`npx prisma migrate deploy`) et relance les conteneurs Docker sans coupure de service.
