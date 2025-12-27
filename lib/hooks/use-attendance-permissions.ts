/**
 * Hook pour gérer les permissions de pointage (attendance)
 */

import { useMemo } from 'react';
import { usePermissionContext } from '@/components/apps/common/permission-provider';
import {
  getAttendanceFeatures,
  getAttendanceViewScope,
  canViewAttendance,
  type AttendanceFeatures,
} from '@/lib/utils/attendance-permissions';

export function useAttendancePermissions() {
  const { permissionContext, can, cannot, hasPermission, isLoading } = usePermissionContext();

  // Calculer les fonctionnalités disponibles
  const features: AttendanceFeatures = useMemo(
    () => getAttendanceFeatures(permissionContext),
    [permissionContext]
  );

  // Scope de visualisation
  const viewScope = useMemo(
    () => getAttendanceViewScope(permissionContext),
    [permissionContext]
  );

  /**
   * Vérifie si l'utilisateur peut voir un pointage spécifique
   */
  const canView = (attendanceEmployeeId?: string) => {
    return canViewAttendance(permissionContext, attendanceEmployeeId);
  };

  /**
   * Vérifie si l'utilisateur peut modifier un pointage
   */
  const canUpdate = (attendanceEmployeeId?: string) => {
    // Admin ou permission update
    if (features.canUpdate) return true;

    // Les employés ne peuvent pas modifier leurs propres pointages
    return false;
  };

  /**
   * Vérifie si l'utilisateur peut supprimer un pointage
   */
  const canDelete = (attendanceEmployeeId?: string) => {
    // Seulement admin ou permission delete
    return features.canDelete;
  };

  /**
   * Vérifie si l'utilisateur peut approuver un pointage
   */
  const canApprove = (attendanceEmployeeId?: string) => {
    // On ne peut pas approuver son propre pointage
    if (attendanceEmployeeId === permissionContext?.userId) return false;

    return features.canApprove;
  };

  return {
    // Context
    permissionContext,
    isLoading,

    // Features
    features,
    viewScope,

    // Permission checks
    can,
    cannot,
    hasPermission,

    // Attendance-specific checks
    canView,
    canUpdate,
    canDelete,
    canApprove,

    // Quick flags
    canViewOwn: features.canViewOwn,
    canViewAll: features.canViewAll,
    canScan: features.canScan,
    canCreateQR: features.canCreateQR,
    canManualCheckin: features.canManualCheckin,
  };
}
