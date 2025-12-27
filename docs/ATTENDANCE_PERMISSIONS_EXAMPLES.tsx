/**
 * Exemples d'utilisation des permissions d'attendance
 *
 * Ce fichier contient des exemples pratiques pour utiliser les permissions
 * d'attendance avec le composant Can.
 */

import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { Button } from '@/components/ui';
import Link from 'next/link';
import {
  HiOutlineCheckCircle,
  HiOutlineQrCode,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';

// ============================================
// Exemple 1: Bouton de validation des pointages
// ============================================
export function ApprovalButton({ slug }: { slug: string }) {
  return (
    <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
      <Button asChild variant="default">
        <Link href={`/apps/${slug}/hr/attendance/approvals`}>
          <HiOutlineCheckCircle className="size-4 mr-2" />
          Valider les Pointages
        </Link>
      </Button>
    </Can>
  );
}

// ============================================
// Exemple 2: Section de pointage manuel (Admin)
// ============================================
export function ManualCheckInSection({ onCheckIn, onCheckOut }: {
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  return (
    <Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Arrivée (Manuel)</h3>
          <Button onClick={onCheckIn} className="w-full">
            <HiOutlineArrowRightOnRectangle className="size-4 mr-2" />
            Pointer l'arrivée
          </Button>
        </div>

        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Départ (Manuel)</h3>
          <Button onClick={onCheckOut} className="w-full">
            Pointer le départ
          </Button>
        </div>
      </div>
    </Can>
  );
}

// ============================================
// Exemple 3: Bouton de génération QR Code
// ============================================
export function QRCodeButton({ slug }: { slug: string }) {
  return (
    <Can anyPermissions={[
      COMMON_PERMISSIONS.HR.CREATE_QR_SESSION,
      COMMON_PERMISSIONS.HR.MANUAL_CHECKIN
    ]}>
      <Button asChild variant="secondary" size="lg">
        <Link href={`/apps/${slug}/hr/attendance/qr-display`}>
          <HiOutlineQrCode className="size-5 mr-2" />
          Générer QR
        </Link>
      </Button>
    </Can>
  );
}

// ============================================
// Exemple 4: Actions dans un tableau d'attendance
// ============================================
export function AttendanceTableActions({
  attendanceId,
  onEdit,
  onDelete
}: {
  attendanceId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 justify-end">
      <Can permission={COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(attendanceId)}
        >
          Modifier
        </Button>
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE}>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(attendanceId)}
        >
          Supprimer
        </Button>
      </Can>
    </div>
  );
}

// ============================================
// Exemple 5: Page protégée avec message d'erreur
// ============================================
export function AttendanceApprovalsPage() {
  return (
    <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE} showMessage={true}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Validation des Pointages</h1>
        <p className="text-muted-foreground">
          Approuvez ou rejetez les pointages des employés
        </p>
        {/* Contenu de la page */}
      </div>
    </Can>
  );
}

// ============================================
// Exemple 6: Voir tous les pointages (Manager)
// ============================================
export function AllAttendanceView({ attendances }: { attendances: any[] }) {
  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}
      fallback={
        <p className="text-muted-foreground">
          Vous ne pouvez voir que vos propres pointages
        </p>
      }
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tous les pointages</h2>
        {/* Table avec tous les pointages */}
      </div>
    </Can>
  );
}

// ============================================
// Exemple 7: Combinaison de permissions (AND logic)
// ============================================
export function EditAttendanceForm({ attendanceId }: { attendanceId: string }) {
  return (
    <Can allPermissions={[
      COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE,
      COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE
    ]}>
      <form>
        <h3>Modifier le pointage</h3>
        {/* Formulaire d'édition */}
      </form>
    </Can>
  );
}

// ============================================
// Exemple 8: Format backend (rétrocompatibilité)
// ============================================
export function LegacyPermissionExample() {
  return (
    <>
      {/* Ces deux approches sont équivalentes */}

      {/* Approche 1: Format backend (ancien) */}
      <Can permission="can_approve_attendance">
        <Button>Approuver (Format backend)</Button>
      </Can>

      {/* Approche 2: Format frontend avec constantes (recommandé) */}
      <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
        <Button>Approuver (Format frontend)</Button>
      </Can>
    </>
  );
}

// ============================================
// Exemple 9: Admin seulement
// ============================================
export function AdminOnlySection() {
  return (
    <Can adminOnly>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-900">Section Admin</h3>
        <p className="text-yellow-800">
          Seuls les administrateurs peuvent voir cette section
        </p>
      </div>
    </Can>
  );
}

// ============================================
// Exemple 10: Permissions multiples avec fallback
// ============================================
export function CreateAttendanceButton({ slug }: { slug: string }) {
  return (
    <Can
      anyPermissions={[
        COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE,
        COMMON_PERMISSIONS.HR.MANUAL_CHECKIN
      ]}
      fallback={
        <Button disabled variant="outline">
          Créer un pointage (Non autorisé)
        </Button>
      }
    >
      <Button asChild>
        <Link href={`/apps/${slug}/hr/attendance/create`}>
          Créer un pointage
        </Link>
      </Button>
    </Can>
  );
}

// ============================================
// Exemple 11: Navigation conditionnelle
// ============================================
export function AttendanceNavigation({ slug }: { slug: string }) {
  return (
    <nav className="flex gap-4">
      {/* Lien visible par tous */}
      <Link href={`/apps/${slug}/hr/attendance`}>
        Mes pointages
      </Link>

      {/* Lien visible seulement pour ceux qui peuvent voir tous les pointages */}
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}>
        <Link href={`/apps/${slug}/hr/attendance/all`}>
          Tous les pointages
        </Link>
      </Can>

      {/* Lien visible seulement pour ceux qui peuvent approuver */}
      <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
        <Link href={`/apps/${slug}/hr/attendance/approvals`}>
          Approbations
        </Link>
      </Can>
    </nav>
  );
}

// ============================================
// Exemple 12: Dropdown menu conditionnel
// ============================================
export function AttendanceDropdownMenu({ attendanceId }: { attendanceId: string }) {
  return (
    <div className="dropdown">
      <button>Actions</button>
      <div className="dropdown-content">
        {/* Toujours visible */}
        <button>Voir les détails</button>

        {/* Visible seulement si peut modifier */}
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE}>
          <button>Modifier</button>
        </Can>

        {/* Visible seulement si peut approuver */}
        <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
          <button>Approuver</button>
          <button>Rejeter</button>
        </Can>

        {/* Visible seulement si peut supprimer */}
        <Can permission={COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE}>
          <button className="text-red-600">Supprimer</button>
        </Can>
      </div>
    </div>
  );
}
