# Guide de Dépannage - Scanner QR Code

## 🐛 Erreurs Courantes et Solutions

### 1. `TypeError: Cannot read properties of null (reading 'clientWidth')`

**Cause :**
L'API Html5Qrcode essaie d'accéder à l'élément DOM `#qr-reader` avant qu'il ne soit complètement monté.

**Solution implémentée :**
```typescript
// ✅ Vérification de l'existence du DOM
const element = document.getElementById('qr-reader');
if (!element) {
  setError('Erreur d\'initialisation. Veuillez rafraîchir la page.');
  return;
}

// ✅ Attendre le rendu complet
await new Promise(resolve => setTimeout(resolve, 100));

// ✅ L'élément est toujours présent dans le DOM (pas de conditional rendering)
<div id="qr-reader" className="rounded-lg overflow-hidden"></div>
```

**Prévention :**
- L'élément `#qr-reader` doit TOUJOURS être présent dans le DOM
- Ne pas l'envelopper dans un `{condition && <div id="qr-reader">}`
- Ajouter un délai de 100ms avant d'initialiser le scanner

---

### 2. `NotFoundException: No MultiFormat Readers were able to detect the code`

**Cause :**
Image de mauvaise qualité ou QR code non reconnu.

**Solutions :**

**Pour le mode Caméra :**
```typescript
// ✅ Configuration optimale
const config = {
  fps: 10,                          // Pas trop rapide
  qrbox: { width: 300, height: 300 }, // Zone carrée
  aspectRatio: 1.0,                 // QR codes sont carrés
  disableFlip: false,               // Permet le mirroring
};
```

**Pour le mode Image :**
```typescript
// ✅ Activation de l'optimisation
const decodedText = await html5QrCode.scanFile(file, true);
//                                                      ^^^^ Important !
```

**Conseils utilisateur :**
- ✅ Prendre une photo nette et bien éclairée
- ✅ Le QR doit occuper au moins 30% de l'image
- ✅ Éviter les reflets et l'éblouissement
- ✅ Utiliser le mode Caméra si le mode Image échoue

---

### 3. `Error: Scan is already ongoing`

**Cause :**
Tentative de démarrer un scan alors qu'un autre est déjà en cours.

**Solution implémentée :**
```typescript
// ✅ Vérifier l'état avant de démarrer
if (cameraStarted) {
  await html5QrCodeRef.current.stop();
  setCameraStarted(false);
}

// ✅ Tracking de l'état
const [cameraStarted, setCameraStarted] = useState(false);

// ✅ Arrêt automatique après succès
const handleQRCodeSuccess = (decodedText: string) => {
  if (html5QrCodeRef.current && cameraStarted) {
    html5QrCodeRef.current.stop().catch(() => {});
    setCameraStarted(false);
  }
  // Process...
};
```

---

### 4. `NotAllowedError: Permission denied`

**Cause :**
L'utilisateur a refusé l'accès à la caméra.

**Solution implémentée :**
```typescript
try {
  await html5QrCodeRef.current.start(...);
} catch (err) {
  setError('Impossible de démarrer la caméra. Vérifiez les autorisations ou utilisez l\'upload d\'image.');
}
```

**Instructions utilisateur :**
1. Cliquer sur l'icône 🔒 dans la barre d'adresse
2. Autoriser l'accès à la caméra
3. Rafraîchir la page
4. Ou utiliser le mode "Importer une image"

---

### 5. Fuite Mémoire (Memory Leak)

**Cause :**
La caméra n'est pas arrêtée lors du démontage du composant.

