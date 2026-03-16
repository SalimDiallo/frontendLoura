"use client";

import { Alert, Badge, Button, Card, Input, PDFPreviewWrapper } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PDFEndpoints, usePDF, useUser } from "@/lib/hooks";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import { getLeaveRequestsHistory } from "@/lib/services/hr/leave.service";
import type { LeaveRequestHistoryApiResponse, LeaveType } from "@/lib/types/hr";
import { Download } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineXCircle
} from "react-icons/hi2";

export default function LeaveHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const user = useUser();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestHistoryApiResponse[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [success, setSuccess] = useState<string>("")

  const { preview, previewState, closePreview } = usePDF({
    onSuccess: () => setSuccess('PDF chargé avec succès'),
    onError: (err) => setError(err),
  });


  const [search, setSearch] = useState("");

  useEffect(() => {
    setAuthChecked(true);

    if (user && user.user_type === "admin") {
      router.replace(`/apps/${slug}/hr/leaves`);
      return;
    }

    loadData();
    // eslint-disable-next-line
  }, [user]);

  const handlePreviewPDF = async (leave:LeaveRequestHistoryApiResponse) => {
    if (!leave) return;
    try {
      await preview(
        PDFEndpoints.leaveRequest(leave.id),
        `Demande de Congé - ${leave.employee_name}`,
        `Conge_${leave.employee_name}_${leave.id}.pdf`
      );
    } catch (err) {
      setError('Erreur lors du chargement du PDF');
    }
  };


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsResponse, typesResponse] = await Promise.all([
        getLeaveRequestsHistory(),
        getLeaveTypes({ is_active: true }),
      ]);
      setLeaveRequests(requestsResponse.results || []);
      setLeaveTypes(typesResponse || []);
    } catch (err: any) {
      setError(
        err.message || "Erreur lors du chargement de l'historique des congés"
      );
    } finally {
      setLoading(false);
    }
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

  // Search only
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRequests = leaveRequests
    .filter((request) => {
      if (!request.employee || request.employee !== user?.id) return false;
      if (!normalizedSearch) return true;
      // Cherche dans type, statut (label), nom employé
      const leaveType = (request.leave_type_name || "").toLowerCase();
      const employee = (request.employee_name || "").toLowerCase();
      const status = (getStatusBadge(request.status)?.props?.children?.[1] || "")
        .toLowerCase();

      return (
        leaveType.includes(normalizedSearch) ||
        employee.includes(normalizedSearch) ||
        status.includes(normalizedSearch)
      );
    })
    // always most recent first
    .sort((a, b) => {
      const aDate = new Date(a.created_at || "").getTime();
      const bDate = new Date(b.created_at || "").getTime();
      return bDate - aDate;
    });

  // Skeleton loading
  if (!authChecked || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-1/3 h-8 rounded" />
        <Skeleton className="h-20 w-full rounded" />
        <Skeleton className="h-96 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineCalendar className="size-7" />
              Mon historique de congés
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Retrouvez ici vos demandes de congé{" "}
            {user?.first_name ? `(${user.first_name} ${user.last_name})` : null}
          </p>
        </div>
        <div>
          <Button
            asChild
            size="lg"
            className="gap-2 shadow-md ring-2 ring-primary"
            title="Déposer une nouvelle demande de congé"
          >
            <Link href={`/apps/${slug}/hr/leaves/create`}>
              <HiOutlinePlus className="size-6" />
              Créer une demande
            </Link>
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Search seulement  */}
      <Card className="px-4 py-3 border bg-background rounded-md mb-2">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HiOutlineMagnifyingGlass className="size-4" />
            </span>
            <Input
              type="search"
              placeholder="Rechercher par type, statut, ou approbateur…"
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-sm h-9"
              onKeyDown={e => {
                if (e.key === "Escape") setSearch("");
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base text-muted-foreground hover:text-red-500"
                aria-label="Effacer la recherche"
                tabIndex={0}
                style={{ background: "none", border: "none" }}
              >
                &times;
              </button>
            )}
          </div>
        </div>
        <div className="pt-2 pl-0">
          <p className="text-xs text-muted-foreground">
            {filteredRequests.length === 0
              ? "Aucune demande trouvée"
              : filteredRequests.length === 1
              ? "1 demande trouvée"
              : `${filteredRequests.length} demandes trouvées`}
          </p>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineCalendar className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Aucune demande trouvée</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vous n&apos;avez pas fait de demande ou aucun résultat ne correspond.
              </p>
              <Button asChild className="gap-1 mt-2">
                <Link href={`/apps/${slug}/hr/leaves/create`}>
                  <HiOutlinePlus className="mr-1" />
                  Créer une demande
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandé le</TableHead>
                  <TableHead>Type ou titre</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Approbateur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-accent/30 transition">
                    <TableCell>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.leave_type_name && (
                        <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                              {request.leave_type_name || "N/A"}
                            </span>
                          </div>
                        )}
                        {request.title && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                            {request.title}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm whitespace-nowrap">
                        <span>
                          {new Date(request.start_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          &rarr;{" "}
                          {new Date(request.end_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {request.total_days}{" "}
                        {Number(request.total_days) > 1 ? "jours" : "jour"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {request.approver_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Télécharger la demande"
                          onClick={()=>handlePreviewPDF(request)}
                        >
                          <Download className="size-4" />
                        </Button>
                      
                        <button
                            onClick={() =>  router.push(`/apps/${slug}/hr/leaves/${request.id}`)}
                            title="Voir détails"
                            className="inline-flex items-center mx-1 px-1.5 py-1 rounded hover:bg-muted transition"
                          >
                            <HiOutlineEye className="size-5 text-primary" />
                          </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Résumé (stats) */}
      {filteredRequests.length > 0 && (
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Résumé de vos demandes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total demandes</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredRequests.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Jours approuvés
              </p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRequests
                  .filter((r) => r.status === "approved")
                  .reduce((sum, r) => sum + parseFloat(r.total_days as any), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredRequests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredRequests.filter((r) => r.status === "rejected").length}
              </p>
            </div>
          </div>
        </Card>
      )}

          {/* PDF Preview Modal */}
          <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </div>
  );
}
