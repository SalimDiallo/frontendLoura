# Guide d'Utilisation - Système de Pointage par QR Code

## Vue d'ensemble

Le système de pointage par QR code permet aux employés de pointer leur arrivée et leur sortie de manière rapide et sécurisée en scannant un QR code unique généré par un administrateur.

**Fonctionnalités principales :**
- ✅ **Double scan automatique** : Un seul QR code pour l'arrivée (matin) et la sortie (soir)
- ✅ **Détection intelligente** : Le système détermine automatiquement s'il s'agit d'une arrivée ou d'une sortie
- ✅ **Sécurisé** : QR codes à usage unique avec expiration (5 minutes par défaut)
- ✅ **Gestion des permissions** : Seuls les utilisateurs autorisés peuvent générer des QR codes
- ✅ **Feedback visuel** : Messages clairs indiquant le type de pointage effectué

---

## Pour les Administrateurs

### 1. Permission requise

Pour générer des QR codes, vous devez avoir la permission :
- **Code** : `attendance.create_qr_session`
- **Nom** : "Générer des QR codes de pointage"

Si vous n'avez pas cette permission, contactez un super administrateur.

### 2. Générer un QR Code

**Étapes :**

1. **Accéder à la page de génération**
   - Naviguer vers : `/apps/{organisation}/hr/attendance/qr-display`
   - Ou depuis le menu : Ressources Humaines → Pointage → Générer QR Code

2. **Sélectionner un employé**
   - Utilisez la barre de recherche pour trouver un employé (nom, email, matricule)
   - Cliquez sur la carte de l'employé pour le sélectionner
   - Les employés inactifs ne sont pas affichés

3. **Générer le QR code**
   - Cliquez sur "Générer le QR Code"
   - Le QR code s'affiche immédiatement à l'écran
   - Un compte à rebours de 5 minutes démarre

4. **Afficher le QR code**
   - Affichez le QR code en plein écran
   - L'employé peut scanner avec son téléphone
   - Le même QR code fonctionne pour l'arrivée ET la sortie

**Options disponibles :**
- **Générer un nouveau code** : Créer un nouveau QR avec une nouvelle session
- **Sélectionner un autre employé** : Retourner à la liste pour choisir quelqu'un d'autre

### 3. Informations affichées

Lors de la génération, vous verrez :
- ✅ Nom complet de l'employé
- ✅ Email de l'employé
- ✅ QR code (encodé en JSON sécurisé)
- ✅ Temps restant avant expiration
- ✅ Badge "☀️ Arrivée • 🌙 Sortie (automatique)"

### 4. Sécurité

- **Expiration** : Chaque QR code expire après 5 minutes
- **Usage unique** : Une fois scanné, le QR devient invalide
- **Token sécurisé** : Utilise un token cryptographique de 32 caractères
- **Traçabilité** : Le système enregistre qui a créé chaque QR code

---

## Pour les Employés

### 1. Scanner un QR Code

**Prérequis :**
- Avoir accès à l'application web
- Être authentifié dans le système
- Avoir un appareil avec caméra OU la possibilité d'importer une image

**Étapes :**

1. **Accéder au scanner**
   - **Option 1** : Cliquez sur le bouton flottant bleu en bas à droite (visible partout)
   - **Option 2** : Naviguer vers `/apps/{organisation}/hr/attendance/qr-scan`
   - **Option 3** : Depuis le menu Ressources Humaines → Pointage

2. **Choisir le mode de scan**

   **Mode Caméra (recommandé)** :
   - Cliquez sur le bouton "Caméra"
   - Acceptez l'autorisation d'accès à la caméra si demandé
   - Pointez votre caméra vers le QR code affiché par l'administrateur
   - Le scan est automatique (pas de bouton à presser)
   - Maintenez le téléphone stable pour une meilleure détection

   **Mode Image** :
   - Prenez d'abord une photo du QR code avec votre téléphone
   - Assurez-vous que la photo est nette et bien éclairée
   - Cliquez sur le bouton "Importer une image"
   - Sélectionnez la photo que vous venez de prendre
   - Le scan démarre automatiquement

4. **Confirmation**
   - Un message de succès s'affiche immédiatement
   - Le système indique automatiquement s'il s'agit d'une :
     - **☀️ Arrivée** (premier scan de la journée) - Fond vert
     - **🌙 Sortie** (second scan de la journée) - Fond orange
   - L'heure exacte du pointage est affichée
   - Pour la sortie, le nombre d'heures travaillées est calculé automatiquement

