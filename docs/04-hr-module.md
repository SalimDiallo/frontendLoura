# Module HR (Ressources Humaines)

## Vue d'ensemble

Le module **HR** est un système complet de gestion des ressources humaines. Il couvre l'ensemble du cycle de vie des employés, de l'embauche à la gestion de la paie, en passant par les congés et les pointages.

### Fonctionnalités principales

- **Employés** : CRUD complet, profils détaillés
- **Départements et Postes** : Structure organisationnelle
- **Contrats** : Gestion des contrats de travail
- **Congés** : Demandes, approbations, soldes
- **Paie** : Périodes, fiches de paie, avances
- **Pointages** : Check-in/out, QR Code, statistiques
- **Rôles et Permissions** : RBAC granulaire
- **Calendrier** : Événements RH
- **Statistiques** : Vue d'ensemble et rapports

---

## Structure

```
├── app/apps/(org)/[slug]/hr/
│   ├── employees/             # Gestion des employés
│   │   ├── page.tsx           # Liste
│   │   ├── create/page.tsx    # Création
│   │   └── [id]/
│   │       ├── page.tsx       # Détail
│   │       └── edit/page.tsx  # Modification
│   ├── departments/           # Départements
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── contracts/             # Contrats
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── leaves/                # Congés
│   │   ├── page.tsx           # Liste demandes
│   │   ├── create/page.tsx    # Nouvelle demande
│   │   ├── balances/page.tsx  # Soldes
│   │   ├── calendar/page.tsx  # Calendrier
│   │   ├── history/page.tsx   # Historique
│   │   ├── stats/page.tsx     # Statistiques
│   │   └── leave-types/page.tsx  # Types de congés
│   ├── payroll/               # Paie
│   │   ├── page.tsx           # Fiches de paie
│   │   ├── periods/page.tsx   # Périodes
│   │   ├── history/page.tsx   # Historique
│   │   ├── generate/page.tsx  # Génération
│   │   ├── advances/page.tsx  # Avances
│   │   └── quick/page.tsx     # Saisie rapide
│   ├── attendance/            # Pointages
│   │   ├── page.tsx           # Historique
│   │   ├── all/page.tsx       # Tous les pointages
│   │   ├── qr-display/page.tsx  # Affichage QR
│   │   └── qr-scan/page.tsx     # Scanner QR
│   └── roles/                 # Rôles et permissions
│       └── page.tsx
│
├── components/hr/
│   ├── employee/              # Composants employés
│   │   ├── employee-card.tsx
│   │   ├── EmployeesTable.tsx
│   │   ├── EmployeesHeader.tsx
│   │   ├── EmployeesStatsCards.tsx
│   │   └── sections/          # Sections du profil
│   ├── departement/           # Composants départements
│   │   ├── DepartementsTable.tsx
│   │   ├── PositionTable.tsx
│   │   └── forms/
│   ├── contracts/             # Composants contrats
│   │   ├── ContractsTable.tsx
│   │   ├── contract-form.tsx
│   │   └── forms/
│   └── payrolls/              # Composants paie
│       ├── payroll-advances-summary.tsx
│       └── quick-actions-panel.tsx
│
└── lib/
    ├── services/hr/           # Services HR
    │   ├── employee.service.ts
    │   ├── department.service.ts
    │   ├── position.service.ts
    │   ├── contract.service.ts
    │   ├── leave.service.ts
    │   ├── leave-balance.service.ts
    │   ├── leave-type.service.ts
    │   ├── payroll.service.ts
    │   ├── payroll-period.service.ts
    │   ├── payroll-advance.service.ts
    │   ├── attendance.service.ts
    │   ├── qr-attendance.service.ts
    │   ├── role.service.ts
    │   ├── permission.service.ts
    │   ├── calendar.service.ts
    │   ├── stats.service.ts
    │   └── index.ts
    └── types/hr/              # Types HR
        ├── employee.types.ts
        ├── department.types.ts
        ├── contract.types.ts
        ├── leave.types.ts
        ├── payroll.types.ts
        ├── attendance.types.ts
        ├── role.types.ts
        └── index.ts
```

---

## Employés

### Fonctionnalités

- CRUD complet (créer, lire, modifier, supprimer)
- Profils détaillés (informations personnelles, contrat, paie)
- Filtres et recherche
- Activation/désactivation
- Export de données
- Historique des modifications

