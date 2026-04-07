# 🏗️ Architecture Loura - Vue d'ensemble

## 📐 Schéma de l'Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT                                │
│                  (Navigateur Web / App)                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS (443) / HTTP (80)
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                      │
│  • Terminaison SSL/TLS                                        │
│  • Compression Gzip                                           │
│  • Static/Media files                                         │
│  • Load balancing                                             │
└──────┬──────────────────────────────────────┬────────────────┘
       │                                      │
       │ /api/, /admin/, /ws/                │ /
       │                                      │
┌──────▼───────────────────────┐     ┌───────▼────────────────┐
│    BACKEND (Django + Daphne) │     │  FRONTEND (Next.js)     │
│                              │     │                         │
│  • Django 5.2                │     │  • Next.js 16           │
│  • Django REST Framework     │     │  • React 19             │
│  • Django Channels (WS)      │     │  • TypeScript           │
│  • Daphne (ASGI Server)      │     │  • Tailwind CSS         │
│  • Port: 8000                │     │  • Port: 3000           │
└──────┬───────────────────────┘     └─────────────────────────┘
       │
       │
       ├─────────────┬──────────────┬─────────────┐
       │             │              │             │
┌──────▼──────┐ ┌───▼────┐  ┌──────▼──────┐ ┌───▼──────────┐
│ PostgreSQL  │ │ Redis  │  │   Celery    │ │ Celery Beat  │
│             │ │        │  │   Worker    │ │  (Scheduler) │
│  • DB       │ │ • Cache│  │ • Tasks     │ │ • Cron jobs  │
│  • Port     │ │ • Broker│  │ • Async     │ │              │
│    5432     │ │ • WS   │  │   jobs      │ │              │
│             │ │  Layer │  │             │ │              │
└─────────────┘ └────────┘  └─────────────┘ └──────────────┘
```

---

## 🔄 Flux de Données

### 1. Requête API Standard

```
Client → Nginx → Backend → PostgreSQL
  ↑                ↓
  └────────────────┘
     JSON Response
```

### 2. Upload de Fichier

```
Client → Nginx → Backend → Media Volume
                    ↓
                PostgreSQL (metadata)
```

### 3. Tâche Asynchrone (Celery)

```
Client → Backend → Celery Broker (Redis)
                      ↓
                Celery Worker → Task Execution
                      ↓
                Results Backend (Redis)
                      ↓
                   Backend ← Poll results
```

### 4. WebSocket (Django Channels)

```
Client ←─→ Nginx ←─→ Backend (Channels)
                        ↓
                    Redis (Channel Layer)
                        ↓
                    Broadcast to clients
```

### 5. Frontend SSR/SSG

```
Client → Nginx → Next.js → Backend API
          ↓
    Static files from build
```

---

## 📦 Services Docker

| Service | Image | Port(s) | Volume(s) | Rôle |
|---------|-------|---------|-----------|------|
| **db** | postgres:16 | 5432 | postgres_data | Base de données principale |
| **redis** | redis:7-alpine | 6379 | redis_data | Cache, Broker Celery, Channel Layer |
| **backend** | Custom (Django) | 8000 | backend, static, media | API REST, Admin, WebSocket |
| **celery_worker** | Custom (Django) | - | backend | Exécution des tâches async |
| **celery_beat** | Custom (Django) | - | backend | Planification des tâches |
| **frontend** | Custom (Next.js) | 3000 | frontend | Application web |
| **nginx** | nginx:alpine | 80, 443 | static, media, certs | Reverse proxy, SSL |
| **certbot** | certbot/certbot | - | certbot | Renouvellement SSL auto |

---

## 🌐 Réseau Docker

### Réseau: `loura_network` (bridge)

Tous les services communiquent via ce réseau interne:

```
backend:8000  ← accessible par: frontend, celery_worker, celery_beat, nginx
frontend:3000 ← accessible par: nginx
db:5432       ← accessible par: backend, celery_*
redis:6379    ← accessible par: backend, celery_*
```

### Résolution DNS Interne

Les services se référencent par leur nom:
- `http://backend:8000` (depuis frontend ou nginx)
- `postgresql://db:5432` (depuis backend)
- `redis://redis:6379` (depuis backend ou celery)

---

## 💾 Volumes Persistants

| Volume | Montage | Contenu | Backup Requis |
|--------|---------|---------|---------------|
| `postgres_data` | `/var/lib/postgresql/data` | Base de données | ⚠️ Critique |
| `redis_data` | `/data` | Persistence Redis | ⚙️ Cache, peut être reconstruit |
| `static_volume` | `/app/staticfiles` | CSS, JS, images statiques | ✅ Peut être régénéré |
| `media_volume` | `/app/media` | Uploads utilisateurs | ⚠️ Important |

---

## 🔐 Sécurité

### Isolation des Conteneurs

1. **Utilisateurs non-root**: Backend et Frontend utilisent des utilisateurs dédiés
2. **Réseau privé**: Services communiquent uniquement via le réseau Docker interne
3. **Volumes séparés**: Chaque service a ses propres volumes

