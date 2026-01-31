"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button } from "@/components/ui";
import {
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineQuestionMarkCircle,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import {
  ShortcutsHelpModal,
  KeyboardHint,
} from "@/components/ui/shortcuts-help";
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
  commonShortcuts,
} from "@/lib/hooks/use-keyboard-shortcuts";
import { getLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "@/lib/services/hr/leave.service";
import type { LeaveRequest } from "@/lib/types/hr";
import { ApiError } from "@/lib/api/client";
import { useUser } from "@/lib/hooks";
import { getPermissions } from "@/lib/services/hr/permission.service";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";

// Badge composant inline pour le type de congé
function LeaveTypeBadge({ type, color }: { type: string; color: string }) {
  // color: nom de class, eg. bg-blue-100 text-blue-800
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${color}`}>
      {type}
    </span>
  );
}

// Badge type map (tiré de la page détail pour s'inspirer)
const LEAVE_TYPE_COLORS: Record<string, string> = {
  "RTT": "bg-indigo-100 text-indigo-800",
  "CP": "bg-teal-100 text-teal-800",
  "Sans solde": "bg-gray-100 text-gray-800",
  "Maladie": "bg-pink-100 text-pink-800",
  "Exceptionnel": "bg-yellow-100 text-yellow-800",
  // Ajoute plus si besoin selon leave_type_name
};

export default function LeavesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const user = useUser();
  const userType = user?.user_type;

  const [hasApprovePermission, setHasApprovePermission] = useState<boolean | null>(null);

  // Pour gestion des actions (modal, etc)
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id en cours d'action ("approve"/"reject")

  // Cheque permission seulement si userType !== admin
  useEffect(() => {
    if (userType === null) return;
    if (userType === "admin") {
      setHasApprovePermission(true);
      return;
    }
    let mounted = true;
    async function checkPerm() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (token) {
          if (mounted) {
            setHasApprovePermission(
              user?.permissions?.includes(COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS) ?? false
            );
          }
        } else {
          setHasApprovePermission(false);
        }
      } catch {
        if (mounted) setHasApprovePermission(false);
      }
    }
    checkPerm();
    return () => {
      mounted = false;
    };
  }, [userType]);

  // Redirige si pas permission
  useEffect(() => {
    if (userType !== "admin" && hasApprovePermission === false) {
      router.replace(`/apps/${slug}/hr/leaves/history`);
      return;
    }
  }, [hasApprovePermission, slug, router, userType]);

  // Charge les données
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      commonShortcuts.search(() => searchInputRef.current?.focus()),
      commonShortcuts.help(() => setShowShortcuts(true)),
      {
        key: "c",
        action: () => router.push(`/apps/${slug}/hr/leaves/calendar`),
        description: "Ouvrir calendrier",
      },
    ],
    [slug, router, showShortcuts]
  );

  useKeyboardShortcuts({ shortcuts });

  useEffect(() => {
    if (userType === "admin" || hasApprovePermission === true) {
      const load = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await getLeaveRequests({exclude:true});
          setLeaveRequests(response.results || []);
        } catch (err: any) {
          if (err instanceof ApiError) setError(err.message);
          else setError(err?.message || "Erreur lors du chargement des demandes de congés");
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [hasApprovePermission, userType]);

  // Stats
  const stats = [
    {
      title: "En attente",
      value: leaveRequests.filter((r) => r.status === "pending").length,
      icon: HiOutlineCalendar,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Approuvés",
      value: leaveRequests.filter((r) => r.status === "approved").length,
      icon: HiOutlineCalendar,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Rejetés",
      value: leaveRequests.filter((r) => r.status === "rejected").length,
      icon: HiOutlineCalendar,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Total demandes",
      value: leaveRequests.length,
      icon: HiOutlineCalendar,
      bgColor: "bg-blue-100",
      iconColor: "text-foreground",
    },
  ];
  // Logic modale simple pour feedback action (succès ou erreur d'API)
  const [globalActionMessage, setGlobalActionMessage] = useState<string | null>(null);

  // Filtrage recherche employé
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return leaveRequests;
    const q = searchQuery.toLowerCase();
    return leaveRequests.filter((req) => {
      const name = (req.employee_name || "");
      return name.toLowerCase().includes(q);
    });
  }, [searchQuery, leaveRequests]);

  if (
    loading ||
    (userType !== "admin" && hasApprovePermission === null) ||
    userType === null
  ) {
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

  if (userType !== "admin" && hasApprovePermission === false) {
    return null;
  }


  // Actualiser la liste après action
  async function reloadRequests() {
    try {
      setLoading(true);
      const response = await getLeaveRequests();
      setLeaveRequests(response.results || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id + "-approve");
    setGlobalActionMessage(null);
    try {
      await approveLeaveRequest(id);
      setGlobalActionMessage("Demande approuvée !");
      await reloadRequests();
    } catch (e: any) {
      setGlobalActionMessage(e?.message || "Erreur lors de l'approbation.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id + "-reject");
    setGlobalActionMessage(null);
    try {
      await rejectLeaveRequest(id);
      setGlobalActionMessage("Demande rejetée !");
      await reloadRequests();
    } catch (e: any) {
      setGlobalActionMessage(e?.message || "Erreur lors du rejet.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleView(id: string) {
    router.push(`/apps/${slug}/hr/leaves/${id}`);
  }

  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}
      showMessage={true}
    >
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
            {userType !== "admin" && (
              <Button variant="outline" asChild>
                <Link href={`/apps/${slug}/hr/leaves/history`}>
                  <HiOutlineClipboardDocumentList className="size-4 mr-2" />
                  Mes historiques de demande
                </Link>
              </Button>
            )}
            {/* <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/leaves/calendar`}>
                <HiOutlineCalendar className="size-4 mr-2" />
                Calendrier
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">
                  C
                </kbd>
              </Link>
            </Button> */}
            <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/leaves/stats`}>
                <HiOutlineChartBar className="size-4 mr-2" />
                Statistiques
              </Link>
            </Button>
          </div>
        </div>

        {(error || globalActionMessage) && (
          <Alert variant={error ? "error" : "success"}>
            {error || globalActionMessage}
          </Alert>
        )}

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
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Rechercher par employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 border rounded h-10 w-full outline-none text-sm"
              aria-label="Rechercher des demandes de congés"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Nouvelle table avec badge type et actions inspirées de la page détail */}
        <Card className="border-0 shadow-sm mt-6">
          <div className="px-4 py-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune demande trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => {
                    // badge pour leave_type_name (ex: RTT, CP, etc)
                    const leaveTypeText = req.leave_type_name ?? "-";
                    // Choix couleur ou fallback bleu
                    let colorCls = "bg-blue-100 text-blue-800";
                    if (leaveTypeText && leaveTypeText in LEAVE_TYPE_COLORS) {
                      colorCls = LEAVE_TYPE_COLORS[leaveTypeText];
                    }

                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          {req.employee
                            ? `${req.employee_name ?? ""}`
                            : "–"}
                        </TableCell>
                        <TableCell>
                          <LeaveTypeBadge type={leaveTypeText} color={colorCls} />
                        </TableCell>
                        <TableCell>
                          {req.start_date
                            ? format(parseISO(req.start_date), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {req.end_date
                            ? format(parseISO(req.end_date), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {req.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                              En attente
                            </span>
                          ) : req.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Approuvé
                            </span>
                          ) : req.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                              Rejeté
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <button
                            onClick={() => handleView(req.id)}
                            title="Voir détails"
                            className="inline-flex items-center mx-1 px-1.5 py-1 rounded hover:bg-muted transition"
                          >
                            <HiOutlineEye className="size-5 text-blue-600" />
                          </button>
                         <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
                         {req.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                title="Approuver"
                                disabled={actionLoading === req.id + "-approve" || actionLoading === req.id + "-reject"}
                                className={`inline-flex items-center mx-1 px-1.5 py-1 rounded hover:bg-green-100 transition ${
                                  actionLoading === req.id + "-approve" ? "opacity-60 pointer-events-none" : ""
                                }`}
                              >
                                <HiOutlineCheckCircle className={`size-5 ${actionLoading === req.id + "-approve" ? "animate-spin" : "text-green-700"}`} />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                title="Rejeter"
                                disabled={actionLoading === req.id + "-approve" || actionLoading === req.id + "-reject"}
                                className={`inline-flex items-center mx-1 px-1.5 py-1 rounded hover:bg-red-100 transition ${
                                  actionLoading === req.id + "-reject" ? "opacity-60 pointer-events-none" : ""
                                }`}
                              >
                                <HiOutlineXCircle className={`size-5 ${actionLoading === req.id + "-reject" ? "animate-spin" : "text-red-700"}`} />
                              </button>
                            </>
                          )}
                         </Can>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          
          </div>
        </Card>
      </div>
      <KeyboardHint />
    </Can>
  );
}
