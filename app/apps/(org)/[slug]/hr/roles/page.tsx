"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, Button, Card, Input, Badge, Switch } from "@/components/ui";
import { getRoles, deleteRole } from "@/lib/services/hr/role.service";
import type { Role } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineEyeSlash,
} from "react-icons/hi2";
import { Can, ProtectedRoute } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

export default function RolesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSystemRoles, setHideSystemRoles] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRoles();
  }, [slug]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoles({ organization_subdomain: slug });
      setRoles(data);
    } catch (err) {
      setError("Erreur lors du chargement des rôles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isSystemRole: boolean) => {
    if (isSystemRole) {
      alert("Les rôles système ne peuvent pas être supprimés. Vous pouvez uniquement les désactiver.");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;

    try {
      setDeleting(id);
      await deleteRole(id);
      await loadRoles();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredRoles = roles?.filter((role) => {
    // Filtrer par recherche
    const matchesSearch = `${role.name} ${role.code}`.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtrer les rôles système si l'option est activée
    const matchesSystemFilter = hideSystemRoles ? !role.is_system_role : true;

    return matchesSearch && matchesSystemFilter;
  });

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/hr/roles/create`)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchQuery("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, (filteredRoles?.length || 1) - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredRoles?.[selectedIndex]) {
        router.push(`/apps/${slug}/hr/roles/${filteredRoles[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredRoles?.[selectedIndex]) {
        router.push(`/apps/${slug}/hr/roles/${filteredRoles[selectedIndex].id}/edit`);
      }
    }, description: "Éditer le rôle sélectionné" },
    { key: "s", action: () => setHideSystemRoles(!hideSystemRoles), description: "Masquer/afficher rôles système" },
  ], [slug, router, showShortcuts, selectedIndex, filteredRoles, hideSystemRoles]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
    <div className="space-y-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Rôles"
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineShieldCheck className="size-7" />
            Rôles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les rôles et permissions de votre organisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <HiOutlineQuestionMarkCircle className="size-4" />
          </Button>
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_ROLES}>
            <Button asChild>
              <Link href={`/apps/${slug}/hr/roles/create`}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouveau rôle
                <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Total rôles</div>
          <div className="text-2xl font-bold mt-1">{roles?.length || 0}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Rôles organisation</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {roles?.filter((r) => !r.is_system_role).length || 0}
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Actifs</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {roles?.filter((r) => r.is_active).length || 0}
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Rôles système</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">
            {roles?.filter((r) => r.is_system_role).length || 0}
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Rechercher par nom ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
              aria-label="Rechercher des rôles"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              Ctrl+K
            </kbd>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              {hideSystemRoles ? (
                <HiOutlineEyeSlash className="size-4 text-muted-foreground" />
              ) : (
                <HiOutlineEye className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {hideSystemRoles ? "Rôles système masqués" : "Afficher tous les rôles"}
              </span>
            </div>
            <Switch
              checked={hideSystemRoles}
              onCheckedChange={setHideSystemRoles}
            />
            <kbd className="hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs text-muted-foreground">S</kbd>
          </div>
        </div>
      </Card>

      {/* Roles Table */}
      <Card className="border-0 shadow-sm">
        {filteredRoles?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineShieldCheck className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Aucun rôle</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? "Aucun résultat pour cette recherche"
                    : "Commencez par créer votre premier rôle"}
                </p>
              </div>
              {!searchQuery && (
                <Can permission={COMMON_PERMISSIONS.HR.CREATE_ROLES}>
                <Button asChild>
                  <Link href={`/apps/${slug}/hr/roles/create`}>
                    <HiOutlinePlusCircle className="size-4 mr-2" />
                    Créer un rôle
                  </Link>
                </Button>
                </Can>
              )}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles?.map((role, index) => (
                <TableRow
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                  )}
                  onClick={() => setSelectedIndex(index)}
                  onDoubleClick={() => router.push(`/apps/${slug}/hr/roles/${role.id}`)}
                  tabIndex={0}
                  role="row"
                  aria-selected={selectedIndex === index}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{role.name}</span>
                      {role.is_system_role && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                          Système
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {role.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {role.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {role.permissions?.length || 0} permission(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? "success" : "outline"}>
                      {role.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleting === role.id}
                        >
                          <HiOutlineEllipsisVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}>
                          <DropdownMenuItem asChild>
                            <Link href={`/apps/${slug}/hr/roles/${role.id}`}>
                              <HiOutlineEye className="size-4 mr-2" />
                              Voir les détails
                            </Link>
                          </DropdownMenuItem>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_ROLES}>

                          <DropdownMenuItem asChild>
                            <Link href={`/apps/${slug}/hr/roles/${role.id}/edit`}>
                              <HiOutlinePencil className="size-4 mr-2" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can permission={COMMON_PERMISSIONS.HR.DELETE_ROLES}>

                          <DropdownMenuItem
                            className={role.is_system_role ? "text-muted-foreground cursor-not-allowed" : "text-destructive"}
                            onClick={() => handleDelete(role.id, role.is_system_role)}
                            disabled={role.is_system_role}
                          >
                            <HiOutlineTrash className="size-4 mr-2" />
                            {role.is_system_role ? "Supprimer (protégé)" : "Supprimer"}
                          </DropdownMenuItem>
                          </Can>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Hint */}
      <KeyboardHint />
    </div>
    </Can>
  );
}
