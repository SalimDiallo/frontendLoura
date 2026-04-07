# ⚡ Guide de Démarrage Rapide - Loura

## 🚀 Installation en 3 Minutes

### Développement Local

```bash
# 1. Copier les configurations
cp backend/.env.example backend/.env

# 2. Démarrer tout (avec Make)
make dev

# OU sans Make:
docker compose up -d

# 3. Créer un admin
make createsuperuser
# OU: docker compose exec backend python manage.py createsuperuser

# ✅ C'est prêt!
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Production (VPS)

```bash
# 1. Copier et configurer
cp .env.production.example .env.production
nano .env.production  # Modifier SECRET_KEY, mots de passe, domaine

# 2. Déployer
chmod +x deploy.sh
./deploy.sh  # Option 1: Déploiement initial

# 3. SSL (après configuration DNS)
./deploy.sh  # Option 5: Certificat SSL
```

---

## 📋 Commandes Essentielles

### Avec Makefile (recommandé)

```bash
make help              # Voir toutes les commandes
make dev               # Démarrer dev
make logs              # Voir les logs
make restart           # Redémarrer
make migrate           # Appliquer migrations
make shell             # Shell Django
make clean             # Tout nettoyer
```

### Sans Makefile

```bash
# Démarrer
docker compose up -d

# Logs
docker compose logs -f
docker compose logs -f backend

# Redémarrer
docker compose restart
docker compose restart backend

# Arrêter
docker compose down

# Nettoyer
docker compose down -v
```

---

## 🔧 Commandes Django Courantes

```bash
# Migrations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Shell Django
docker compose exec backend python manage.py shell

# Créer un superuser
docker compose exec backend python manage.py createsuperuser

# Collecter les statiques
docker compose exec backend python manage.py collectstatic

# Tests
docker compose exec backend python manage.py test
```

---

## 🗄️ Base de Données

```bash
# Shell PostgreSQL
docker compose exec db psql -U loura_user -d loura_db

# Backup
docker compose exec db pg_dump -U loura_user loura_db > backup.sql

# Restore
cat backup.sql | docker compose exec -T db psql -U loura_user loura_db

# Voir les tables
docker compose exec db psql -U loura_user -d loura_db -c "\dt"
```

---

## 🔍 Debugging

```bash
# Voir tous les conteneurs
docker compose ps
docker ps -a

# Statistiques
docker stats

# Logs en temps réel
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery_worker

# Accéder à un conteneur
docker compose exec backend bash
docker compose exec frontend sh

# Redémarrer un service spécifique
docker compose restart backend
docker compose restart frontend
```

---

## 🐛 Problèmes Courants

### Le backend ne démarre pas

```bash
# Voir les erreurs
docker compose logs backend

# Vérifier la connexion DB
docker compose exec backend nc -zv db 5432

# Réinitialiser
docker compose down
docker compose up -d
```

### Erreur de migration

```bash
# Forcer les migrations
docker compose exec backend python manage.py migrate --run-syncdb

# Réinitialiser les migrations (⚠️ DANGER en prod)
docker compose down -v
docker compose up -d
docker compose exec backend python manage.py migrate
```

### Problème de permissions

```bash
docker compose exec backend chown -R django:django /app
docker compose restart backend
```

### Le frontend ne se connecte pas au backend

```bash
# Vérifier les variables d'env
docker compose exec frontend env | grep NEXT_PUBLIC

# Vérifier le réseau
docker compose exec frontend ping backend

# Rebuild
docker compose build frontend
docker compose up -d frontend
```

---

## 📦 Gestion des Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect loura_stack_postgres_data

# Supprimer les volumes (⚠️ Perte de données)
docker compose down -v

# Backup d'un volume
docker run --rm -v loura_stack_media_volume:/data -v $(pwd):/backup ubuntu tar czf /backup/media.tar.gz -C /data .
```

---

## 🔄 Mise à Jour

```bash
# Git pull
git pull origin main

# Rebuild et redémarrer
docker compose down
docker compose build --no-cache
docker compose up -d

# Appliquer migrations
docker compose exec backend python manage.py migrate
```

---

## 🌐 Production - SSL/HTTPS

```bash
# 1. Obtenir le certificat
./deploy.sh  # Option 5

# 2. Éditer nginx
nano nginx/conf.d/default.conf
# Décommenter la section HTTPS
# Remplacer yourdomain.com par votre domaine

# 3. Tester la config
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# 4. Redémarrer
docker compose -f docker-compose.prod.yml restart nginx

# 5. Renouvellement auto (déjà configuré)
docker compose -f docker-compose.prod.yml logs certbot
```

---

## 📊 Monitoring

```bash
# Voir l'utilisation des ressources
docker stats

# Espace disque
docker system df

# Nettoyer les images inutilisées
docker system prune

# Logs d'un service spécifique
docker compose logs -f --tail=100 backend
```

---

## 🔐 Sécurité

```bash
# Changer le SECRET_KEY Django
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Voir les variables d'environnement
docker compose exec backend env | grep -E "SECRET|PASSWORD|KEY"

# Permissions des fichiers sensibles
chmod 600 .env .env.production backend/.env
```

---

## 📁 Fichiers Importants

```
.env.production          # Variables de production
backend/.env             # Variables de dev backend
docker-compose.yml       # Configuration dev
docker-compose.prod.yml  # Configuration production
nginx/conf.d/default.conf # Config Nginx/SSL
deploy.sh                # Script de déploiement
```

---

## ✅ Checklist Production

- [ ] Modifier `.env.production` avec vraies valeurs
- [ ] `DEBUG=False` en production
- [ ] `SECRET_KEY` fort et unique
- [ ] Mots de passe DB et Redis forts
- [ ] DNS configuré et propagé
- [ ] Firewall configuré (ports 80, 443, 22)
- [ ] SSL/TLS activé
- [ ] Backups automatiques configurés
- [ ] Monitoring en place
- [ ] Logs centralisés

---

## 🆘 Aide

```bash
# Voir l'aide Make
make help

# Logs détaillés
docker compose logs -f --tail=500

# État des services
docker compose ps

# Documentation
cat README.md
cat DEPLOYMENT.md
```

---

**💡 Astuce:** Ajoutez ces alias dans votre `~/.bashrc` ou `~/.zshrc` :

```bash
alias dc='docker compose'
alias dce='docker compose exec'
alias dcl='docker compose logs -f'
alias dcr='docker compose restart'
alias dps='docker ps'
alias dst='docker stats'
```

Puis rechargez : `source ~/.bashrc`

---

**🎉 Bon développement !**
