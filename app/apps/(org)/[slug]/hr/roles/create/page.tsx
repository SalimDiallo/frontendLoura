"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form-fields";
import { createRole } from "@/lib/services/hr/role.service";
import {
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

// Schema de validation
const roleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

// Liste des permissions disponibles (codes du backend)
const AVAILABLE_PERMISSIONS = [
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

export default function CreateRolePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
    },
  });

  // Generate code from name automatically
  const nameValue = form.watch("name");

  React.useEffect(() => {
    if (nameValue) {
      const generatedCode = nameValue
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      form.setValue("code", generatedCode);
    }
  }, [nameValue, form]);

  const onSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);
      setError(null);

      await createRole({
        ...data,
        permission_codes: selectedPermissions,
      });
      router.push(`/apps/${slug}/hr/roles`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la création du rôle");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = AVAILABLE_PERMISSIONS
      .filter((p) => p.category === category)
      .map((p) => p.code);

    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.includes(p)
    );

    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !categoryPermissions.includes(p))
      );
    } else {
      setSelectedPermissions((prev) => [
        ...prev,
        ...categoryPermissions.filter((p) => !prev.includes(p)),
      ]);
    }
  };

  // Grouper les permissions par catégorie
  const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/roles`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineShieldCheck className="size-7" />
              Nouveau Rôle
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Créer un nouveau rôle avec des permissions
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                name="name"
                label="Nom du rôle"
                placeholder="Ex: Responsable RH"
                required
              />
              <FormInputField
                name="code"
                label="Code (généré automatiquement)"
                placeholder="Ex: HR_MANAGER"
                required
                disabled
                className="bg-muted"
              />
              <FormTextareaField
                className="md:col-span-2"
                name="description"
                label="Description"
                placeholder="Description du rôle..."
                rows={3}
              />
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Permissions ({selectedPermissions.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sélectionnez les permissions à attribuer à ce rôle
            </p>

            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                const categoryPermissionCodes = permissions.map((p) => p.code);
                const allSelected = categoryPermissionCodes.every((p) =>
                  selectedPermissions.includes(p)
                );
                const someSelected = categoryPermissionCodes.some((p) =>
                  selectedPermissions.includes(p)
                );

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={allSelected}
                        onChange={() => toggleCategory(category)}
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        style={{
                          opacity: someSelected && !allSelected ? 0.5 : 1,
                        }}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm font-semibold cursor-pointer"
                      >
                        {category}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        ({permissions.filter((p) => selectedPermissions.includes(p.code)).length}/{permissions.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                      {permissions.map((permission) => (
                        <div key={permission.code} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={permission.code}
                            checked={selectedPermissions.includes(permission.code)}
                            onChange={() => togglePermission(permission.code)}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={permission.code}
                            className="text-sm cursor-pointer"
                          >
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Statut */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Statut</h2>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...form.register("is_active")}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Rôle actif
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/roles`}>
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Création en cours...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Créer le rôle
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
