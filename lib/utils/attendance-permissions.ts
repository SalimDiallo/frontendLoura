/**
 * Utilitaires pour la gestion des permissions de pointage (attendance)
 */

import type { UserPermissionContext } from '@/lib/types/shared';

/**
 * Permissions d'attendance
 */
export const ATTENDANCE_PERMISSIONS = {
  VIEW: 'attendance.view', // Voir ses propres pointages
  VIEW_ALL: 'attendance.view_all', // Voir tous les pointages
  CREATE: 'attendance.create', // Créer un pointage
  UPDATE: 'attendance.update', // Modifier un pointage
  DELETE: 'attendance.delete', // Supprimer un pointage
  APPROVE: 'attendance.approve', // Approuver les pointages
  MANUAL_CHECKIN: 'attendance.manual_checkin', // Pointer manuellement pour d'autres
  CREATE_QR_SESSION: 'attendance.create_qr_session', // Créer des sessions QR
} as const;

/**
 * Vérifie si l'utilisateur peut voir tous les pointages
 */
export function canViewAllAttendance(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.VIEW_ALL);
}

/**
 * Vérifie si l'utilisateur peut approuver les pointages
 */
export function canApproveAttendance(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.APPROVE);
}

/**
 * Vérifie si l'utilisateur peut créer des sessions QR
 */
export function canCreateQRSession(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.CREATE_QR_SESSION);
}

/**
 * Vérifie si l'utilisateur peut faire un pointage manuel pour d'autres employés
 */
export function canManualCheckin(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.MANUAL_CHECKIN);
}

/**
 * Vérifie si l'utilisateur peut modifier les pointages
 */
export function canUpdateAttendance(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.UPDATE);
}

/**
 * Vérifie si l'utilisateur peut supprimer les pointages
 */
export function canDeleteAttendance(permissionCodes: string[]): boolean {
  return permissionCodes.includes(ATTENDANCE_PERMISSIONS.DELETE);
}

/**
 * Détermine quels pointages l'utilisateur peut voir
 * @returns 'all' | 'own' | 'none'
 */
export function getAttendanceViewScope(context: UserPermissionContext | null): 'all' | 'own' | 'none' {
  if (!context) return 'none';

  // Admins et superusers peuvent tout voir
  if (context.isAdmin || context.isSuperuser) {
    return 'all';
  }

  // Permission VIEW_ALL permet de voir tous les pointages
  if (canViewAllAttendance(context.permissionCodes)) {
    return 'all';
  }

  // Permission VIEW permet de voir ses propres pointages
  if (context.permissionCodes.includes(ATTENDANCE_PERMISSIONS.VIEW)) {
    return 'own';
  }

  return 'none';
}

/**
 * Vérifie si l'utilisateur peut voir un pointage spécifique
 */
export function canViewAttendance(
  context: UserPermissionContext | null,
  attendanceEmployeeId?: string
): boolean {
  if (!context) return false;

  const scope = getAttendanceViewScope(context);

  // Peut tout voir
  if (scope === 'all') return true;

  // Peut voir seulement ses propres pointages
  if (scope === 'own') {
    // Si pas d'ID fourni, autoriser (pour la liste générale)
    if (!attendanceEmployeeId) return true;
    // Vérifier que c'est bien son pointage
    return attendanceEmployeeId === context.userId;
  }

  return false;
}

/**
 * Détermine les fonctionnalités disponibles pour l'utilisateur
 */
export interface AttendanceFeatures {
  canViewOwn: boolean;
  canViewAll: boolean;
  canScan: boolean;
  canCreateQR: boolean;
  canApprove: boolean;
  canManualCheckin: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function getAttendanceFeatures(context: UserPermissionContext | null): AttendanceFeatures {
  if (!context) {
    return {
      canViewOwn: false,
      canViewAll: false,
      canScan: false,
      canCreateQR: false,
      canApprove: false,
      canManualCheckin: false,
      canUpdate: false,
      canDelete: false,
    };
  }

  const scope = getAttendanceViewScope(context);

  return {
    canViewOwn: scope === 'own' || scope === 'all',
    canViewAll: scope === 'all',
    canScan: context.permissionCodes.includes(ATTENDANCE_PERMISSIONS.VIEW), // Tout employé avec VIEW peut scanner
    canCreateQR: canCreateQRSession(context.permissionCodes) || context.isAdmin || false,
    canApprove: canApproveAttendance(context.permissionCodes) || context.isAdmin || false,
    canManualCheckin: canManualCheckin(context.permissionCodes) || context.isAdmin || false,
    canUpdate: canUpdateAttendance(context.permissionCodes) || context.isAdmin || false,
    canDelete: canDeleteAttendance(context.permissionCodes) || context.isAdmin || false,
  };
}
