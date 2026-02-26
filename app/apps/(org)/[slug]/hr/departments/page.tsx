"use client";

import { useEffect, useState, useRef, useMemo, Dispatch, SetStateAction } from "react";
import { useParams, useRouter, useRouter as UseRouterType } from "next/navigation";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, Button, Card, Input, Badge } from "@/components/ui";
import { getDepartments, deleteDepartment } from "@/lib/services/hr/department.service";
import { getPositions, createPosition, deletePosition, updatePosition } from "@/lib/services/hr/position.service";
import type { Department, Position } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBriefcase,
  HiOutlineXMark,
  HiOutlineUserGroup,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { Can, usePermissionContext } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";
import { DepartmentsTable } from "@/components/hr/departements/DepartementsTable";
import { ModalPosition, PositionsTable } from "@/components/hr/departements/PositionTable";



// -----------------------------
// Composant principal
export default function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissionContext();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"departments" | "positions">(
    hasPermission(COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS) ? "departments" : "positions"
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    if (isLoading) return;
    if (hasPermission(COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS)) {
      setActiveTab("departments");
    } else {
      setActiveTab("positions");
    }
  }, [isLoading, hasPermission]);

  const [showPositionModal, setShowPositionModal] = useState<boolean>(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionTitle, setPositionTitle] = useState<string>("");
  const [positionDescription, setPositionDescription] = useState<string>("");
  const [savingPosition, setSavingPosition] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [slug]);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const [depts, positionsData] = await Promise.all([
        getDepartments({ organization_subdomain: slug }),
        getPositions({ is_active: true }),
      ]);
      setDepartments(depts);
      setPositions(positionsData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string): Promise<void> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) return;

    try {
      setDeleting(id);
      setError(null);
      await deleteDepartment(id);
      await loadData();
    } catch (err: unknown) {
      let errorMessage = "Erreur lors de la suppression";
      if (err && typeof err === 'object') {
        const apiErr = err as { data?: { error?: string }; message?: string };
        if (apiErr.data?.error) {
          errorMessage = apiErr.data.error;
        } else if (apiErr.message) {
          errorMessage = apiErr.message;
        }
      }
      setError(errorMessage);
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeletePosition = async (id: string): Promise<void> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce poste ?")) return;

    try {
      setDeleting(id);
      await deletePosition(id);
      await loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleSavePosition = async (): Promise<void> => {
    if (!positionTitle.trim()) return;

    try {
      setSavingPosition(true);
      if (editingPosition) {
        await updatePosition(editingPosition.id, {
          title: positionTitle.trim(),
          description: positionDescription.trim() || undefined,
        });
      } else {
        await createPosition({
          title: positionTitle.trim(),
          description: positionDescription.trim() || undefined,
          is_active: true,
        });
      }
      await loadData();
      closePositionModal();
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSavingPosition(false);
    }
  };

  const openPositionModal = (position?: Position): void => {
    if (position) {
      setEditingPosition(position);
      setPositionTitle(position.title);
      setPositionDescription(position.description || "");
    } else {
      setEditingPosition(null);
      setPositionTitle("");
      setPositionDescription("");
    }
    setShowPositionModal(true);
  };

  const closePositionModal = (): void => {
    setShowPositionModal(false);
    setEditingPosition(null);
    setPositionTitle("");
    setPositionDescription("");
  };

  const filteredDepartments: Department[] = departments?.filter((dept) =>
    `${dept.name} ${dept.code}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPositions: Position[] = positions?.filter((pos) =>
    pos.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => {
      if (activeTab === "departments") {
        router.push(`/apps/${slug}/hr/departments/create`);
      } else {
        openPositionModal();
      }
    }),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (showPositionModal) {
        closePositionModal();
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchQuery("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      const list = activeTab === "departments" ? filteredDepartments : filteredPositions;
      setSelectedIndex((prev) => Math.min(prev + 1, (list?.length || 1) - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (activeTab === "departments" && selectedIndex >= 0 && filteredDepartments?.[selectedIndex]) {
        router.push(`/apps/${slug}/hr/departments/${filteredDepartments[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (activeTab === "departments" && selectedIndex >= 0 && filteredDepartments?.[selectedIndex]) {
        router.push(`/apps/${slug}/hr/departments/${filteredDepartments[selectedIndex].id}/edit`);
      } else if (activeTab === "positions" && selectedIndex >= 0 && filteredPositions?.[selectedIndex]) {
        openPositionModal(filteredPositions[selectedIndex]);
      }
    }, description: "Éditer l'élément sélectionné" },
  ], [slug, router, showShortcuts, showPositionModal, selectedIndex, filteredDepartments, filteredPositions, activeTab]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
        <div className="space-y-4">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-56 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can anyPermissions={[COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS, COMMON_PERMISSIONS.HR.VIEW_POSITIONS]} showMessage={true}>
      <div className="space-y-6">

        {/* Modal des raccourcis */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Départements & Postes"
        />

        {error && <Alert variant="error" className="text-base py-3">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineBriefcase className="size-8" />
              Organisation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les départements et postes de votre organisation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowShortcuts(true)}
              aria-label="Afficher les raccourcis clavier"
              title="Raccourcis clavier (?)"
              className="h-9 px-3"
            >
              <HiOutlineQuestionMarkCircle className="size-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="text-sm text-muted-foreground">Départements</div>
              <div className="text-xl font-bold mt-1">{departments?.length || 0}</div>
            </Card>
            <Card className="p-4 border-0 shadow-sm">
              <div className="text-sm text-muted-foreground">Dép. actifs</div>
              <div className="text-xl font-bold mt-1 text-green-600">
                {departments?.filter((d) => d.is_active).length || 0}
              </div>
            </Card>
          </Can>
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_POSITIONS}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="text-sm text-muted-foreground">Postes</div>
              <div className="text-xl font-bold mt-1">{positions?.length || 0}</div>
            </Card>
            <Card className="p-4 border-0 shadow-sm">
              <div className="text-sm text-muted-foreground">Postes actifs</div>
              <div className="text-xl font-bold mt-1 text-green-600">
                {positions?.filter((p) => p.is_active).length || 0}
              </div>
            </Card>
          </Can>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "departments" | "positions"); setSelectedIndex(-1); setSearchQuery(""); }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="min-h-10 gap-2">
              <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
                <TabsTrigger value="departments" className="gap-2 px-4 py-2 text-base h-10 rounded">
                  <HiOutlineBriefcase className="size-5" />
                  Départements
                </TabsTrigger>
              </Can>
              <Can permission={COMMON_PERMISSIONS.HR.VIEW_POSITIONS}>
                <TabsTrigger value="positions" className="gap-2 px-4 py-2 text-base h-10 rounded">
                  <HiOutlineUserGroup className="size-5" />
                  Postes
                </TabsTrigger>
              </Can>
            </TabsList>
            {activeTab === "departments" ? (
              <Can permission={COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS}>
                <Button size="default" className="h-10 px-4 py-2 text-base" asChild>
                  <Link href={`/apps/${slug}/hr/departments/create`}>
                    <HiOutlinePlusCircle className="size-5 mr-2" />
                    Nouveau département
                  </Link>
                </Button>
              </Can>
            ) : (
              <Can permission={COMMON_PERMISSIONS.HR.CREATE_POSITIONS}>
                <Button size="default" className="h-10 px-4 py-2 text-base" onClick={() => openPositionModal()}>
                  <HiOutlinePlusCircle className="size-5 mr-2" />
                  Nouveau poste
                </Button>
              </Can>
            )}
          </div>

          <Card className="p-5 border-0 shadow-sm mt-4">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={activeTab === "departments" ? "Rechercher par nom ou code..." : "Rechercher par titre..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-20 py-3 min-h-10 text-base rounded"
                aria-label="Rechercher"
              />
              <kbd className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-7 items-center gap-1 rounded border bg-muted px-2 font-mono text-sm text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </Card>

          {/* Departments Tab */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
            <TabsContent value="departments" className="mt-4">
              <Card className="border-0 shadow-sm">
                {filteredDepartments?.length === 0 ? (
                  <div className="p-14 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                        <HiOutlineBriefcase className="size-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Aucun département</h3>
                        <p className="text-base text-muted-foreground mt-2">
                          {searchQuery
                            ? "Aucun résultat pour cette recherche"
                            : "Commencez par créer votre premier département"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Can permission={COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS}>
                          <Button size="default" className="h-10 px-4 py-2 text-base" asChild>
                            <Link href={`/apps/${slug}/hr/departments/create`}>
                              <HiOutlinePlusCircle className="size-5 mr-2" />
                              Créer un département
                            </Link>
                          </Button>
                        </Can>
                      )}
                    </div>
                  </div>
                ) : (
                  <DepartmentsTable
                    departments={filteredDepartments}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    router={router}
                    slug={slug}
                    handleDeleteDepartment={handleDeleteDepartment}
                    deleting={deleting}
                  />
                )}
              </Card>
            </TabsContent>
          </Can>

          {/* Positions Tab */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_POSITIONS}>
            <TabsContent value="positions" className="mt-4">
              <Card className="border-0 shadow-sm">
                {filteredPositions?.length === 0 ? (
                  <div className="p-14 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                        <HiOutlineUserGroup className="size-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Aucun poste</h3>
                        <p className="text-base text-muted-foreground mt-2">
                          {searchQuery
                            ? "Aucun résultat pour cette recherche"
                            : "Commencez par créer votre premier poste"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Can permission={COMMON_PERMISSIONS.HR.CREATE_POSITIONS}>
                          <Button size="default" className="h-10 px-4 py-2 text-base" onClick={() => openPositionModal()}>
                            <HiOutlinePlusCircle className="size-5 mr-2" />
                            Créer un poste
                          </Button>
                        </Can>
                      )}
                    </div>
                  </div>
                ) : (
                  <PositionsTable
                    positions={filteredPositions}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    openPositionModal={openPositionModal}
                    handleDeletePosition={handleDeletePosition}
                    deleting={deleting}
                  />
                )}
              </Card>
            </TabsContent>
          </Can>
        </Tabs>

        <KeyboardHint />

        {/* Modal Poste */}
        <ModalPosition
          isOpen={showPositionModal}
          closePositionModal={closePositionModal}
          editingPosition={editingPosition}
          positionTitle={positionTitle}
          setPositionTitle={setPositionTitle}
          positionDescription={positionDescription}
          setPositionDescription={setPositionDescription}
          handleSavePosition={handleSavePosition}
          savingPosition={savingPosition}
        />
      </div>
    </Can>
  );
}
