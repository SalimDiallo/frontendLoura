export interface PermissionItem {
  code: string;
  label: string;
  category: string;
}

export const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  { code: "can_view_employee", label: "Voir les employés", category: "Employés" },
  { code: "can_create_employee", label: "Créer des employés", category: "Employés" },
  { code: "can_update_employee", label: "Modifier des employés", category: "Employés" },
  { code: "can_delete_employee", label: "Supprimer des employés", category: "Employés" },
  { code: "can_activate_employee", label: "Activer/Désactiver des employés", category: "Employés" },

  { code: "can_view_department", label: "Voir les départements", category: "Départements" },
  { code: "can_create_department", label: "Créer des départements", category: "Départements" },
  { code: "can_update_department", label: "Modifier des départements", category: "Départements" },
  { code: "can_delete_department", label: "Supprimer des départements", category: "Départements" },

  { code: "can_view_position", label: "Voir les postes", category: "Postes" },
  { code: "can_create_position", label: "Créer des postes", category: "Postes" },
  { code: "can_update_position", label: "Modifier des postes", category: "Postes" },
  { code: "can_delete_position", label: "Supprimer des postes", category: "Postes" },

  { code: "can_view_role", label: "Voir les rôles", category: "Rôles" },
  { code: "can_create_role", label: "Créer des rôles", category: "Rôles" },
  { code: "can_update_role", label: "Modifier des rôles", category: "Rôles" },
  { code: "can_assign_role", label: "Assigner des rôles", category: "Rôles" },

  { code: "can_view_contract", label: "Voir les contrats", category: "Contrats" },
  { code: "can_create_contract", label: "Créer des contrats", category: "Contrats" },
  { code: "can_update_contract", label: "Modifier des contrats", category: "Contrats" },
  { code: "can_delete_contract", label: "Supprimer des contrats", category: "Contrats" },

  { code: "can_view_leave", label: "Voir les congés", category: "Congés" },
  { code: "can_create_leave", label: "Créer des demandes de congés", category: "Congés" },
  { code: "can_update_leave", label: "Modifier des congés", category: "Congés" },
  { code: "can_delete_leave", label: "Supprimer des congés", category: "Congés" },
  { code: "can_approve_leave", label: "Approuver des congés", category: "Congés" },
  { code: "can_manage_leave_types", label: "Gérer les types de congés", category: "Congés" },
  { code: "can_manage_leave_balances", label: "Gérer les soldes de congés", category: "Congés" },

  { code: "can_view_payroll", label: "Voir la paie", category: "Paie" },
  { code: "can_create_payroll", label: "Créer des bulletins de paie", category: "Paie" },
  { code: "can_update_payroll", label: "Modifier la paie", category: "Paie" },
  { code: "can_delete_payroll", label: "Supprimer des bulletins de paie", category: "Paie" },
  { code: "can_process_payroll", label: "Traiter la paie", category: "Paie" },

  { code: "can_view_reports", label: "Voir les rapports", category: "Rapports" },
  { code: "can_export_reports", label: "Exporter les rapports", category: "Rapports" },

  { code: "can_view_attendance", label: "Voir les pointages", category: "Pointages" },
  { code: "can_view_all_attendance", label: "Voir tous les pointages", category: "Pointages" },
  { code: "can_create_attendance", label: "Créer des pointages", category: "Pointages" },
  { code: "can_update_attendance", label: "Modifier des pointages", category: "Pointages" },
  { code: "can_delete_attendance", label: "Supprimer des pointages", category: "Pointages" },
  { code: "can_approve_attendance", label: "Approuver des pointages", category: "Pointages" },
  { code: "can_manual_checkin", label: "Pointage manuel (sans QR)", category: "Pointages" },
  { code: "can_create_qr_session", label: "Générer des QR codes", category: "Pointages" },
];
