# 🚀 Guide de Déploiement Loura

Ce guide explique comment déployer l'application Loura (Django + Next.js) en développement et en production.

## 📋 Table des matières

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Développement Local](#développement-local)
- [Déploiement Production (VPS)](#déploiement-production-vps)
- [Configuration SSL](#configuration-ssl)
- [Gestion et Maintenance](#gestion-et-maintenance)
- [Résolution de Problèmes](#résolution-de-problèmes)

---

## 🏗️ Architecture

### Stack Technique

**Backend:**
- Django 5.2 avec Django REST Framework
- PostgreSQL 16 (base de données)
- Redis 7 (cache, Celery broker, Channels)
- Celery (tâches asynchrones)
- Daphne (serveur ASGI pour WebSocket)

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy en production)
- Certbot (SSL/TLS)

### Architecture des Conteneurs

```
┌─────────────────────────────────────────┐
│            Nginx (Port 80/443)          │
│         (Reverse Proxy + SSL)           │
└────────────┬────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼─────┐    ┌────▼─────┐
│ Frontend │    │ Backend  │
│ Next.js  │    │  Django  │
│ (Port    │    │ (Port    │
│  3000)   │    │  8000)   │
└──────────┘    └────┬─────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐   ┌───▼────┐  ┌───▼────────┐
   │  DB    │   │ Redis  │  │   Celery   │
   │ Postgres│   │        │  │ Worker/Beat│
   └────────┘   └────────┘  └────────────┘
```

---

## ✅ Prérequis

### Pour le Développement

- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### Pour la Production (VPS)

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Docker & Docker Compose installés
- Nom de domaine configuré (DNS pointant vers le serveur)
- Au moins 2GB RAM, 2 CPU cores, 20GB stockage

---

## 💻 Développement Local

### 1. Cloner le projet

```bash
cd /path/to/loura/stack
```

### 2. Configurer l'environnement backend

```bash
# Copier le fichier .env exemple
cp backend/.env.example backend/.env

# Éditer le fichier avec vos valeurs (clés API, etc.)
nano backend/.env
```

### 3. Démarrer les services

```bash
# Construire et démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f
```

### 4. Accéder à l'application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### 5. Créer un superuser Django

```bash
docker compose exec backend python manage.py createsuperuser
```

### 6. Commandes utiles

```bash
# Arrêter les services
docker compose down

# Redémarrer un service
docker compose restart backend

# Voir les logs d'un service
docker compose logs -f backend

# Exécuter des commandes Django
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Accéder au shell Django
docker compose exec backend python manage.py shell

# Reconstruire les images
docker compose build --no-cache
```

---

## 🌐 Déploiement Production (VPS)

### 1. Préparer le serveur

```bash
# Se connecter au VPS
ssh user@your-server-ip

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt update
sudo apt install docker-compose-plugin

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Cloner le projet sur le serveur

```bash
git clone https://github.com/your-username/loura.git
cd loura/stack
```

### 3. Configurer les variables d'environnement

```bash
# Copier le fichier exemple
cp .env.production.example .env.production

# Éditer avec vos vraies valeurs
nano .env.production
```

**IMPORTANT:** Modifiez ces valeurs :
- `SECRET_KEY`: Générez une clé forte avec `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `DB_PASSWORD`: Mot de passe fort pour PostgreSQL
- `REDIS_PASSWORD`: Mot de passe fort pour Redis
- `ALLOWED_HOSTS`: Votre nom de domaine (ex: `loura.app,www.loura.app`)
- `CORS_ALLOWED_ORIGINS`: `https://loura.app,https://www.loura.app`
- `CSRF_TRUSTED_ORIGINS`: `https://loura.app,https://www.loura.app`
- `NEXT_PUBLIC_API_URL`: `https://loura.app/api/core`
- `DJANGO_SUPERUSER_*`: Identifiants admin
- `GOOGLE_API_KEY`: Votre clé API Google Gemini

### 4. Configurer le DNS

Avant de continuer, configurez vos DNS :

```
Type    Nom      Valeur
A       @        <IP-de-votre-serveur>
A       www      <IP-de-votre-serveur>
```

Attendez que la propagation DNS soit complète (testez avec `nslookup yourdomain.com`).

### 5. Déployer l'application

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement initial
./deploy.sh
# Choisir l'option 1 (Déploiement initial)
```

### 6. Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Tester l'accès
curl http://your-server-ip
```

---

## 🔐 Configuration SSL

### Obtenir un certificat SSL avec Let's Encrypt

```bash
# Exécuter le script de déploiement
./deploy.sh

# Choisir l'option 5 (Obtenir un certificat SSL)
# Entrer votre domaine et email
```

### Activer HTTPS

1. **Éditer la configuration Nginx:**

```bash
nano nginx/conf.d/default.conf
```

2. **Décommenter la section HTTPS** (lignes commençant par `# server {` pour HTTPS)

3. **Remplacer `yourdomain.com`** par votre vrai domaine

4. **Commenter la section HTTP** (server block sur le port 80, sauf la partie Certbot)

5. **Redémarrer Nginx:**

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

6. **Tester:**

```bash
curl https://yourdomain.com
```

---

## 🛠️ Gestion et Maintenance

### Mettre à jour l'application

```bash
# Pull les dernières modifications
git pull origin main

# Lancer la mise à jour
./deploy.sh
# Choisir l'option 2 (Mise à jour)
```

### Sauvegardes

#### Base de données PostgreSQL

```bash
# Backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U loura_user loura_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U loura_user loura_db
```

#### Fichiers média

```bash
# Backup
docker run --rm -v loura_stack_media_volume:/data -v $(pwd):/backup ubuntu tar czf /backup/media_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restore
docker run --rm -v loura_stack_media_volume:/data -v $(pwd):/backup ubuntu tar xzf /backup/media_backup.tar.gz -C /data
```

### Monitoring

#### Voir les logs

```bash
./deploy.sh
# Choisir l'option 4 (Voir les logs)
```

#### Statistiques des conteneurs

```bash
docker stats
```

#### Espace disque

```bash
# Voir l'utilisation
docker system df

# Nettoyer les images inutilisées
docker system prune -a
```

---

## 🐛 Résolution de Problèmes

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs backend

# Problème de migration ?
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Problème de permissions ?
docker compose -f docker-compose.prod.yml exec backend chown -R django:django /app
```

### Le frontend ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs frontend

# Rebuild le frontend
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Erreur de connexion à PostgreSQL

```bash
# Vérifier que PostgreSQL est démarré
docker compose -f docker-compose.prod.yml ps db

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec backend env | grep DB_

# Tester la connexion
docker compose -f docker-compose.prod.yml exec backend nc -zv db 5432
```

### Erreur de connexion à Redis

```bash
# Vérifier que Redis est démarré
docker compose -f docker-compose.prod.yml ps redis

# Tester la connexion
docker compose -f docker-compose.prod.yml exec backend redis-cli -h redis ping
```

### Problèmes de certificat SSL

```bash
# Renouveler le certificat manuellement
docker compose -f docker-compose.prod.yml run --rm certbot renew

# Vérifier la configuration Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Les fichiers statiques ne se chargent pas

```bash
# Recollecte les fichiers statiques
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --clear --noinput

# Redémarrer nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation Django : https://docs.djangoproject.com/
- Consulter la documentation Next.js : https://nextjs.org/docs

---

## 📝 Notes

- Les données sont persistées dans des volumes Docker
- En production, ne jamais utiliser `DEBUG=True`
- Changez toujours les mots de passe par défaut
- Configurez des backups automatiques
- Surveillez les logs régulièrement
- Mettez à jour les dépendances régulièrement pour la sécurité