### Endpoints

```typescript
EMPLOYEES: {
  LIST: '/hr/employees/',
  CREATE: '/hr/employees/',
  DETAIL: (id: string) => `/hr/employees/${id}/`,
  UPDATE: (id: string) => `/hr/employees/${id}/`,
  DELETE: (id: string) => `/hr/employees/${id}/`,
  ACTIVATE: (id: string) => `/hr/employees/${id}/activate/`,
  DEACTIVATE: (id: string) => `/hr/employees/${id}/deactivate/`,
}
```

### Service d'employés

`lib/services/hr/employee.service.ts`

```typescript
/**
 * Liste tous les employés d'une organisation
 */
export async function getEmployees(
  organizationSlug: string,
  params?: {
    search?: string;
    department?: string;
    role?: string;
    employment_status?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }
): Promise<EmployeeListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('organization_subdomain', organizationSlug);

  if (params?.search) searchParams.append('search', params.search);
  if (params?.department) searchParams.append('department', params.department);
  // ... autres paramètres

  const url = `${API_ENDPOINTS.HR.EMPLOYEES.LIST}?${searchParams.toString()}`;
  return await cacheManager.get<EmployeeListResponse>(url, { ttl: 5 * 60 * 1000 });
}

/**
 * Créer un nouvel employé
 */
export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return cacheManager.post<Employee>(
    API_ENDPOINTS.HR.EMPLOYEES.CREATE,
    data,
    {
      invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST],
    }
  );
}

/**
 * Activer un employé
 */
export async function activateEmployee(id: string): Promise<Employee> {
  return cacheManager.post<Employee>(
    API_ENDPOINTS.HR.EMPLOYEES.ACTIVATE(id),
    undefined,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.EMPLOYEES.LIST,
        API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id),
      ],
    }
  );
}
```

### Types d'employés

`lib/types/hr/employee.types.ts`

```typescript
export interface Employee {
  id: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };

  // Informations personnelles
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'Other';
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;

  // Emploi
  employee_id: string;
  hire_date: string;
  employment_status: 'permanent' | 'contract' | 'intern' | 'part_time';
  is_active: boolean;

  // Organisation
  department?: Department;
  position?: Position;
  role?: Role;

  // Rémunération
  salary?: number;
  bank_account?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  // User
  email: string;
  first_name: string;
  last_name: string;
  password?: string;

  // Informations personnelles
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'Other';
  phone?: string;
  address?: string;

  // Emploi
  hire_date: string;
  employment_status: 'permanent' | 'contract' | 'intern' | 'part_time';
  department_id?: string;
  position_id?: string;
  role_id?: string;

  // Rémunération
  salary?: number;
  bank_account?: string;
}

export interface EmployeeListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Employee[];
}
```

---

## Départements et Postes

### Départements

Structure organisationnelle de l'entreprise.

#### Endpoints

```typescript
DEPARTMENTS: {
  LIST: '/hr/departments/',
  CREATE: '/hr/departments/',
  DETAIL: (id: string) => `/hr/departments/${id}/`,
  UPDATE: (id: string) => `/hr/departments/${id}/`,
  DELETE: (id: string) => `/hr/departments/${id}/`,
  ACTIVATE: (id: string) => `/hr/departments/${id}/activate/`,
  DEACTIVATE: (id: string) => `/hr/departments/${id}/deactivate/`,
}
```

### Postes/Positions

Postes occupés par les employés au sein des départements.

#### Endpoints

```typescript
POSITIONS: {
  LIST: '/hr/positions/',
  CREATE: '/hr/positions/',
  DETAIL: (id: string) => `/hr/positions/${id}/`,
  UPDATE: (id: string) => `/hr/positions/${id}/`,
  DELETE: (id: string) => `/hr/positions/${id}/`,
}
```

---

## Contrats

### Fonctionnalités

- Gestion des contrats de travail
- Types de contrats (CDI, CDD, Stage, etc.)
- Dates de début/fin
- Salaire et conditions
- Documents associés
- Export PDF

### Endpoints

```typescript
CONTRACTS: {
  LIST: '/hr/contracts/',
  CREATE: '/hr/contracts/',
  DETAIL: (id: string) => `/hr/contracts/${id}/`,
  UPDATE: (id: string) => `/hr/contracts/${id}/`,
  DELETE: (id: string) => `/hr/contracts/${id}/`,
  EXPORT_PDF: (id: string) => `/hr/contracts/${id}/export-pdf/`,
}
```