**Solution implémentée :**
```typescript
// ✅ Cleanup dans useEffect
useEffect(() => {
  return () => {
    if (html5QrCodeRef.current && cameraStarted) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
  };
}, [cameraStarted]);

// ✅ Cleanup lors du changement de mode
const handleFileUpload = async (e) => {
  if (cameraStarted) {
    await html5QrCodeRef.current.stop();
    setCameraStarted(false);
  }
  // Scan file...
};

// ✅ Cleanup lors du reset
const handleReset = () => {
  if (html5QrCodeRef.current && cameraStarted) {
    html5QrCodeRef.current.stop().catch(() => {});
    setCameraStarted(false);
  }
  // Reset states...
};
```

---

### 6. Scanner ne se lance pas sur Mobile Safari

**Cause :**
Safari iOS a des restrictions sur l'autoplay et les permissions.

**Solution :**
```typescript
// ✅ L'utilisateur doit cliquer manuellement
{!cameraStarted && scanMode === 'camera' && (
  <Button onClick={startCameraScanner}>
    <HiOutlineCamera className="size-5 mr-2" />
    Démarrer la caméra
  </Button>
)}
```

**Note :**
- Ne PAS démarrer automatiquement la caméra au chargement
- Attendre une interaction utilisateur (clic)
- Safari iOS 14.3+ requis pour les permissions caméra

---

### 7. QR Code Scanné mais Erreur Backend

**Cause :**
Le QR code est valide mais le token a expiré ou est invalide.

**Solution implémentée :**
```typescript
try {
  const data = JSON.parse(decodedText);
  if (data.session_token && data.employee_name) {
    await performCheckIn(data.session_token);
  } else {
    setError('QR code invalide: données manquantes');
  }
} catch (err) {
  setError('QR code invalide: format non reconnu');
}

// Dans performCheckIn
try {
  const response = await qrCheckIn({ session_token: token }, orgSlug);
  // Success...
} catch (err: any) {
  setError(err.message || 'Erreur lors du pointage');
}
```

**Messages d'erreur backend :**
- "Cette session QR a expiré" → Demander un nouveau QR
- "Session QR invalide" → QR déjà utilisé ou incorrect
- "Vous avez déjà pointé aujourd'hui" → Arrivée + sortie déjà faites

---

### 8. Image Uploadée mais Rien ne se Passe

**Cause :**
L'input file est masqué et l'événement ne se propage pas.

**Solution implémentée :**
```typescript
// ✅ Input caché avec ref
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileUpload}
/>

// ✅ Bouton qui trigger l'input
<Button onClick={() => fileInputRef.current?.click()}>
  <HiOutlinePhoto className="size-5 mr-2" />
  Importer une image
</Button>
```

---

### 9. Multiple Scans Simultanés

**Cause :**
Plusieurs composants créent des instances Html5Qrcode.

**Solution implémentée :**
```typescript
// ✅ Singleton via useRef
const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

// ✅ Réutiliser l'instance existante
if (!html5QrCodeRef.current) {
  html5QrCodeRef.current = new Html5Qrcode('qr-reader', {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    verbose: false,
  });
}
```

---

### 10. Build Errors avec Turbopack/Next.js 16

**Cause :**
html5-qrcode utilise des APIs navigateur pas disponibles côté serveur.

**Solution :**
```typescript
// ✅ 'use client' en haut du fichier
'use client';

// ✅ Vérifier window avant d'utiliser APIs navigateur
if (typeof window !== 'undefined') {
  // Code navigateur...
}

// ✅ Imports dynamiques si nécessaire
const Html5Qrcode = dynamic(() => import('html5-qrcode'), { ssr: false });
```

---

## 🔍 Checklist de Débogage

Quand un problème survient, suivez cette checklist :

### Frontend
- [ ] L'élément `#qr-reader` est présent dans le DOM ?
- [ ] Le composant est marqué `'use client'` ?
- [ ] Un seul scanner est actif à la fois ?
- [ ] La caméra est arrêtée avant de changer de mode ?
- [ ] Les permissions caméra sont accordées ?
- [ ] Le cleanup est fait lors du démontage ?

