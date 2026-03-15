# Guide de Démarrage Rapide - PWA

## L'Application est Déjà PWA ! 🎉

Votre application Loura est maintenant une Progressive Web App complète. Voici ce que cela signifie:

## 3 Niveaux de Mode Offline

### 1. Cache des Données API (IndexedDB)
**Déjà implémenté** ✅
- Les réponses API sont mises en cache
- Les mutations offline sont synchronisées
- TTL configurable par service

### 2. Cache des Assets (Service Worker)
**Nouveau** ✅
- HTML, CSS, JavaScript en cache
- Images, fonts, icônes en cache
- Fonctionne même sans internet

### 3. Page Offline de Secours
**Nouveau** ✅
- Page élégante si aucune connexion
- Auto-retry toutes les 30s
- Redirection automatique quand online

## Installation sur Appareil

### Desktop (Chrome/Edge/Brave)
1. Visiter le site
2. Cliquer sur 🔽 dans la barre d'adresse
3. "Installer Loura"

### iOS (Safari)
1. Visiter dans Safari
2. Bouton Partager ⬆️
3. "Sur l'écran d'accueil"

### Android (Chrome)
1. Visiter le site
2. Menu ⋮
3. "Installer l'application"

## Tester le Mode Offline

### Méthode 1: DevTools
```
1. Ouvrir Chrome DevTools (F12)
2. Network tab → Checkbox "Offline"
3. Recharger la page
✅ L'application fonctionne !
```

### Méthode 2: Service Worker
```
1. DevTools → Application tab
2. Service Workers section
3. Checkbox "Offline"
4. Naviguer dans l'app
✅ Tout fonctionne en cache !
```

### Méthode 3: Vraiment offline
```
1. Désactiver Wi-Fi et mobile data
2. Ouvrir l'application
✅ Assets chargés depuis le cache
✅ Données API depuis IndexedDB
```

## Ce Qui Fonctionne Offline

### ✅ Disponible Offline
- Navigation dans toutes les pages visitées
- Consultation des données en cache
- Modifications (sauvegardées localement)
- Images, icônes, logos
- Styles et JavaScript

### ⏳ Nécessite Connexion
- Nouvelles données non cachées
- Upload de fichiers
- Streaming temps réel
- Notifications push

## Vérifier que PWA Fonctionne

### 1. Service Worker Actif

Ouvrir la console:
```javascript
// Vérifier l'enregistrement
navigator.serviceWorker.ready.then(reg => {
  console.log('SW actif !', reg);
});

// Voir les caches
caches.keys().then(console.log);
// → ['loura-cache-v1']
```

### 2. Manifest Chargé

DevTools → Application → Manifest
```
✅ Name: Loura - Plateforme de Gestion
✅ Short name: Loura
✅ Start URL: /
✅ Display: standalone
✅ Theme color: #667eea
```

### 3. Cache Storage

DevTools → Application → Cache Storage
```
loura-cache-v1/
  ├── /
  ├── /offline.html
  ├── /_next/static/**
  ├── /images/**
  └── /manifest.json
```

## Performance

### Première Visite
```
Temps de chargement: ~2-3s
Assets téléchargés: ~2-5 MB
Cache créé: ✅
```

### Visites Suivantes
```
Temps de chargement: ~200-500ms
Source: Cache local
Requêtes réseau: Minimales
```

### Mode Offline
```
Temps de chargement: ~100-300ms
Source: 100% cache
Requêtes réseau: 0
```

## Mise à Jour de l'App

Quand une nouvelle version est déployée:

1. **Détection automatique**
   - Le SW vérifie les mises à jour
   - Toutes les heures automatiquement

2. **Notification utilisateur**
   - Prompt en bas à droite
   - "Mise à jour disponible"

3. **Installation**
   - Cliquer "Mettre à jour"
   - Rechargement de la page
   - Nouveau cache installé

## Configuration Avancée

### Modifier le TTL du Cache

```typescript
// public/sw.js
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000,   // 7 jours (par défaut)
  dynamic: 24 * 60 * 60 * 1000,       // 24 heures
};
```

### Changer les Assets Pré-cachés

```javascript
// public/sw.js
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/images/logo-icon.png',
  '/your-critical-page',  // ← Ajouter ici
];
```

### Vider le Cache Manuellement

```typescript
import { useServiceWorker } from '@/lib/hooks';

const { clearCache } = useServiceWorker();

// Dans un bouton
<button onClick={async () => {
  const success = await clearCache();
  if (success) window.location.reload();
}}>
  Vider le cache
</button>
```

## Debugging

### Logs Console

```javascript
// Service Worker
[SW] Installation...
[SW] Pré-cache des assets essentiels
[SW] Activation...
[SW] Cache hit: /images/logo.png      // ✅ Depuis cache
[SW] Cache miss, fetching: /new-page  // ⬇️ Téléchargement

// React
[PWA] Service Worker actif
```

### Inspecter le Cache

```javascript
// Dans la console
caches.open('loura-cache-v1').then(cache => {
  cache.keys().then(keys => {
    console.log('Fichiers en cache:', keys.length);
    keys.forEach(req => console.log(req.url));
  });
});
```

### Forcer Mise à Jour

```javascript
// Dans la console
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
  console.log('Vérification mise à jour forcée');
});
```

## Troubleshooting

### "Service Worker pas enregistré"
```bash
# Vérifier que le fichier existe
ls public/sw.js

# Redémarrer le serveur
pnpm dev
```

### "Cache ne se met pas à jour"
```javascript
// Dans DevTools → Application → Service Workers
// Cliquer "Update" ou "Unregister"
// Recharger la page
```

### "Mode offline ne fonctionne pas"
```
1. Vérifier SW actif dans DevTools
2. Vérifier Cache Storage contient des fichiers
3. Tester avec Offline checkbox dans DevTools
```

## Documentation Complète

- **PWA.md** - Documentation technique complète
- **OFFLINE.md** - Système de cache données
- **OFFLINE_QUICKSTART.md** - Guide cache API

## Support

- Chrome DevTools → Application tab
- Lighthouse audit
- [PWA Builder](https://www.pwabuilder.com/)

---

**Prochaine étape**: Installer l'app sur votre appareil et tester offline ! 📱
