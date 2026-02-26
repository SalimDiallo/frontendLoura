# Status Badge System - Guide d'utilisation

Système unifié de badges de statut pour tous les modules de l'application.

## 📦 Installation

```typescript
import {
  PayrollStatusBadge,
  LeaveStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  AttendanceStatusBadge,
  EmploymentStatusBadge
} from '@/components/common';
```

## 🎯 Utilisation de base

### Badges typés par module

```tsx
// HR - Payroll
<PayrollStatusBadge status="paid" showIcon />
<PayrollStatusBadge status="pending" />

// HR - Leaves
<LeaveStatusBadge status="approved" showIcon />
<LeaveStatusBadge status="rejected" />

// HR - Attendance
<AttendanceStatusBadge status="present" showIcon />
<AttendanceStatusBadge status="late" />

// Inventory - Orders
<OrderStatusBadge status="received" showIcon />
<OrderStatusBadge status="pending" />

// Inventory - Payments
<PaymentStatusBadge status="paid" showIcon />
<PaymentStatusBadge status="overdue" />
```

### Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `status` | `string` | **requis** | Le statut à afficher |
| `showIcon` | `boolean` | `false` | Afficher l'icône du statut |
| `className` | `string` | `undefined` | Classes CSS additionnelles |

## 🔧 Accès aux configurations

Si vous avez besoin d'accéder aux configurations (icônes, couleurs, labels) :

```tsx
import {
  LEAVE_STATUS_CONFIG,
  PAYROLL_STATUS_CONFIG,
  ORDER_STATUS_CONFIG
} from '@/components/common';

// Utilisation
const statusConfig = LEAVE_STATUS_CONFIG[leave.status];
const StatusIcon = statusConfig?.icon;
const label = statusConfig?.label;
const variant = statusConfig?.variant;
```

### Structure de StatusConfig

```typescript
interface StatusConfig {
  variant: 'default' | 'success' | 'warning' | 'error' | 'destructive' | 'secondary';
  label: string;
  icon?: LucideIcon;           // Icône Lucide
  bgClass?: string;            // Classe background personnalisée
  textClass?: string;          // Classe texte personnalisée
  iconColor?: string;          // Couleur de l'icône
}
```

## 📋 Configurations disponibles

### HR Module

#### PAYROLL_STATUS_CONFIG
Statuts: `draft`, `pending`, `paid`, `deducted`, `cancelled`, `processing`, `processing_payment`, `closed`, `finalized`

#### LEAVE_STATUS_CONFIG
Statuts: `pending`, `approved`, `rejected`, `cancelled`, `validated`

#### ATTENDANCE_STATUS_CONFIG
Statuts: `present`, `late`, `absent`, `half_day`, `on_leave`

#### EMPLOYMENT_STATUS_CONFIG
Statuts: `active`, `inactive`, `on_leave`, `terminated`

### Inventory Module

#### ORDER_STATUS_CONFIG
Statuts: `draft`, `pending`, `confirmed`, `received`, `cancelled`, `validated`, `deducted`, `in_progress`, `planned`

#### PAYMENT_STATUS_CONFIG
Statuts: `paid`, `partial`, `overdue`, `pending`, `cancelled`

## 🔄 Migration depuis l'ancien système

### Avant (BadgeStatus.tsx)

```tsx
import { getStatusBadgeNode } from '@/lib/utils/BadgeStatus';

// Usage
{getStatusBadgeNode(payroll.status)}
```

### Après (Nouveau système)

```tsx
import { PayrollStatusBadge } from '@/components/common';

// Usage
<PayrollStatusBadge status={payroll.status} showIcon />
```

### Cas spécial: Accès à l'icône séparée

#### Avant
```tsx
import { getLeaveStatusConfig } from '@/lib/utils/BadgeStatus';

const statusConfig = getLeaveStatusConfig(leave.status);
const StatusIcon = statusConfig.icon;
```

#### Après
```tsx
import { LEAVE_STATUS_CONFIG } from '@/components/common';

const statusConfig = LEAVE_STATUS_CONFIG[leave.status];
const StatusIcon = statusConfig?.icon;
```

## 🎨 Personnalisation avancée

### Badge avec icône externe

```tsx
import { PAYMENT_STATUS_CONFIG } from '@/components/common';

const config = PAYMENT_STATUS_CONFIG[payment.status];
const Icon = config?.icon;

return (
  <div className="flex items-center gap-2">
    {Icon && <Icon className="h-5 w-5 text-red-600" />}
    <Badge variant={config?.variant}>
      {config?.label}
    </Badge>
  </div>
);
```

### Utilisation du composant générique

```tsx
import { StatusBadge, ORDER_STATUS_CONFIG } from '@/components/common';

<StatusBadge
  status={order.status}
  config={ORDER_STATUS_CONFIG}
  showIcon
  iconSize="lg"
/>
```

Tailles d'icônes disponibles: `sm` (h-3 w-3), `md` (h-4 w-4), `lg` (h-5 w-5)

## 🛠️ Ajouter un nouveau type de statut

1. Ajouter la configuration dans `components/common/status-badge/index.tsx`:

```typescript
export const MY_MODULE_STATUS_CONFIG = {
  active: {
    variant: 'success' as const,
    label: 'Actif',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  // ... autres statuts
} satisfies Record<string, StatusConfig>;
```

2. Créer le composant wrapper:

```typescript
export function MyModuleStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof MY_MODULE_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={MY_MODULE_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}
```

3. Exporter dans le barrel export de `components/common/index.ts`

## ✅ Avantages du nouveau système

- ✨ **Type-safe**: TypeScript vérifie les statuts valides
- 🎯 **Centralisé**: Une seule source de vérité pour tous les badges
- 🔧 **Extensible**: Facile d'ajouter de nouveaux modules
- 🎨 **Cohérent**: Styles et icônes uniformes
- 📦 **Modular**: Import depuis `@/components/common`
- 🚀 **Performance**: Pas de duplication de code

## 🔗 Fichiers concernés

- **Ancien système (à supprimer):**
  - `lib/utils/BadgeStatus.tsx` (315 lignes)
  - `components/hr/status-badge.tsx` (91 lignes)

- **Nouveau système:**
  - `components/common/status-badge/index.tsx`
  - Exporté via `components/common/index.ts`

## 📚 Exemples complets

Voir les fichiers suivants pour des exemples d'utilisation :
- `app/apps/(org)/[slug]/hr/payroll/[id]/page.tsx`
- `app/apps/(org)/[slug]/hr/leaves/[id]/page.tsx`