### Configuration HTTPS (Production)

```
Client → HTTPS (443) → Nginx (Termination SSL)
                         ↓
                    HTTP interne → Backend/Frontend
```

### Variables Sensibles

Stockées dans `.env` files:
- ⚠️ Jamais commités dans Git (voir `.gitignore`)
- 🔐 Permissions 600 recommandées
- 🔄 Injectées dans les conteneurs via `environment` ou `env_file`

---

## 🚀 Environnements

### Développement (`docker-compose.yml`)

- **Mode**: DEBUG=True
- **Base de données**: SQLite ou PostgreSQL
- **Celery**: Mode synchrone (TASK_ALWAYS_EAGER)
- **Hot reload**: Code monté en volume
- **Ports exposés**: Tous (3000, 8000, 5432, 6379)
- **SSL**: Non requis

### Production (`docker-compose.prod.yml`)

- **Mode**: DEBUG=False
- **Base de données**: PostgreSQL obligatoire
- **Celery**: Mode async avec Redis
- **Code**: Copié dans l'image (pas de volume)
- **Ports exposés**: Uniquement 80/443 (via Nginx)
- **SSL**: Certbot + Let's Encrypt
- **Build**: Multi-stage pour optimisation

---

## ⚙️ Configuration par Environnement

### Variables d'Environnement Clés

| Variable | Développement | Production |
|----------|--------------|-----------|
| `DEBUG` | True | False |
| `SECRET_KEY` | Clé de dev | Clé forte unique |
| `DB_ENGINE` | sqlite3 | postgresql |
| `CELERY_BROKER_URL` | memory:// | redis://redis:6379/0 |
| `ALLOWED_HOSTS` | localhost | yourdomain.com |
| `CORS_ALLOWED_ORIGINS` | http://localhost:3000 | https://yourdomain.com |

---

## 📊 Scalabilité

### Horizontal Scaling

Possibilité d'ajouter plusieurs instances:

```yaml
backend:
  deploy:
    replicas: 3

celery_worker:
  deploy:
    replicas: 5
```

### Vertical Scaling

Limiter les ressources:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

---

## 🔄 Communication entre Services

### Backend → PostgreSQL

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.getenv('DB_HOST', 'db'),  # Nom du service Docker
        'PORT': '5432',
    }
}
```

### Backend → Redis (Celery)

```python
# settings.py
CELERY_BROKER_URL = os.getenv(
    'CELERY_BROKER_URL',
    'redis://redis:6379/0'  # Nom du service Docker
)
```

### Frontend → Backend

```typescript
// lib/api/config.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api'
```

> **Note**: En production avec Nginx, le frontend appelle `/api/` qui est proxifié vers `backend:8000/api/`

---

## 🎯 Points de Terminaison

### Backend (Django)

| Endpoint | Description |
|----------|-------------|
| `/api/` | REST API |
| `/admin/` | Interface d'administration |
| `/ws/` | WebSocket (Django Channels) |
| `/static/` | Fichiers statiques (via Nginx en prod) |
| `/media/` | Fichiers uploadés (via Nginx en prod) |

### Frontend (Next.js)

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/[organization]/` | Routes multi-tenant |
| `/_next/static/` | Assets Next.js |

---

## 📈 Monitoring & Logs

### Logs Docker

```bash
# Tous les services
docker compose logs -f

# Service spécifique
docker compose logs -f backend

# Dernières N lignes
docker compose logs --tail=100 backend
```

### Métriques

```bash
# Utilisation CPU/RAM
docker stats

# Espace disque
docker system df
```

---

## 🔧 Optimisations

### Images Docker

- **Multi-stage builds**: Réduction de la taille des images
- **Layer caching**: Dépendances installées avant le code source
- **Alpine Linux**: Images légères pour Nginx, Redis, Frontend

### Nginx

- **Gzip compression**: Réduction de la bande passante
- **Static file caching**: Headers `Cache-Control`
- **HTTP/2**: Performance améliorée
- **Connection pooling**: Keepalive activé

### Django

- **Connection pooling**: `CONN_MAX_AGE=600`
- **Static files**: Servis par Nginx (pas Django)
- **Session backend**: Redis (optionnel)

### Next.js

- **Standalone build**: Image réduite de 90%
- **Output caching**: `.next` optimisé
- **Image optimization**: Next.js built-in

---

## 🆘 Troubleshooting

### Problème de Réseau

```bash
# Vérifier le réseau
docker network inspect loura_stack_loura_network

# Tester la connectivité
docker compose exec frontend ping backend
docker compose exec backend nc -zv db 5432
```

### Problème de Volume

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect loura_stack_postgres_data

# Permissions
docker compose exec backend ls -la /app
```

---

**📝 Notes:**
- Cette architecture supporte aussi bien le développement que la production
- Tous les services sont containerisés et orchestrés via Docker Compose
- La configuration est gérée via variables d'environnement pour flexibilité
- Le système est prêt pour le scaling horizontal avec Docker Swarm ou Kubernetes