### Types de contrats

```typescript
export interface Contract {
  id: string;
  employee: Employee;
  contract_type: 'CDI' | 'CDD' | 'Stage' | 'Interim' | 'Apprentissage';
  start_date: string;
  end_date?: string;
  salary: number;
  working_hours: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Congés

### Fonctionnalités

- **Demandes de congés** : Création, approbation, rejet
- **Types de congés** : Payés, maladie, sans solde, etc.
- **Soldes** : Gestion automatique des soldes
- **Calendrier** : Vue calendrier des congés
- **Historique** : Historique personnel et global
- **Statistiques** : Analytics des congés

### Endpoints

```typescript
LEAVE_TYPES: {
  LIST: '/hr/leave-types/',
  CREATE: '/hr/leave-types/',
  DETAIL: (id: string) => `/hr/leave-types/${id}/`,
  UPDATE: (id: string) => `/hr/leave-types/${id}/`,
  DELETE: (id: string) => `/hr/leave-types/${id}/`,
},

LEAVE_REQUESTS: {
  LIST: '/hr/leave-requests/',
  CREATE: '/hr/leave-requests/',
  HISTORY: '/hr/leave-requests/history',
  MY_BALANCES: '/hr/leave-requests/my-balances/',
  DETAIL: (id: string) => `/hr/leave-requests/${id}/`,
  UPDATE: (id: string) => `/hr/leave-requests/${id}/`,
  DELETE: (id: string) => `/hr/leave-requests/${id}/`,
  APPROVE: (id: string) => `/hr/leave-requests/${id}/approve/`,
  REJECT: (id: string) => `/hr/leave-requests/${id}/reject/`,
  EXPORT_PDF: (id: string) => `/hr/leave-requests/${id}/export-pdf/`,
},

LEAVE_BALANCES: {
  LIST: '/hr/leave-balances/',
  CREATE: '/hr/leave-balances/',
  DETAIL: (id: string) => `/hr/leave-balances/${id}/`,
  UPDATE: (id: string) => `/hr/leave-balances/${id}/`,
  DELETE: (id: string) => `/hr/leave-balances/${id}/`,
  INITIALIZE: '/hr/leave-balances/initialize/',
}
```

### Workflow de demande de congé

```
Employee → Créer demande (status: pending)
  ↓
Manager/RH → Approuver ou Rejeter
  ↓
Si approuvé → status: approved, déduction du solde
Si rejeté → status: rejected, pas de déduction
```

### Service de congés

`lib/services/hr/leave.service.ts`

```typescript
/**
 * Créer une demande de congé
 */
export async function createLeaveRequest(
  data: LeaveRequestCreate
): Promise<LeaveRequest> {
  return cacheManager.post<LeaveRequest>(
    API_ENDPOINTS.HR.LEAVE_REQUESTS.CREATE,
    data,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST,
        API_ENDPOINTS.HR.LEAVE_BALANCES.LIST,
      ],
    }
  );
}

/**
 * Approuver une demande
 */
export async function approveLeaveRequest(
  id: string
): Promise<LeaveRequest> {
  return cacheManager.post<LeaveRequest>(
    API_ENDPOINTS.HR.LEAVE_REQUESTS.APPROVE(id),
    undefined,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST,
        API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id),
        API_ENDPOINTS.HR.LEAVE_BALANCES.LIST,
      ],
    }
  );
}

/**
 * Récupérer les soldes de l'employé connecté
 */
export async function getMyBalances(): Promise<LeaveBalance[]> {
  return cacheManager.get<LeaveBalance[]>(
    API_ENDPOINTS.HR.LEAVE_REQUESTS.MY_BALANCES,
    { ttl: 2 * 60 * 1000 }
  );
}
```

### Types de congés

```typescript
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  is_paid: boolean;
  requires_approval: boolean;
  max_days_per_year?: number;
  color?: string;
  is_active: boolean;
}