5. **Redirection**
   - Après 3 secondes, vous êtes redirigé vers la page de pointage
   - Vous pouvez consulter votre historique de présence

### 2. Comportement du système

**Premier scan du jour (Arrivée) :**
```
✅ Crée un nouveau pointage
✅ Enregistre l'heure d'arrivée
✅ Statut : "Présent"
✅ Message : "Arrivée enregistrée à 08:30"
✅ Badge : ☀️ Arrivée
✅ Fond vert
```

**Second scan du jour (Sortie) :**
```
✅ Met à jour le pointage existant
✅ Enregistre l'heure de sortie
✅ Calcule les heures travaillées
✅ Message : "Sortie enregistrée à 17:30 (9h travaillées)"
✅ Badge : 🌙 Sortie
✅ Fond orange
```

**Troisième scan (Erreur) :**
```
❌ Refusé
❌ Message : "Vous avez déjà pointé aujourd'hui (arrivée: 08:30, sortie: 17:30)"
❌ Le QR code est désactivé
```

### 3. Messages d'erreur possibles

| Erreur | Signification | Solution |
|--------|---------------|----------|
| "Cette session QR a expiré" | Le QR code a plus de 5 minutes | Demandez un nouveau QR code |
| "Session QR invalide" | Le QR code est incorrect ou déjà utilisé | Scannez un QR code valide |
| "QR code invalide: format non reconnu" | Le QR scanné n'est pas un QR de pointage | Vérifiez que c'est bien le bon QR |
| "Vous avez déjà pointé aujourd'hui" | Arrivée ET sortie déjà enregistrées | Attendez demain pour pointer à nouveau |
| "Impossible de lire le QR code de cette image" | L'image est floue ou le QR n'est pas visible | Prenez une nouvelle photo plus nette |
| "Impossible de démarrer la caméra" | Permissions refusées ou caméra indisponible | Vérifiez les permissions ou utilisez le mode Image |

### 4. Conseils pratiques

**Pour un scan réussi :**
- ✅ Assurez-vous d'être connecté à votre compte
- ✅ **Mode Caméra** : Utilisez un appareil avec une bonne caméra
- ✅ **Mode Caméra** : Scannez dans un endroit bien éclairé
- ✅ **Mode Caméra** : Tenez le téléphone stable face au QR code
- ✅ **Mode Caméra** : Gardez une distance de 20-30 cm du QR code
- ✅ **Mode Image** : Prenez une photo nette et contrastée
- ✅ **Mode Image** : Assurez-vous que tout le QR code est visible
- ✅ **Mode Image** : Évitez les reflets et l'éblouissement

**En cas de problème :**
- 🔄 Cliquez sur "Réessayer" pour rescanner
- 🔄 Essayez l'autre mode (Caméra ↔ Image)
- 🔄 Actualisez la page si la caméra ne démarre pas
- 🔄 Vérifiez les autorisations de la caméra dans votre navigateur
- 🔄 Si l'image ne fonctionne pas, essayez avec une meilleure qualité
- 📞 Contactez votre administrateur si le problème persiste

---

## Architecture Technique

