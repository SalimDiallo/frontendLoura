"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Alert,
  Badge
} from "@/components/ui";
import { getRole, deleteRole } from "@/lib/services/hr/role.service";
import type { Role } from "@/lib/types/hr";
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRole();
  }, [id]);

  const loadRole = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRole(id);
      setRole(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du rôle");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;

    try {
      setDeleting(true);
      await deleteRole(id);
      router.push(`/apps/${slug}/hr/roles`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  if (error || !role) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
        <div className="space-y-6">
          <Alert variant="error">{error || "Rôle non trouvé"}</Alert>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/roles`}>
              <HiOutlineArrowLeft className="size-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
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
            <h1 className="text-2xl font-bold text-foreground">
              Détails du rôle
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Informations et permissions du rôle
          </p>
        </div>
        <div className="flex gap-2">
          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_ROLES}>
            <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/roles/${id}/edit`}>
                <HiOutlinePencil className="size-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </Can>
          <Can permission={COMMON_PERMISSIONS.HR.DELETE_ROLES}>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || role.is_system_role}
              title={role.is_system_role ? "Les rôles système ne peuvent pas être supprimés" : ""}
            >
              <HiOutlineTrash className="size-4 mr-2" />
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </Can>
        </div>
      </div>

      {/* Role Info Card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{role.name}</h2>
              <div className="flex gap-2">
                {role.is_system_role && (
                  <Badge variant="info">Rôle système</Badge>
                )}
                <Badge variant={role.is_active ? "success" : "outline"}>
                  {role.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Code</div>
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                  {role.code}
                </code>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nombre de permissions</div>
                <div className="text-base font-medium">
                  {role.permission_count || role.permissions?.length || 0} permissions
                </div>
              </div>
            </div>

            {role.description && (
              <div className="mt-4">
                <div className="text-sm text-muted-foreground">Description</div>
                <p className="text-sm mt-1">{role.description}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Permissions Card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineShieldCheck className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Permissions
          </h3>
          <Badge variant="info">
            {role.permissions?.length || 0}
          </Badge>
        </div>

        {role.permissions && role.permissions.length > 0 ? (
          <div className="space-y-4">
            {/* Group by category */}
            {Object.entries(
              role.permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) acc[perm.category] = [];
                acc[perm.category].push(perm);
                return acc;
              }, {} as Record<string, typeof role.permissions>)
            ).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <Badge variant="info" className="text-xs">
                    {perms.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-2 p-3 bg-muted/50 rounded-md"
                    >
                      <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5"></div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {permission.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {permission.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <HiOutlineShieldCheck className="size-12 mx-auto opacity-50 mb-2" />
            <p>Aucune permission attribuée à ce rôle</p>
          </div>
        )}
      </Card>

      {/* Metadata Card */}
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Informations système</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Créé le</div>
            <div className="font-medium">
              {new Date(role.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Dernière modification</div>
            <div className="font-medium">
              {new Date(role.updated_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
    </Can>
  );
}