export interface LeaveRequest {
  id: string;
  employee: Employee;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: User;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee: Employee;
  leave_type: LeaveType;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
}
```

---

## Paie

### Fonctionnalités

- **Périodes de paie** : Mensuel, bi-mensuel, etc.
- **Fiches de paie** : Génération et gestion
- **Avances** : Demandes et approbations d'avances
- **Historique** : Historique personnel et global
- **Génération en masse** : Génération pour toute une période
- **Export PDF** : Fiches de paie en PDF

### Endpoints

```typescript
PAYROLL_PERIODS: {
  LIST: '/hr/payroll-periods/',
  CREATE: '/hr/payroll-periods/',
  DETAIL: (id: string) => `/hr/payroll-periods/${id}/`,
  UPDATE: (id: string) => `/hr/payroll-periods/${id}/`,
  DELETE: (id: string) => `/hr/payroll-periods/${id}/`,
},

PAYSLIPS: {
  LIST: '/hr/payslips/',
  CREATE: '/hr/payslips/',
  HISTORY: '/hr/payslips/history/',
  DETAIL: (id: string) => `/hr/payslips/${id}/`,
  UPDATE: (id: string) => `/hr/payslips/${id}/`,
  DELETE: (id: string) => `/hr/payslips/${id}/`,
  MARK_PAID: (id: string) => `/hr/payslips/${id}/mark_as_paid/`,
  GENERATE_BULK: '/hr/payslips/generate_for_period/',
},

PAYROLL_ADVANCES: {
  LIST: '/hr/payroll-advances/',
  CREATE: '/hr/payroll-advances/',
  HISTORY: '/hr/payroll-advances/history/',
  DETAIL: (id: string) => `/hr/payroll-advances/${id}/`,
  UPDATE: (id: string) => `/hr/payroll-advances/${id}/`,
  DELETE: (id: string) => `/hr/payroll-advances/${id}/`,
  APPROVE: (id: string) => `/hr/payroll-advances/${id}/approve/`,
  REJECT: (id: string) => `/hr/payroll-advances/${id}/reject/`,
}
```

### Service de paie

`lib/services/hr/payroll.service.ts`

```typescript
/**
 * Générer les fiches de paie pour une période
 */
export async function generatePayslipsForPeriod(
  periodId: string
): Promise<{ message: string; payslips: Payslip[] }> {
  return cacheManager.post(
    API_ENDPOINTS.HR.PAYSLIPS.GENERATE_BULK,
    { period_id: periodId },
    {
      invalidateCache: [API_ENDPOINTS.HR.PAYSLIPS.LIST],
    }
  );
}

/**
 * Marquer une fiche de paie comme payée
 */
export async function markPayslipAsPaid(id: string): Promise<Payslip> {
  return cacheManager.post<Payslip>(
    API_ENDPOINTS.HR.PAYSLIPS.MARK_PAID(id),
    undefined,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.PAYSLIPS.LIST,
        API_ENDPOINTS.HR.PAYSLIPS.DETAIL(id),
      ],
    }
  );
}

/**
 * Approuver une avance
 */
export async function approveAdvance(id: string): Promise<PayrollAdvance> {
  return cacheManager.post<PayrollAdvance>(
    API_ENDPOINTS.HR.PAYROLL_ADVANCES.APPROVE(id),
    undefined,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.PAYROLL_ADVANCES.LIST,
        API_ENDPOINTS.HR.PAYROLL_ADVANCES.DETAIL(id),
      ],
    }
  );
}
```

### Types de paie

```typescript
export interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  is_closed: boolean;
  created_at: string;
}

