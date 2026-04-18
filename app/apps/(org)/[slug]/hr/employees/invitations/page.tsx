"use client";

import { Alert, Button, Card } from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invitationService } from "@/lib/services/hr/invitation.service";
import type { EmployeeInvitation } from "@/lib/types/hr";
import { InvitationStatus } from "@/lib/types/hr";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlinePlusCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

// ============================================
// Status Badge Helper
// ============================================

function getStatusConfig(invitation: EmployeeInvitation) {
  if (invitation.status === InvitationStatus.ACCEPTED) {
    return { label: "Acceptée", variant: "success" as const, dotClass: "bg-emerald-500" };
  }
  if (invitation.status === InvitationStatus.CANCELLED) {
    return { label: "Annulée", variant: "secondary" as const, dotClass: "bg-muted-foreground" };
  }
  if (invitation.status === InvitationStatus.EXPIRED || invitation.is_expired) {
    return { label: "Expirée", variant: "warning" as const, dotClass: "bg-amber-500" };
  }
  return { label: "En attente", variant: "info" as const, dotClass: "bg-blue-500" };
}

// ============================================
// Main Component
// ============================================

export default function InvitationsListPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [invitations, setInvitations] = useState<EmployeeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "all">("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================
  // Data Loading
  // ============================================

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await invitationService.list(filters);
      setInvitations(response.results || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
      setErrorMessage("Erreur lors du chargement des invitations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // ============================================
  // Stats
  // ============================================

  const stats = useMemo(() => ({
    total: invitations.length,
    pending: invitations.filter((i) => i.status === InvitationStatus.PENDING && !i.is_expired).length,
    accepted: invitations.filter((i) => i.status === InvitationStatus.ACCEPTED).length,
    expired: invitations.filter((i) => i.status === InvitationStatus.EXPIRED || i.is_expired).length,
  }), [invitations]);

  // ============================================
  // Handlers
  // ============================================

  const clearMessages = () => { setSuccessMessage(""); setErrorMessage(""); };

  const handleResend = async (id: string, email: string) => {
    try {
      setActionLoading(id);
      clearMessages();
      await invitationService.resend(id);
      setSuccessMessage(`Invitation renvoyée à ${email}`);
      await loadInvitations();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur lors du renvoi de l'invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string, email: string) => {
    if (!confirm(`Annuler l'invitation pour ${email} ?`)) return;
    try {
      setActionLoading(id);
      clearMessages();
      await invitationService.cancel(id);
      setSuccessMessage(`Invitation annulée pour ${email}`);
      await loadInvitations();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur lors de l'annulation");
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // Filter buttons config
  // ============================================

  const filterButtons = [
    { key: "all" as const, label: "Toutes", count: stats.total, icon: null },
    { key: InvitationStatus.PENDING, label: "En attente", count: stats.pending, icon: <HiOutlineClock className="size-3.5" /> },
    { key: InvitationStatus.ACCEPTED, label: "Acceptées", count: stats.accepted, icon: <HiOutlineCheckCircle className="size-3.5" /> },
    { key: InvitationStatus.EXPIRED, label: "Expirées", count: stats.expired, icon: <HiOutlineXCircle className="size-3.5" /> },
  ];

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <HiOutlineEnvelope className="size-7" />
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gérez les invitations envoyées aux futurs employés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 px-3">
            <Link href={`/apps/${slug}/hr/employees`}>
              Retour aux employés
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 px-3">
            <Link href={`/apps/${slug}/hr/employees/invite`}>
              <HiOutlinePlusCircle className="size-4 mr-1.5" />
              Nouvelle invitation
            </Link>
          </Button>
        </div>
      </div>

      {/* Toasts */}
      {successMessage && (
        <Alert variant="success" className="py-2.5 px-3 text-sm">
          <HiOutlineCheckCircle className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="error" className="py-2.5 px-3 text-sm">
          <HiOutlineXCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              statusFilter === f.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {f.icon}
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                "ml-1 text-xs rounded-full px-1.5 py-0.5 tabular-nums",
                statusFilter === f.key
                  ? "bg-foreground/10 text-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Destinataire</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rôle</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Envoyée</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expiration</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    Chargement...
                  </div>
                </TableCell>
              </TableRow>
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <HiOutlineEnvelope className="size-8 opacity-40" />
                    <p className="text-sm">Aucune invitation trouvée</p>
                    <Button asChild variant="outline" size="sm" className="mt-1">
                      <Link href={`/apps/${slug}/hr/employees/invite`}>
                        <HiOutlinePlusCircle className="size-3.5 mr-1.5" />
                        Envoyer une invitation
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => {
                const status = getStatusConfig(invitation);
                const fullName = [invitation.first_name, invitation.last_name].filter(Boolean).join(" ");

                return (
                  <TableRow key={invitation.id} className="group">
                    {/* Destinataire */}
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {invitation.email}
                        </p>
                        {fullName && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {fullName}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Rôle */}
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {invitation.role_name || <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full shrink-0", status.dotClass)} />
                        <span className="text-sm text-foreground">{status.label}</span>
                      </div>
                    </TableCell>

                    {/* Envoyée */}
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(invitation.sent_at), { addSuffix: true, locale: fr })}
                      </div>
                      {invitation.invited_by_name && (
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          par {invitation.invited_by_name}
                        </div>
                      )}
                    </TableCell>

                    {/* Expiration */}
                    <TableCell>
                      {invitation.status === InvitationStatus.PENDING && !invitation.is_expired ? (
                        <span className={cn(
                          "text-sm",
                          (new Date(invitation.expires_at).getTime() - Date.now()) < 24 * 60 * 60 * 1000
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true, locale: fr })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {invitation.status === InvitationStatus.PENDING && !invitation.is_expired && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleResend(invitation.id, invitation.email)}
                              disabled={!!actionLoading}
                              title="Renvoyer"
                            >
                              <HiOutlineArrowPath className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleCancel(invitation.id, invitation.email)}
                              disabled={!!actionLoading}
                              title="Annuler"
                            >
                              <HiOutlineXMark className="size-3.5" />
                            </Button>
                          </>
                        )}
                        {(invitation.status === InvitationStatus.EXPIRED || invitation.is_expired) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => handleResend(invitation.id, invitation.email)}
                            disabled={!!actionLoading}
                          >
                            <HiOutlinePaperAirplane className="size-3.5 mr-1" />
                            Renvoyer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