### Scan Caméra
- [ ] L'utilisateur a cliqué pour démarrer ?
- [ ] La caméra n'est pas déjà utilisée par un autre onglet ?
- [ ] Le navigateur supporte `getUserMedia` ?
- [ ] Le QR code est bien cadré dans la zone de scan ?
- [ ] L'éclairage est suffisant ?

### Scan Image
- [ ] L'image est au format supporté (jpg, png, webp) ?
- [ ] L'image n'est pas trop grande (< 10MB recommandé) ?
- [ ] Le QR code est visible et net dans l'image ?
- [ ] L'image n'a pas de filtre ou d'effet appliqué ?
- [ ] Le QR occupe au moins 30% de l'image ?

### Backend
- [ ] Le token est bien envoyé dans la requête ?
- [ ] L'organisation slug est correct ?
- [ ] Le token n'a pas expiré (< 5 min) ?
- [ ] Le token n'a pas déjà été utilisé ?
- [ ] L'employé existe et est actif ?

---

## 🛠️ Outils de Débogage

### 1. Logs Console
```typescript
// Activer les logs verbeux temporairement
const html5QrCode = new Html5Qrcode('qr-reader', {
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  verbose: true,  // ← Activer pour debug
});
```

### 2. Tester le QR Code
```typescript
// Afficher le contenu décodé
const handleQRCodeSuccess = (decodedText: string) => {
  console.log('QR Code content:', decodedText);
  console.log('Parsed data:', JSON.parse(decodedText));
  // ...
};
```

### 3. Tester les Permissions
```javascript
// Dans la console navigateur
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('Permissions OK');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('Permissions denied:', err));
```

### 4. Vérifier l'Élément DOM
```javascript
// Dans la console navigateur
const element = document.getElementById('qr-reader');
console.log('Element:', element);
console.log('Client width:', element?.clientWidth);
console.log('Client height:', element?.clientHeight);
```

---

## 📱 Tests Recommandés

### Navigateurs Desktop
- [ ] Chrome/Edge (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (macOS)

### Navigateurs Mobile
- [ ] Chrome Android
- [ ] Safari iOS 14.3+
- [ ] Firefox Android
- [ ] Samsung Internet

### Scénarios
- [ ] Scan caméra avec QR valide
- [ ] Scan caméra avec QR invalide
- [ ] Scan image avec QR valide
- [ ] Scan image avec QR invalide
- [ ] Scan image floue
- [ ] Permission caméra refusée
- [ ] Changement de mode (caméra → image)
- [ ] Reset et nouveau scan
- [ ] QR expiré (> 5 min)
- [ ] QR déjà utilisé
- [ ] Déjà pointé (2 fois aujourd'hui)

---

## 🚀 Performance

### Optimisations Appliquées
- ✅ FPS limité à 10 (au lieu de 30)
- ✅ QR Code uniquement (pas de barcode)
- ✅ Zone de scan limitée (300x300)
- ✅ Logs verbeux désactivés
- ✅ Cleanup automatique
- ✅ Délai 100ms avant init (évite race condition)

### Métriques Cibles
- Temps de scan caméra : < 2 secondes
- Temps de scan image : < 1 seconde
- Temps d'initialisation : < 500ms
- Usage CPU : < 20%
- Usage mémoire : < 50MB

---

## 📞 Support

**Si le problème persiste :**

1. **Collecter les infos :**
   - Navigateur et version
   - Système d'exploitation
   - Message d'erreur exact
   - Logs console (F12)
   - Screenshots si possible

2. **Tester la solution de contournement :**
   - Essayer l'autre mode de scan
   - Essayer un autre navigateur
   - Vider le cache et rafraîchir
   - Désactiver les extensions navigateur

3. **Contacter l'équipe technique :**
   - Fournir les infos collectées
   - Indiquer les étapes pour reproduire
   - Mentionner les solutions tentées

---

*Dernière mise à jour : 2025-12-15*
*Version : 2.1.0*
