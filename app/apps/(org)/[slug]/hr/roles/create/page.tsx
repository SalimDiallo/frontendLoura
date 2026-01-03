"use client";

import React, { useState, useEffect } from "react";
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
import { AVAILABLE_PERMISSIONS } from "@/lib/constants/hr";
import { PermissionSelector } from "@/components/apps/hr/permission-selector";
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
  is_active: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function CreateRolePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm<RoleFormData>({
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

  useEffect(() => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la création du rôle");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Permissions avec le nouveau composant */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Permissions
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedPermissions.length} sélectionnées)
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sélectionnez les permissions à attribuer à ce rôle
              </p>
            </div>

            <PermissionSelector
              permissions={AVAILABLE_PERMISSIONS}
              selectedPermissions={selectedPermissions}
              onSelectionChange={setSelectedPermissions}
              maxHeight="450px"
            />
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
