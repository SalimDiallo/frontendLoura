/**
 * EXEMPLE D'UTILISATION DU COMPOSANT CAN
 *
 * Ce fichier montre comment utiliser le composant Can avec Zustand
 * pour gérer les permissions dans vos composants React.
 */

'use client';

import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import Link from 'next/link';

// ============================================================================
// EXEMPLE 1: Menu dropdown avec permissions
// ============================================================================

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

export function EmployeeActionsDropdown({
  employee,
  slug,
}: {
  employee: Employee;
  slug: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* Visible uniquement si l'utilisateur a la permission de voir les employés */}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/employees/${employee.id}`}>
              <HiOutlineEye className="size-4 mr-2" />
              Voir le profil
            </Link>
          </DropdownMenuItem>
        </Can>

        {/* Visible uniquement si l'utilisateur a la permission de modifier */}
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/employees/${employee.id}/edit`}>
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Link>
          </DropdownMenuItem>
        </Can>

        {/* Visible uniquement si l'utilisateur a la permission de supprimer */}
        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <DropdownMenuItem className="text-red-600">
            <HiOutlineTrash className="size-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// EXEMPLE 2: Boutons avec permissions multiples (OR logic)
// ============================================================================

export function EmployeeManagementButtons() {
  return (
    <div className="flex gap-2">
      {/* Visible si l'utilisateur a AU MOINS UNE de ces permissions */}
      <Can
        anyPermissions={[
          COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
          COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES,
        ]}
      >
        <Button variant="outline">Gérer les employés</Button>
      </Can>

      {/* Visible uniquement pour les admins */}
      <Can adminOnly>
        <Button variant="destructive">Paramètres avancés</Button>
      </Can>
    </div>
  );
}

// ============================================================================
// EXEMPLE 3: Section avec toutes les permissions requises (AND logic)
// ============================================================================

export function PayrollManagement() {
  return (
    <div>
      <h2>Gestion de la paie</h2>

      {/* Visible seulement si TOUTES ces permissions sont présentes */}
      <Can
        allPermissions={[
          COMMON_PERMISSIONS.HR.VIEW_PAYROLL,
          COMMON_PERMISSIONS.HR.UPDATE_PAYROLL,
        ]}
      >
        <div className="border p-4 rounded-lg">
          <h3>Configuration de la paie</h3>
          <p>Vous pouvez consulter et modifier les informations de paie.</p>
          <Button>Configurer</Button>
        </div>
      </Can>
    </div>
  );
}

// ============================================================================
// EXEMPLE 4: Avec message d'accès refusé
// ============================================================================

export function RolesPage() {
  return (
    <div>
      <h1>Rôles et Permissions</h1>

      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
        <div>
          <p>Liste des rôles disponibles dans l'organisation...</p>
          {/* Contenu de la page */}
        </div>
      </Can>
    </div>
  );
}

// ============================================================================
// EXEMPLE 5: Avec fallback personnalisé
// ============================================================================

export function AttendanceSection() {
  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE}
      fallback={
        <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800">
            Vous n'avez pas accès aux données de présence.
            <br />
            Contactez votre responsable pour obtenir les permissions nécessaires.
          </p>
        </div>
      }
    >
      <div>
        <h2>Présence des employés</h2>
        {/* Tableau de présence */}
      </div>
    </Can>
  );
}

// ============================================================================
// EXEMPLE 6: Navigation avec permissions
// ============================================================================

export function HRNavigation({ slug }: { slug: string }) {
  return (
    <nav className="space-y-1">
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
        <Link
          href={`/apps/${slug}/hr/employees`}
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Employés
        </Link>
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
        <Link
          href={`/apps/${slug}/hr/departments`}
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Départements
        </Link>
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}>
        <Link
          href={`/apps/${slug}/hr/roles`}
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Rôles & Permissions
        </Link>
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE}>
        <Link
          href={`/apps/${slug}/hr/attendance`}
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Présence
        </Link>
      </Can>
    </nav>
  );
}

// ============================================================================
// EXEMPLE 7: Permissions complexes pour l'attendance
// ============================================================================

export function AttendanceManagement() {
  return (
    <div className="space-y-6">
      {/* Voir sa propre présence OU toutes les présences */}
      <Can
        anyPermissions={[
          COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE,
          COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE,
        ]}
      >
        <div className="border p-4 rounded">
          <h3>Historique de présence</h3>
          {/* Liste des présences */}
        </div>
      </Can>

      {/* Créer une session QR (nécessite création + permission QR) */}
      <Can
        allPermissions={[
          COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE,
          COMMON_PERMISSIONS.HR.CREATE_QR_SESSION,
        ]}
      >
        <Button>Créer une session QR</Button>
      </Can>

      {/* Check-in manuel (permission spécifique) */}
      <Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
        <div className="border border-blue-300 p-4 rounded">
          <h3>Check-in manuel</h3>
          <p>Enregistrer la présence d'un employé manuellement</p>
        </div>
      </Can>

      {/* Approbation (nécessite voir toutes + approuver) */}
      <Can
        allPermissions={[
          COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE,
          COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE,
        ]}
      >
        <div className="border border-green-300 p-4 rounded">
          <h3>Approbations en attente</h3>
          {/* Liste des présences à approuver */}
        </div>
      </Can>
    </div>
  );
}

// ============================================================================
// EXEMPLE 8: Formulaire avec permissions granulaires
// ============================================================================

export function EmployeeForm({ employee }: { employee?: Employee }) {
  return (
    <form className="space-y-4">
      {/* Champs basiques - visible pour UPDATE */}
      <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
        <div>
          <label>Nom complet</label>
          <input
            type="text"
            defaultValue={employee?.full_name}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
      </Can>

      {/* Salaire - permission spéciale */}
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE_COMPENSATION}>
        <div>
          <label>Salaire</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
      </Can>

      {/* Permissions personnalisées - admin seulement */}
      <Can permission={COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS}>
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Permissions personnalisées</h3>
          {/* Sélecteur de permissions */}
        </div>
      </Can>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <Button type="submit">Enregistrer</Button>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <Button variant="destructive" type="button">
            Supprimer
          </Button>
        </Can>
      </div>
    </form>
  );
}

// ============================================================================
// UTILISATION DANS VOS COMPOSANTS
// ============================================================================

/**
 * Pour utiliser ces exemples dans vos propres composants:
 *
 * 1. Importez le composant Can et les permissions:
 *    import { Can } from '@/components/apps/common';
 *    import { COMMON_PERMISSIONS } from '@/lib/types/shared';
 *
 * 2. Assurez-vous que le PermissionProvider est dans votre layout:
 *    // app/apps/(org)/[slug]/layout.tsx
 *    <PermissionProvider>{children}</PermissionProvider>
 *
 * 3. Utilisez le composant Can dans vos composants:
 *    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
 *      <YourComponent />
 *    </Can>
 *
 * 4. Les permissions sont automatiquement gérées par Zustand!
 *    - Login met à jour le store
 *    - Le PermissionProvider lit depuis le store
 *    - Le composant Can vérifie les permissions
 *
 * AUCUNE CONFIGURATION SUPPLÉMENTAIRE N'EST NÉCESSAIRE!
 */
