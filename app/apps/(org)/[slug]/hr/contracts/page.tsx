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
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import { API_CONFIG } from "@/lib/api/config";
import { Alert, Button, Card, Input, Badge } from "@/components/ui";
import { ProtectedRoute, Can } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import { ResourceType, PermissionAction, COMMON_PERMISSIONS } from "@/lib/types/shared";
import { PDFPreviewModal } from '@/components/ui';
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  permanent: "CDI",
  temporary: "CDD",
  contract: "Contractuel",
  internship: "Stage",
  freelance: "Freelance",
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  permanent: "bg-green-100 text-green-800 border-green-200",
  temporary: "bg-blue-100 text-blue-800 border-blue-200",
  contract: "bg-purple-100 text-purple-800 border-purple-200",
  internship: "bg-orange-100 text-orange-800 border-orange-200",
  freelance: "bg-pink-100 text-pink-800 border-pink-200",
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: "/h",
  daily: "/jour",
  monthly: "/mois",
  annual: "/an",
};

export default function ContractsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    filename: string;
  }>({
    isOpen: false,
    pdfUrl: '',
    title: '',
    filename: '',
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContracts(slug, {
        contract_type: filterType || undefined,
        is_active: filterActive !== null ? filterActive : undefined,
      });
      console.log('Contract data:', data);

      setContracts(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des contrats";
      setError(errorMessage);
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) return;

    try {
      setDeleting(id);
      await contractService.deleteContract(slug, id);
      await loadContracts();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (contract: Contract) => {
    try {
      if (contract.is_active) {
        await contractService.deactivateContract(slug, contract.id);
      } else {
        await contractService.activateContract(slug, contract.id);
      }
      await loadContracts();
    } catch (err) {
      alert("Erreur lors de la modification du statut");
      console.error(err);
    }
  };

  const handlePreviewPDF = async (contractId: string, employeeName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/contracts/${contractId}/export-pdf/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Organization-Slug': slug,
          },
        }
      );
      
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setPdfPreview({
        isOpen: true,
        pdfUrl: url,
        title: `Contrat - ${employeeName}`,
        filename: `Contrat_${employeeName.replace(/\s+/g, '_')}.pdf`,
      });
    } catch (err) {
      alert('Erreur lors du chargement du PDF');
      console.error(err);
    }
  };

  const closePdfPreview = () => {
    if (pdfPreview.pdfUrl) {
      window.URL.revokeObjectURL(pdfPreview.pdfUrl);
    }
    setPdfPreview({
      isOpen: false,
      pdfUrl: '',
      title: '',
      filename: '',
    });
  };

  const filteredContracts = contracts.filter((contract) => {
    const searchString = `${contract.employee_name || ''} ${contract.contract_type_display || ''}`
      .toLowerCase();
    const query = searchQuery.toLowerCase();
    return searchString.includes(query);
  });

  const activeContracts = contracts.filter(c => c.is_active);
  const inactiveContracts = contracts.filter(c => !c.is_active);

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/hr/contracts/create`)),
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
      setSelectedIndex((prev) => Math.min(prev + 1, filteredContracts.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredContracts[selectedIndex]) {
        router.push(`/apps/${slug}/hr/contracts/${filteredContracts[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredContracts[selectedIndex]) {
        router.push(`/apps/${slug}/hr/contracts/${filteredContracts[selectedIndex].id}/edit`);
      }
    }, description: "Éditer le contrat sélectionné" },
    { key: "a", action: () => {
      setFilterActive(filterActive === true ? null : true);
      loadContracts();
    }, description: "Filtrer les actifs" },
    { key: "i", action: () => {
      setFilterActive(filterActive === false ? null : false);
      loadContracts();
    }, description: "Filtrer les inactifs" },
  ], [slug, router, showShortcuts, selectedIndex, filteredContracts, filterActive]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/contracts']}>
      <div className="space-y-6">
        {/* Modal des raccourcis */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Contrats"
        />

        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineDocumentText className="size-7" />
              Contrats
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez tous les contrats de vos employés
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
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
              <Button asChild>
                <Link href={`/apps/${slug}/hr/contracts/create`}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Nouveau contrat
                  <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
                </Link>
              </Button>
            </Can>
          </div>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Total contrats</div>
            <div className="text-2xl font-bold mt-1">{contracts.length}</div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Actifs</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {activeContracts.length}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Inactifs</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">
              {inactiveContracts.length}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">CDI</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {contracts.filter((c) => c.contract_type === 'permanent').length}
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par employé ou type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20"
                aria-label="Rechercher des contrats"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === true ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterActive(filterActive === true ? null : true);
                  loadContracts();
                }}
              >
                Actifs
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">A</kbd>
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterActive(filterActive === false ? null : false);
                  loadContracts();
                }}
              >
                Inactifs
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">I</kbd>
              </Button>
            </div>
          </div>
        </Card>

        {/* Contracts Table */}
        <Card className="border-0 shadow-sm">
          {filteredContracts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineDocumentText className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucun contrat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? "Aucun résultat pour cette recherche" : "Commencez par ajouter votre premier contrat"}
                  </p>
                </div>
                {!searchQuery && (
                  <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
                    <Button asChild>
                      <Link href={`/apps/${slug}/hr/contracts/create`}>
                        <HiOutlinePlusCircle className="size-4 mr-2" />
                        Ajouter un contrat
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
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Salaire de base</TableHead>
                  <TableHead>Heures/sem</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract, index) => (
                  <TableRow
                    key={contract.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/hr/contracts/${contract.id}`)}
                    tabIndex={0}
                    role="row"
                    aria-selected={selectedIndex === index}
                  >
                    <TableCell>
                      <div className="font-medium">{contract.employee_name || 'Sans nom'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CONTRACT_TYPE_COLORS[contract.contract_type] || ""}>
                        {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(contract.start_date).toLocaleDateString('fr-FR')}</div>
                        {contract.end_date && (
                          <div className="text-muted-foreground">
                            → {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {contract.base_salary?.toLocaleString('fr-FR')} {contract.currency}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {SALARY_PERIOD_LABELS[contract.salary_period || 'monthly']}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{contract.hours_per_week || '-'}h</span>
                    </TableCell>
                    <TableCell>
                      {contract.is_active ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <HiOutlineCheckCircle className="size-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <HiOutlineXCircle className="size-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deleting === contract.id}>
                            <HiOutlineEllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem asChild>
                            <Link href={`/apps/${slug}/hr/contracts/${contract.id}`}>
                              <HiOutlineEye className="size-4 mr-2" />
                              Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
                            <DropdownMenuItem onClick={() => handlePreviewPDF(contract.id, contract.employee_name || 'contrat')}>
                              <HiOutlineArrowDownTray className="size-4 mr-2" /> {/* Changed icon to more appropriate or keep Eye? ArrowDownTray is better for export/preview */}
                              Aperçu PDF
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
                            <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/contracts/${contract.id}/edit`}>
                                <HiOutlinePencil className="size-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(contract)}>
                              {contract.is_active ? (
                                <>
                                  <HiOutlineXCircle className="size-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <HiOutlineCheckCircle className="size-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.DELETE_CONTRACTS}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(contract.id)}
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
      </div>

      {/* Hint */}
      <KeyboardHint />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={closePdfPreview}
        title={pdfPreview.title}
        pdfUrl={pdfPreview.pdfUrl}
        filename={pdfPreview.filename}
      />
    </ProtectedRoute>
  );
}