export interface Payslip {
  id: string;
  employee: Employee;
  period: PayrollPeriod;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  bonuses: number;
  advances_deducted: number;
  is_paid: boolean;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

export interface PayrollAdvance {
  id: string;
  employee: Employee;
  amount: number;
  request_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deducted';
  approved_by?: User;
  approved_at?: string;
  deduction_date?: string;
}
```

---

## Pointages (Attendance)

### Fonctionnalités

- **Check-in/Check-out** : Pointage d'entrée/sortie
- **Pauses** : Gestion des pauses
- **QR Code** : Pointage via QR Code
- **Sessions QR** : Sessions temporaires pour pointage collectif
- **Historique** : Historique des pointages
- **Statistiques** : Analytics des présences
- **Approbation** : Validation des pointages

### Endpoints

```typescript
ATTENDANCES: {
  LIST: '/hr/attendances/',
  CREATE: '/hr/attendances/',
  DETAIL: (id: string) => `/hr/attendances/${id}/`,
  UPDATE: (id: string) => `/hr/attendances/${id}/`,
  DELETE: (id: string) => `/hr/attendances/${id}/`,
  CHECK_IN: '/hr/attendances/check-in/',
  CHECK_OUT: '/hr/attendances/check-out/',
  TODAY: '/hr/attendances/today/',
  START_BREAK: '/hr/attendances/start-break/',
  END_BREAK: '/hr/attendances/end-break/',
  APPROVE: (id: string) => `/hr/attendances/${id}/approve/`,
  STATS: '/hr/attendances/stats/',
  // QR Code endpoints
  QR_SESSION_CREATE: '/hr/attendances/qr-session/create/',
  QR_SESSION_DETAIL: (sessionId: string) => `/hr/attendances/qr-session/${sessionId}/`,
  QR_CHECK_IN: '/hr/attendances/qr-check-in/',
}
```

### Workflow de pointage

#### Pointage classique

```
Employee → Check-in
  ↓
Work...
  ↓
Employee → Start break (optionnel)
  ↓
Break...
  ↓
Employee → End break (optionnel)
  ↓
Work...
  ↓
Employee → Check-out
```

#### Pointage QR Code

```
Manager → Créer session QR (page /hr/attendance/qr-display)
  ↓
Affichage QR Code sur écran
  ↓
Employee → Scanner QR (via /hr/attendance/qr-scan ou app mobile)
  ↓
Check-in automatique
```

### Service de pointage

`lib/services/hr/attendance.service.ts`

```typescript
/**
 * Check-in
 */
export async function checkIn(data: CheckInData): Promise<Attendance> {
  return cacheManager.post<Attendance>(
    API_ENDPOINTS.HR.ATTENDANCES.CHECK_IN,
    data,
    {
      invalidateCache: [
        API_ENDPOINTS.HR.ATTENDANCES.LIST,
        API_ENDPOINTS.HR.ATTENDANCES.TODAY,
      ],
    }
  );
}

/**
 * Check-out
 */
export async function checkOut(attendanceId: string): Promise<Attendance> {
  return cacheManager.post<Attendance>(
    API_ENDPOINTS.HR.ATTENDANCES.CHECK_OUT,
    { attendance_id: attendanceId },
    {
      invalidateCache: [
        API_ENDPOINTS.HR.ATTENDANCES.LIST,
        API_ENDPOINTS.HR.ATTENDANCES.TODAY,
      ],
    }
  );
}

/**
 * Créer une session QR
 */
export async function createQRSession(
  duration: number = 300
): Promise<QRSession> {
  return cacheManager.post<QRSession>(
    API_ENDPOINTS.HR.ATTENDANCES.QR_SESSION_CREATE,
    { duration_seconds: duration },
    {
      requiresOnline: true,  // Requiert connexion
    }
  );
}

/**
 * Check-in via QR Code
 */
export async function qrCheckIn(sessionId: string): Promise<Attendance> {
  return cacheManager.post<Attendance>(
    API_ENDPOINTS.HR.ATTENDANCES.QR_CHECK_IN,
    { session_id: sessionId },
    {
      invalidateCache: [API_ENDPOINTS.HR.ATTENDANCES.LIST],
    }
  );
}

/**
 * Récupérer le pointage du jour
 */
export async function getTodayAttendance(): Promise<Attendance | null> {
  return cacheManager.get<Attendance | null>(
    API_ENDPOINTS.HR.ATTENDANCES.TODAY,
    { ttl: 1 * 60 * 1000 }  // 1 minute
  );
}
```

### Types de pointage

```typescript
export interface Attendance {
  id: string;
  employee: Employee;
  check_in_time: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  total_hours?: number;
  break_hours?: number;
  notes?: string;
  status: 'present' | 'absent' | 'on_break' | 'checked_out';
  is_approved: boolean;
  approved_by?: User;
  created_at: string;
  updated_at: string;
}

export interface QRSession {
  id: string;
  session_id: string;
  expires_at: string;
  is_active: boolean;
  created_by: User;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  average_hours: number;
}
```

---

## Rôles et Permissions

### Fonctionnalités

- RBAC (Role-Based Access Control)
- Rôles personnalisés
- Permissions granulaires par module
- Héritage de permissions

### Endpoints

```typescript
ROLES: {
  LIST: '/hr/roles/',
  CREATE: '/hr/roles/',
  DETAIL: (id: string) => `/hr/roles/${id}/`,
  UPDATE: (id: string) => `/hr/roles/${id}/`,
  DELETE: (id: string) => `/hr/roles/${id}/`,
},

PERMISSIONS: {
  LIST: '/hr/permissions/',
  DETAIL: (id: string) => `/hr/permissions/${id}/`,
}
```

### Types de rôles

```typescript
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  is_active: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;  // Format: module.action_entity (ex: hr.view_employee)
  description?: string;
  module: string;
}
```

### Codes de permissions HR

```
hr.view_employee
hr.add_employee
hr.change_employee
hr.delete_employee
hr.view_department
hr.add_department
hr.change_department
hr.delete_department
hr.view_leaverequest
hr.add_leaverequest
hr.change_leaverequest
hr.delete_leaverequest
hr.approve_leaverequest
hr.view_payslip
hr.add_payslip
hr.change_payslip
hr.delete_payslip
hr.view_attendance
hr.add_attendance
hr.change_attendance
hr.delete_attendance
hr.approve_attendance
```

---

## Statistiques

### Endpoints

```typescript
STATS: {
  OVERVIEW: '/hr/stats/overview/',
  DEPARTMENTS: '/hr/stats/departments/',
  LEAVES: '/hr/stats/leaves/',
  PAYROLL: '/hr/stats/payroll/',
}
```

### Types de statistiques

```typescript
export interface HRStats {
  overview: {
    total_employees: number;
    active_employees: number;
    departments_count: number;
    pending_leaves: number;
  };
  departments: {
    name: string;
    employee_count: number;
    average_salary: number;
  }[];
  leaves: {
    total_requests: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  payroll: {
    total_payslips: number;
    total_paid: number;
    total_amount: number;
  };
}
```

---

## Permissions requises

### Employés

- Lecture : `hr.view_employee`
- Création : `hr.add_employee`
- Modification : `hr.change_employee`
- Suppression : `hr.delete_employee`

### Congés

- Lecture : `hr.view_leaverequest`
- Création : `hr.add_leaverequest` (son propre congé)
- Approbation : `hr.approve_leaverequest`

### Paie

- Lecture : `hr.view_payslip`
- Génération : `hr.add_payslip`
- Modification : `hr.change_payslip`

### Pointages

- Lecture : `hr.view_attendance`
- Check-in/out : `hr.add_attendance` (son propre pointage)
- Approbation : `hr.approve_attendance`

---

## Composants HR

### EmployeesTable

Table paginée avec filtres et recherche.

`components/hr/employee/EmployeesTable.tsx`

- Tri par colonne
- Filtres (département, rôle, statut)
- Actions (éditer, supprimer, activer/désactiver)
- Export CSV

### EmployeesStatsCards

Cartes de statistiques employés.

`components/hr/employee/EmployeesStatsCards.tsx`

- Total employés
- Employés actifs
- Nouveaux ce mois
- Taux de présence

### ContractForm

Formulaire de contrat avec validation.

`components/hr/contracts/contract-form.tsx`

- Validation Zod
- Sélection employé
- Dates début/fin
- Salaire et conditions

---

## Bonnes pratiques

### Employés

1. Toujours vérifier les permissions avant toute action
2. Utiliser les filtres pour optimiser les requêtes
3. Invalider le cache après mutations
4. Respecter le RGPD (données personnelles)

### Congés

1. Vérifier les soldes avant approbation
2. Mettre à jour les soldes automatiquement
3. Envoyer des notifications aux parties concernées
4. Archiver les anciennes demandes

### Paie

1. Bloquer les périodes clôturées
2. Calculer automatiquement les déductions
3. Générer les fiches en masse pour gagner du temps
4. Sauvegarder les PDFs générés

### Pointages

1. Valider les horaires (pas de check-out sans check-in)
2. Gérer les cas limites (oublis, corrections)
3. Utiliser le QR Code pour les pointages collectifs
4. Exporter régulièrement les données

---

## Références

- [Django HR Management](https://github.com/django-oscar/django-oscar)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [Payroll Calculation Guide](https://www.paychex.com/articles/payroll-taxes/how-to-calculate-payroll)
