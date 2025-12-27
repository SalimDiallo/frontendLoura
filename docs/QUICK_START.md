# 🚀 Quick Start - Frontend Loura

## Démarrage en 3 étapes

### 1. Installation

```bash
pnpm install
```

### 2. Configuration

```bash
# Copier le fichier d'environnement
cp .env.local.example .env.local

# Éditer si nécessaire (par défaut: http://localhost:8000/api/core)
nano .env.local
```

### 3. Lancement

```bash
pnpm dev
```

Visitez **http://localhost:3000** 🎉

---

## 📝 Parcours utilisateur

1. **S'inscrire** : http://localhost:3000/register
2. **Se connecter** : http://localhost:3000/login
3. **Dashboard** : http://localhost:3000/dashboard
4. **Créer une organisation** : Cliquer sur "+ Nouvelle Organisation"

---

## 🔑 Prérequis

- ✅ Backend Django en cours d'exécution sur http://localhost:8000
- ✅ Catégories créées (`python manage.py create_sample_categories`)
- ✅ Node.js 18+ installé
- ✅ pnpm installé (`npm install -g pnpm`)

---

## 📦 Structure principale

```
app/
├── login/          → Connexion
├── register/       → Inscription
└── dashboard/      → Tableau de bord

lib/
├── api/            → Client API
├── services/       → Services (auth, orgs, categories)
└── types/          → Types TypeScript
```

---

## 🐛 Problèmes courants

### Le backend ne répond pas

```bash
# Vérifier que Django tourne
curl http://localhost:8000/api/core/categories/
```

### Erreur CORS

Vérifiez dans `backend/app/lourabackend/settings.py` :
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

### Tokens invalides

Ouvrez la console du navigateur et exécutez :
```javascript
localStorage.clear()
```

Puis reconnectez-vous.

---

## 📚 Documentation complète

- **Frontend** : `README_INTEGRATION.md`
- **Backend** : `../../backend/app/ORGANISATION_API.md`
- **Guide complet** : `../../INTEGRATION_COMPLETE.md`

---

## ✨ Bon développement !
