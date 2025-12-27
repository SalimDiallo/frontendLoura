# 🎨 Configuration du Thème Loura

## ✨ Vue d'ensemble

Le thème Loura a été configuré avec une palette de couleurs personnalisée, une typographie optimisée pour la lisibilité et une excellente expérience utilisateur.

---

## 🔤 Typographie

### Police principale: **Inter**

Inter a été choisie car c'est la référence pour les applications de gestion:
- ✅ Excellente lisibilité à toutes les tailles
- ✅ Conçue spécifiquement pour les interfaces digitales
- ✅ Support complet des caractères latins
- ✅ Optimisée pour l'affichage écran
- ✅ Utilisée par GitHub, Figma, Stripe, etc.

### Police mono: **JetBrains Mono**

Pour le code et les identifiants:
- ✅ Excellente lisibilité pour le code
- ✅ Ligatures optionnelles
- ✅ Distinction claire entre caractères similaires (0 vs O, 1 vs l)

---

## 🎨 Palette de couleurs

### Couleur primaire: **Brand (Jaune/Or)**

```css
--color-brand-300: #f4d400  /* Couleur principale */
--color-brand-500: #c8a600  /* Variante moyenne */
--color-brand-700: #8c7400  /* Variante foncée */
```

Utilisée pour:
- Boutons primaires
- Éléments interactifs importants
- Accents visuels
- Focus states

### Couleurs fonctionnelles

**Success (Vert)**
```css
--color-success-600: #039855  /* Principal */
--color-success-500: #12b76a  /* Plus clair */
--color-success-700: #027a48  /* Plus foncé */
```
Utilisée pour: états de réussite, validations, confirmations

**Error (Rouge)**
```css
--color-error-600: #d92d20   /* Principal */
--color-error-500: #f04438   /* Plus clair */
--color-error-700: #b42318   /* Plus foncé */
```
Utilisée pour: erreurs, suppressions, alertes critiques

**Warning (Orange/Jaune)**
```css
--color-warning-600: #dc6803  /* Principal */
--color-warning-500: #f79009  /* Plus clair */
--color-warning-700: #b54708  /* Plus foncé */
```
Utilisée pour: avertissements, actions importantes

**Gray (Neutre)**
```css
--color-gray-50: #f9fafb    /* Très clair */
--color-gray-200: #e4e7ec   /* Bordures */
--color-gray-500: #667085   /* Texte secondaire */
--color-gray-900: #101828   /* Texte principal */
```
Utilisée pour: textes, bordures, arrière-plans

---

## 🌓 Mode clair / sombre

Le thème supporte automatiquement le mode sombre:

### Mode clair
- Arrière-plan: Blanc (#FFFFFF)
- Texte: Gray 900 (#101828)
- Cartes: Blanc avec ombres légères
- Bordures: Gray 200 (#e4e7ec)

### Mode sombre
- Arrière-plan: Gray 900 (#101828)
- Texte: Blanc (#FFFFFF)
- Cartes: Gray 800 avec ombres
- Bordures: Gray 700

---

## 🧩 Composants de base

### Button

Variants disponibles:
```tsx
import { Button } from "@/components/ui/button"

// Primary (brand jaune/or)
<Button variant="default">Créer</Button>

// Success (vert)
<Button variant="success">Valider</Button>

// Destructive (rouge)
<Button variant="destructive">Supprimer</Button>

// Warning (orange)
<Button variant="warning">Attention</Button>

// Secondary (gris)
<Button variant="secondary">Annuler</Button>

// Outline
<Button variant="outline">Options</Button>

// Ghost
<Button variant="ghost">Fermer</Button>

// Link
<Button variant="link">En savoir plus</Button>
```

Tailles:
```tsx
<Button size="sm">Petit</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grand</Button>
<Button size="icon"><Icon /></Button>
```

État de chargement:
```tsx
<Button isLoading>Chargement</Button>
```

---

## 📐 Espacements et coins arrondis

### Border radius
```css
--radius: 0.5rem         /* 8px - par défaut */
--radius-sm: 0.125rem    /* 2px - petit */
--radius-md: 0.25rem     /* 4px - moyen */
--radius-lg: 0.5rem      /* 8px - grand */
--radius-xl: 0.875rem    /* 14px - très grand */
```

### Ombres
```css
--shadow-theme-xs: 0px 1px 2px 0px rgba(16, 24, 40, 0.05)
--shadow-theme-sm: 0px 1px 3px 0px rgba(16, 24, 40, 0.1)
--shadow-theme-md: 0px 4px 8px -2px rgba(16, 24, 40, 0.1)
--shadow-theme-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08)
```

---

## 🎯 Utilisation du thème

### Dans vos composants

```tsx
// Utilisez les couleurs sémantiques
className="bg-background text-foreground"
className="bg-card text-card-foreground"
className="bg-primary text-primary-foreground"
className="bg-destructive text-destructive-foreground"

// Ou les couleurs personnalisées
className="bg-brand-500 text-white"
className="bg-success-50 text-success-700"
className="bg-error-50 text-error-700"
className="bg-warning-50 text-warning-700"

// Bordures et inputs
className="border-border"
className="ring-ring"
```

### Exemples concrets

**Card avec succès**
```tsx
<div className="rounded-lg border border-success-200 bg-success-50 p-4">
  <p className="text-success-700">Opération réussie</p>
</div>
```

**Badge d'erreur**
```tsx
<span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-medium text-error-700">
  Erreur
</span>
```

**Input avec focus brand**
```tsx
<input
  className="rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
/>
```

---

## 📱 Responsive Design

Breakpoints configurés:
```css
--breakpoint-sm: 640px    /* Téléphones en paysage */
--breakpoint-md: 768px    /* Tablettes */
--breakpoint-lg: 1024px   /* Ordinateurs portables */
--breakpoint-xl: 1280px   /* Écrans larges */
--breakpoint-2xl: 1536px  /* Très grands écrans */
```

---

## ♿ Accessibilité

Le thème est conçu pour être accessible:

✅ **Contraste des couleurs**
- Tous les textes respectent WCAG AA (minimum 4.5:1)
- Les éléments interactifs ont un contraste de 3:1

✅ **États de focus**
- Ring visible sur tous les éléments interactifs
- Couleur brand pour les focus states

✅ **États de désactivation**
- Opacité réduite (50%)
- Curseur "not-allowed"

✅ **Tailles tactiles**
- Minimum 44x44px pour les boutons
- Espacement suffisant entre éléments cliquables

---

## 🚀 Prochaines étapes

### Composants à créer
- [ ] Card
- [ ] Input
- [ ] Select
- [ ] Badge
- [ ] Alert
- [ ] Dialog
- [ ] Dropdown Menu
- [ ] Tabs
- [ ] Table
- [ ] Pagination
- [ ] Breadcrumb
- [ ] Tooltip
- [ ] Toast

### Layouts à créer
- [ ] Dashboard Layout avec sidebar
- [ ] Auth Layout centré
- [ ] Page Layout avec header

---

## 📚 Ressources

### Documentation
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Inter Font](https://rsms.me/inter/)

### Outils
- [Color Palette Generator](https://uicolors.app/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Typography Scale](https://typescale.com/)

---

## ✅ Checklist de configuration

- [x] Police Inter configurée
- [x] Palette de couleurs personnalisée intégrée
- [x] Mode clair/sombre fonctionnel
- [x] Composant Button amélioré
- [x] Variables CSS définies
- [x] Scrollbar personnalisée
- [x] Focus states configurés
- [ ] Tous les composants UI créés
- [ ] Layouts créés
- [ ] Pages migrées

---

**Le thème Loura est maintenant prêt pour le développement !** 🎉
