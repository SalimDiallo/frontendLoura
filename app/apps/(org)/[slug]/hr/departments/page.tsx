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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, Button, Card, Input, Badge } from "@/components/ui";
import { getDepartments, deleteDepartment } from "@/lib/services/hr/department.service";
import { getPositions, createPosition, deletePosition, updatePosition } from "@/lib/services/hr/position.service";
import type { Department, Position } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBriefcase,
  HiOutlineXMark,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

export default function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Modal état pour créer/éditer poste
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionTitle, setPositionTitle] = useState("");
  const [positionDescription, setPositionDescription] = useState("");
  const [savingPosition, setSavingPosition] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
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

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) return;

    try {
      setDeleting(id);
      await deleteDepartment(id);
      await loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeletePosition = async (id: string) => {
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

  const handleSavePosition = async () => {
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

  const openPositionModal = (position?: Position) => {
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

  const closePositionModal = () => {
    setShowPositionModal(false);
    setEditingPosition(null);
    setPositionTitle("");
    setPositionDescription("");
  };

  const filteredDepartments = departments?.filter((dept) =>
    `${dept.name} ${dept.code}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPositions = positions?.filter((pos) =>
    pos.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Raccourcis clavier
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
  <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
      <div className="space-y-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Départements & Postes"
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineBriefcase className="size-7" />
            Organisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les départements et postes de votre organisation
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Départements</div>
          <div className="text-2xl font-bold mt-1">{departments?.length || 0}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Dép. actifs</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {departments?.filter((d) => d.is_active).length || 0}
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Postes</div>
          <div className="text-2xl font-bold mt-1">{positions?.length || 0}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Postes actifs</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {positions?.filter((p) => p.is_active).length || 0}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIndex(-1); setSearchQuery(""); }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="departments" className="gap-2">
              <HiOutlineBriefcase className="size-4" />
              Départements
            </TabsTrigger>
            <TabsTrigger value="positions" className="gap-2">
              <HiOutlineUserGroup className="size-4" />
              Postes
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "departments" ? (
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS}>
              <Button asChild>
                <Link href={`/apps/${slug}/hr/departments/create`}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Nouveau département
                </Link>
              </Button>
            </Can>
          ) : (
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_POSITIONS}>
              <Button onClick={() => openPositionModal()}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouveau poste
              </Button>
            </Can>
          )}
        </div>

        {/* Search */}
        <Card className="p-6 border-0 shadow-sm mt-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={activeTab === "departments" ? "Rechercher par nom ou code..." : "Rechercher par titre..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
              aria-label="Rechercher"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              Ctrl+K
            </kbd>
          </div>
        </Card>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-4">
          <Card className="border-0 shadow-sm">
            {filteredDepartments?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <HiOutlineBriefcase className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Aucun département</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery
                        ? "Aucun résultat pour cette recherche"
                        : "Commencez par créer votre premier département"}
                    </p>
                  </div>
                  {!searchQuery && (
                    <Can permission={COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS}>
                      <Button asChild>
                      <Link href={`/apps/${slug}/hr/departments/create`}>
                        <HiOutlinePlusCircle className="size-4 mr-2" />
                        Créer un département
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
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments?.map((department, index) => (
                    <TableRow
                      key={department.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                      )}
                      onClick={() => setSelectedIndex(index)}
                      onDoubleClick={() => router.push(`/apps/${slug}/hr/departments/${department.id}`)}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedIndex === index}
                    >
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {department.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {department.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={department.is_active ? "success" : "outline"}>
                          {department.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleting === department.id}
                            >
                              <HiOutlineEllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
                                <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/departments/${department.id}`}>
                                <HiOutlineEye className="size-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                             </Can>
                            <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
                               <DropdownMenuItem asChild>
                              <Link
                                href={`/apps/${slug}/hr/departments/${department.id}/edit`}
                              >
                                <HiOutlinePencil className="size-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            </Can>
                            <DropdownMenuSeparator />
                           <Can permission={COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS}>
                             <DropdownMenuItem
                               className="text-destructive"
                               onClick={() => handleDeleteDepartment(department.id)}
                             >
                               <HiOutlineTrash className="size-4 mr-2" />
                               Supprimer
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
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="mt-4">
          <Card className="border-0 shadow-sm">
            {filteredPositions?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <HiOutlineUserGroup className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Aucun poste</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery
                        ? "Aucun résultat pour cette recherche"
                        : "Commencez par créer votre premier poste"}
                    </p>
                  </div>
                  {!searchQuery && (
                    <Can permission={COMMON_PERMISSIONS.HR.CREATE_POSITIONS}>
                      <Button onClick={() => openPositionModal()}>
                        <HiOutlinePlusCircle className="size-4 mr-2" />
                        Créer un poste
                      </Button>
                    </Can>
                  )}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions?.map((position, index) => (
                    <TableRow
                      key={position.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                      )}
                      onClick={() => setSelectedIndex(index)}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedIndex === index}
                    >
                      <TableCell className="font-medium">{position.title}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {position.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={position.is_active ? "success" : "outline"}>
                          {position.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleting === position.id}
                            >
                              <HiOutlineEllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Can permission={COMMON_PERMISSIONS.HR.UPDATE_POSITIONS}>
                              <DropdownMenuItem onClick={() => openPositionModal(position)}>
                                <HiOutlinePencil className="size-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            </Can>
                            <DropdownMenuSeparator />
                            <Can permission={COMMON_PERMISSIONS.HR.DELETE_POSITIONS}>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePosition(position.id)}
                              >
                                <HiOutlineTrash className="size-4 mr-2" />
                                Supprimer
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
        </TabsContent>
      </Tabs>

      {/* Hint */}
      <KeyboardHint />

      {/* Modal Poste */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingPosition ? "Modifier le poste" : "Créer un poste"}
              </h3>
              <button
                onClick={closePositionModal}
                className="p-1 hover:bg-muted rounded"
              >
                <HiOutlineXMark className="size-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre du poste *</label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="ex: Développeur Senior"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={positionDescription}
                  onChange={(e) => setPositionDescription(e.target.value)}
                  placeholder="Description du poste..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePositionModal}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={!positionTitle.trim() || savingPosition}
                  onClick={handleSavePosition}
                >
                  {savingPosition ? "Enregistrement..." : (editingPosition ? "Modifier" : "Créer")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </Can>
  );
}