### Flux de données complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN : Génère le QR Code                               │
│    → Sélectionne un employé                                 │
│    → Clique "Générer"                                       │
│    → Backend crée QRCodeSession                             │
│    → Token unique + Expiration 5 min                        │
│    → QR Code affiché avec compte à rebours                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EMPLOYÉ : Scanne le QR Code                             │
│    → Ouvre /qr-scan                                         │
│    → Autorise la caméra                                     │
│    → Scanne le QR                                           │
│    → Envoie session_token au backend                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND : Traite le scan                                │
│    → Vérifie token valide et non expiré                     │
│    → Cherche pointage du jour pour cet employé              │
│                                                              │
│    CAS 1: Pas de pointage aujourd'hui                       │
│      → Créer Attendance avec check_in                       │
│      → Retourner { action: 'check_in', message: '...' }    │
│                                                              │
│    CAS 2: Check-in existe, pas de check-out                 │
│      → Mettre à jour avec check_out                         │
│      → Calculer total_hours                                 │
│      → Retourner { action: 'check_out', message: '...' }   │
│                                                              │
│    CAS 3: Check-in ET check-out existent                    │
│      → Retourner erreur 400                                 │
│                                                              │
│    → Désactiver la session (usage unique)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. FRONTEND : Affiche le résultat                          │
│    → Affiche message de succès personnalisé                 │
│    → Badge et couleurs selon action (vert/orange)           │
│    → Redirection automatique vers /attendance               │
└─────────────────────────────────────────────────────────────┘
```

### Permissions

| Action | Permission | Rôles autorisés |
|--------|-----------|-----------------|
| Générer QR | `attendance.create_qr_session` | Admin, Manager RH |
| Scanner QR | Authentification | Tous employés |
| Voir historique | `attendance.view` | Tous employés (leurs propres données) |
| Voir tout | `attendance.view_all` | Admin, Manager RH |

### Modèles de données

**QRCodeSession :**
```typescript
{
  id: string;
  organization: string;
  session_token: string;        // Token unique sécurisé
  qr_code_data: string;         // JSON encodé pour le QR
  employee: string;             // ID de l'employé
  employee_name: string;
  employee_email: string;
  created_by: string;           // ID de l'admin créateur
  expires_at: string;           // ISO datetime (5 min)
  is_active: boolean;           // Désactivé après scan
  created_at: string;
}
```

**QRAttendanceResponse :**
```typescript
{
  attendance: Attendance;       // Pointage complet
  action: 'check_in' | 'check_out';
  message: string;              // Message à afficher
}
```

---

## FAQ

### Questions fréquentes

**Q : Combien de temps un QR code est-il valide ?**
R : 5 minutes par défaut. Vous pouvez le configurer dans le backend (1-60 minutes).

**Q : Peut-on réutiliser un QR code ?**
R : Non, chaque QR code est à usage unique. Après le premier scan, il devient invalide.

**Q : Que se passe-t-il si j'oublie de pointer ma sortie ?**
R : Un administrateur peut corriger manuellement le pointage avec la permission `attendance.update`.

**Q : Puis-je pointer depuis n'importe quel appareil ?**
R : Oui, du moment que vous êtes authentifié et que l'appareil a une caméra fonctionnelle.

**Q : Le système fonctionne-t-il hors ligne ?**
R : Non, une connexion internet est nécessaire pour valider le QR code avec le backend.

**Q : Puis-je pointer pour quelqu'un d'autre ?**
R : Non, chaque QR code est lié à un employé spécifique. Seul l'employé concerné peut l'utiliser.

**Q : Que se passe-t-il si je scanne le QR 3 fois dans la même journée ?**
R : Le système refusera le 3ème scan avec un message d'erreur indiquant que vous avez déjà pointé.

**Q : Les heures travaillées sont-elles calculées automatiquement ?**
R : Oui, lorsque vous pointez votre sortie, le système calcule automatiquement la durée entre l'arrivée et la sortie.

**Q : Puis-je générer plusieurs QR codes en même temps ?**
R : Oui, mais un seul QR par employé à la fois. Vous pouvez générer un QR pour différents employés simultanément.

---

## Support

**En cas de problème technique :**
1. Vérifiez que vous avez les permissions nécessaires
2. Consultez les logs du backend pour les erreurs
3. Vérifiez que les sessions QR sont bien créées en base de données
4. Contactez votre équipe technique avec les détails de l'erreur

**Ressources utiles :**
- Documentation backend : `BACKEND_QR_IMPLEMENTATION.md`
- Guide des permissions : `ATTENDANCE_PERMISSIONS_GUIDE.md`
- Exemples de code : `ATTENDANCE_PERMISSIONS_EXAMPLES.tsx`

---

## Mises à jour futures possibles

**Améliorations envisageables :**
- ⏰ Durée d'expiration configurable par organisation
- 📍 Géolocalisation pour vérifier la présence sur site
- 📊 Statistiques de pointage en temps réel
- 📱 Application mobile native pour un scan plus rapide
- 🔔 Notifications push pour rappeler de pointer
- 📸 Photo de l'employé lors du scan (preuve de présence)
- 🎨 QR codes personnalisés avec logo de l'entreprise
- 📅 Génération de QR codes récurrents (hebdomadaires)

---

*Dernière mise à jour : 2025-12-15*
