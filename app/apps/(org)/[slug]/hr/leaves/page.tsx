"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button, Badge, Input } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
} from "@/lib/services/hr/leave.service";
import type { LeaveRequest, LeaveStatus } from "@/lib/types/hr";
import { exportLeaveRequestToPDF } from "@/lib/utils/pdf-export";
import { ApiError } from "@/lib/api/client";
import { formatLeaveDaysWithLabel } from "@/lib/utils/leave";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { PDFPreviewModal } from '@/components/ui';
import { API_CONFIG } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

export default function LeavesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
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
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaveRequests();

      setLeaveRequests(response.results || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des demandes:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Erreur lors du chargement des demandes de congés");
      }
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionNotes("");
    setRejectDialogOpen(true);
  };

  const openDeleteDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      setError(null);
      await approveLeaveRequest(selectedRequest.id);
      setApproveDialogOpen(false);
      await loadLeaveRequests();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err instanceof ApiError ? err.message : (err?.message || "Erreur lors de l'approbation");
      setError(errorMessage);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      setError(null);
      await rejectLeaveRequest(selectedRequest.id, {
        approval_notes: rejectionNotes || undefined,
      });
      setRejectDialogOpen(false);
      await loadLeaveRequests();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err instanceof ApiError ? err.message : (err?.message || "Erreur lors du rejet");
      setError(errorMessage);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
      setRejectionNotes("");
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      setError(null);
      await deleteLeaveRequest(selectedRequest.id);
      setDeleteDialogOpen(false);
      await loadLeaveRequests();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err instanceof ApiError ? err.message : (err?.message || "Erreur lors de la suppression");
      setError(errorMessage);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const handlePreviewPDF = async (request: LeaveRequest) => {
    try {
      setProcessingId(request.id);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/leave-requests/${request.id}/export-pdf/`,
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
        title: `Demande de congé - ${request.employee_name || 'Employé'}`,
        filename: `Conge_${request.employee_name?.replace(/\s+/g, '_') || 'demande'}.pdf`,
      });
    } catch (err) {
      setError('Erreur lors du chargement du PDF');
    } finally {
      setProcessingId(null);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      pending: {
        label: "En attente",
        variant: "warning" as const,
        icon: HiOutlineClock,
      },
      approved: {
        label: "Approuvé",
        variant: "success" as const,
        icon: HiOutlineCheckCircle,
      },
      rejected: {
        label: "Rejeté",
        variant: "error" as const,
        icon: HiOutlineXCircle,
      },
      cancelled: {
        label: "Annulé",
        variant: "default" as const,
        icon: HiOutlineXCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = [
    {
      title: "En attente",
      value: leaveRequests.filter((r) => r.status === "pending").length,
      icon: HiOutlineClock,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Approuvés",
      value: leaveRequests.filter((r) => r.status === "approved").length,
      icon: HiOutlineCheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Rejetés",
      value: leaveRequests.filter((r) => r.status === "rejected").length,
      icon: HiOutlineXCircle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Total demandes",
      value: leaveRequests.length,
      icon: HiOutlineCalendar,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesTab = selectedTab === "all" || request.status === selectedTab;
    const matchesSearch = searchQuery === "" ||
      request.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.leave_type_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/hr/leaves/create`)),
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
      setSelectedIndex((prev) => Math.min(prev + 1, filteredRequests.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredRequests[selectedIndex]) {
        router.push(`/apps/${slug}/hr/leaves/${filteredRequests[selectedIndex].id}`);
      }
    }),
    commonShortcuts.filter("1", () => setSelectedTab("all"), "Toutes les demandes"),
    commonShortcuts.filter("2", () => setSelectedTab("pending"), "En attente"),
    commonShortcuts.filter("3", () => setSelectedTab("approved"), "Approuvées"),
    commonShortcuts.filter("4", () => setSelectedTab("rejected"), "Rejetées"),
    { key: "c", action: () => router.push(`/apps/${slug}/hr/leaves/calendar`), description: "Ouvrir calendrier" },
  ], [slug, router, showShortcuts, selectedIndex, filteredRequests]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
  <Can permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS} showMessage={true}>
      <div className="space-y-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Congés"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineCalendar className="size-7" />
            Gestion des Congés
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez et approuvez les demandes de congés
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <HiOutlineQuestionMarkCircle className="size-4" />
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/leaves/history`}>
              <HiOutlineClipboardDocumentList className="size-4 mr-2" />
              Historique
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/leaves/calendar`}>
              <HiOutlineCalendar className="size-4 mr-2" />
              Calendrier
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">C</kbd>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/leaves/stats`}>
              <HiOutlineChartBar className="size-4 mr-2" />
              Statistiques
            </Link>
          </Button>
         <Can permission={COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS}>
         <Button asChild>
            <Link href={`/apps/${slug}/hr/leaves/create`}>
              <HiOutlinePlusCircle className="size-4 mr-2" />
              Nouvelle demande
              <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
            </Link>
          </Button>
         </Can>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <stat.icon className={`size-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Rechercher par employé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20"
            aria-label="Rechercher des demandes de congés"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Tabs and Table */}
      <Card className="border-0 shadow-sm">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="border-b px-6 pt-6">
            <TabsList>
              <TabsTrigger value="all">
                Toutes ({leaveRequests.length})
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">1</kbd>
              </TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({leaveRequests.filter((r) => r.status === "pending").length})
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">2</kbd>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approuvées ({leaveRequests.filter((r) => r.status === "approved").length})
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">3</kbd>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejetées ({leaveRequests.filter((r) => r.status === "rejected").length})
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">4</kbd>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={selectedTab} className="mt-0">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <HiOutlineCalendar className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Aucune demande de congé</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery
                        ? "Aucune demande ne correspond à votre recherche"
                        : selectedTab === "all"
                        ? "Il n'y a aucune demande de congé pour le moment"
                        : `Aucune demande ${
                            selectedTab === "pending"
                              ? "en attente"
                              : selectedTab === "approved"
                              ? "approuvée"
                              : "rejetée"
                          }`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer une nouvelle demande
                    </p>
                  </div>
                <Can permission={COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS}>
                <Button asChild>
                    <Link href={`/apps/${slug}/hr/leaves/create`}>
                      <HiOutlinePlusCircle className="size-4 mr-2" />
                      Créer une demande
                    </Link>
                  </Button>
                </Can>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Type de congé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Approbateur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">
                          {request.employee_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{
                              backgroundColor:
                                request.leave_type_color || "#3B82F6",
                            }}
                          />
                          <span className="text-sm">
                            {request.leave_type_name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {new Date(request.start_date).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-muted-foreground">
                            → {new Date(request.end_date).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatLeaveDaysWithLabel(request.total_days)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {request.approver_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={processingId === request.id}
                            >
                              <HiOutlineEllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/leaves/${request.id}`}>
                                <HiOutlineEye className="size-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePreviewPDF(request)}>
                              <HiOutlineDocumentText className="size-4 mr-2" />
                              Aperçu PDF
                            </DropdownMenuItem>
                            <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
                            {request.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => openApproveDialog(request)}
                                >
                                  <HiOutlineCheckCircle className="size-4 mr-2" />
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => openRejectDialog(request)}
                                >
                                  <HiOutlineXCircle className="size-4 mr-2" />
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                            </Can>
                           {/* <Can  permission={COMMON_PERMISSIONS.HR.DELE}> */}
                           {request.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => openDeleteDialog(request)}
                                >
                                  <HiOutlineXCircle className="size-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                           {/* </Can> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la demande de congé</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir approuver cette demande de congé pour{" "}
              <strong>{selectedRequest?.employee_name}</strong> ?
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                <div>Type: {selectedRequest?.leave_type_name}</div>
                <div>
                  Période: {selectedRequest?.start_date && new Date(selectedRequest.start_date).toLocaleDateString("fr-FR")}
                  {" → "}
                  {selectedRequest?.end_date && new Date(selectedRequest.end_date).toLocaleDateString("fr-FR")}
                </div>
                <div>Durée: {selectedRequest?.total_days ? formatLeaveDaysWithLabel(selectedRequest.total_days) : ''}</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={!!processingId}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={!!processingId}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId ? "Approbation..." : "Approuver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande de congé</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir rejeter cette demande de congé pour{" "}
              <strong>{selectedRequest?.employee_name}</strong> ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="rejection-notes" className="text-sm font-medium">
                Raison du rejet (optionnel)
              </label>
              <textarea
                id="rejection-notes"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={!!processingId}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={!!processingId}
            >
              {processingId ? "Rejet..." : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la demande de congé</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande de congé ?
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                <div>Employé: {selectedRequest?.employee_name}</div>
                <div>Type: {selectedRequest?.leave_type_name}</div>
                <div>Durée: {selectedRequest?.total_days ? formatLeaveDaysWithLabel(selectedRequest.total_days) : ''}</div>
              </div>
              <div className="mt-2 text-destructive font-medium">
                Cette action est irréversible.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!processingId}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!!processingId}
            >
              {processingId ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  </Can>
  );
}
