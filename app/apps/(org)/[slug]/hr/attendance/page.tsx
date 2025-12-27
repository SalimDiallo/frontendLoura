"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, differenceInSeconds, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import {
  Clock,
  LogIn,
  LogOut,
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  Coffee,
  Play,
  Square,
  Timer,
  TrendingUp,
  Users,
  History,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Alert, Button, Card, Badge } from "@/components/ui";
import { getTodayAttendance, checkIn, checkOut, startBreak, endBreak } from "@/lib/services/hr";
import type { Attendance, AttendanceCheckIn, AttendanceCheckOut } from "@/lib/types/hr";
import { Can } from "@/components/apps/common/protected-route";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HelpCircle } from "lucide-react";

type AttendanceState = "not_started" | "checked_in" | "on_break" | "checked_out";

export default function AttendancePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadTodayAttendance();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [slug]);

  const loadTodayAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodayAttendance(slug);
      setAttendance(data);
    } catch (err: any) {
      if (err.status !== 404) {
        setError(err.message || "Erreur lors du chargement");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine current state
  const state: AttendanceState = useMemo(() => {
    if (!attendance?.check_in) return "not_started";
    if (attendance.check_out) return "checked_out";
    if (attendance.break_start && !attendance.break_end) return "on_break";
    return "checked_in";
  }, [attendance]);

  // Calculate elapsed time since check-in
  const elapsedTime = useMemo(() => {
    if (!attendance?.check_in) return null;
    const checkInTime = new Date(attendance.check_in);
    const endTime = attendance.check_out ? new Date(attendance.check_out) : currentTime;
    return differenceInSeconds(endTime, checkInTime);
  }, [attendance, currentTime]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number | null) => {
    if (seconds === null) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate break duration
  const breakDuration = useMemo(() => {
    if (!attendance?.break_start) return 0;
    const start = new Date(attendance.break_start);
    const end = attendance.break_end ? new Date(attendance.break_end) : currentTime;
    return differenceInMinutes(end, start);
  }, [attendance, currentTime]);

  // Handle actions
  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      setError(null);
      setSuccess(null);
      
      let data;
      switch (action) {
        case "check_in":
          data = await checkIn({ location: "Bureau" }, slug);
          setSuccess("Arrivée enregistrée !");
          break;
        case "check_out":
          data = await checkOut({ location: "Bureau" }, slug);
          setSuccess("Départ enregistré !");
          break;
        case "start_break":
          data = await startBreak(slug);
          setSuccess("Pause démarrée");
          break;
        case "end_break":
          data = await endBreak(slug);
          setSuccess("Pause terminée");
          break;
      }
      if (data) setAttendance(data);
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.error || err.message || "Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  // Status colors and info
  const stateConfig = {
    not_started: {
      color: "bg-slate-500",
      textColor: "text-slate-600",
      label: "Non pointé",
      description: "Vous n'avez pas encore pointé aujourd'hui",
    },
    checked_in: {
      color: "bg-green-500",
      textColor: "text-green-600",
      label: "En service",
      description: "Vous êtes actuellement en service",
    },
    on_break: {
      color: "bg-amber-500",
      textColor: "text-amber-600",
      label: "En pause",
      description: "Vous êtes actuellement en pause",
    },
    checked_out: {
      color: "bg-blue-500",
      textColor: "text-blue-600",
      label: "Journée terminée",
      description: "Vous avez terminé votre journée",
    },
  };

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Actions de pointage
    { key: "i", action: () => {
      if (state === "not_started") handleAction("check_in");
    }, description: "Pointer l'arrivée" },
    { key: "o", action: () => {
      if (state === "checked_in") handleAction("check_out");
    }, description: "Pointer le départ" },
    { key: "b", action: () => {
      if (state === "checked_in") handleAction("start_break");
      else if (state === "on_break") handleAction("end_break");
    }, description: "Démarrer/Terminer la pause" },

    // Navigation
    { key: "q", action: () => router.push(`/apps/${slug}/hr/attendance/qr-scan`), description: "Scanner le QR Code" },
    { key: "h", action: () => router.push(`/apps/${slug}/hr/attendance/history`), description: "Historique" },
    { key: "a", action: () => router.push(`/apps/${slug}/hr/attendance/approvals`), description: "Approbations" },

    // Aide
    { key: "?", action: () => setShowShortcuts(true), description: "Afficher l'aide" },
    { key: "Escape", action: () => setShowShortcuts(false), description: "Fermer" },
  ], [state, slug, router]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Pointage"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pointage</h1>
          <p className="text-muted-foreground mt-1">
            {format(currentTime, "EEEE d MMMM yyyy", { locale: fr })}
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
            <HelpCircle className="size-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/attendance/history`}>
              <History className="size-4 mr-2" />
              Historique
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">H</kbd>
            </Link>
          </Button>
          <Can anyPermissions={["can_approve_attendance"]}>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/attendance/approvals`}>
                <Users className="size-4 mr-2" />
                Approbations
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">A</kbd>
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="animate-in slide-in-from-top">
          <AlertCircle className="size-4" />
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="animate-in slide-in-from-top">
          <CheckCircle2 className="size-4" />
          {success}
        </Alert>
      )}

      {/* Main Clock Card */}
      <Card className="p-8 border-0 shadow-lg overflow-hidden relative">
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-5",
          state === "checked_in" && "bg-gradient-to-br from-green-500 to-emerald-600",
          state === "on_break" && "bg-gradient-to-br from-amber-500 to-orange-600",
          state === "checked_out" && "bg-gradient-to-br from-blue-500 to-indigo-600",
          state === "not_started" && "bg-gradient-to-br from-slate-500 to-slate-600"
        )} />
        
        <div className="relative">
          {/* Status Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              stateConfig[state].color,
              "text-white font-medium"
            )}>
              <span className="relative flex size-2">
                {(state === "checked_in" || state === "on_break") && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                )}
                <span className="relative inline-flex rounded-full size-2 bg-white" />
              </span>
              {stateConfig[state].label}
            </div>
          </div>

          {/* Big Clock */}
          <div className="text-center mb-8">
            <div className="text-6xl sm:text-7xl font-bold font-mono tracking-tight">
              {format(currentTime, "HH:mm")}
            </div>
            <div className="text-2xl font-mono text-muted-foreground">
              :{format(currentTime, "ss")}
            </div>
          </div>

          {/* Elapsed Time (if working) */}
          {state !== "not_started" && (
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-1">
                {state === "checked_out" ? "Temps travaillé" : "Temps écoulé"}
              </p>
              <p className={cn(
                "text-3xl font-mono font-bold",
                stateConfig[state].textColor
              )}>
                {formatElapsedTime(elapsedTime)}
              </p>
            </div>
          )}

          {/* QR Code Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" asChild className="w-full sm:w-auto gap-2 h-14 text-lg">
                <Link href={`/apps/${slug}/hr/attendance/qr-scan`}>
                  <QrCode className="size-6" />
                  Scanner le QR Code
                  <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1.5 font-mono text-xs">Q</kbd>
                </Link>
              </Button>
              <Can anyPermissions={["can_create_qr_session", "can_manual_checkin"]}>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto gap-2 h-14">
                  <Link href={`/apps/${slug}/hr/attendance/qr-display`}>
                    <QrCode className="size-5" />
                    Afficher QR
                  </Link>
                </Button>
              </Can>
            </div>
          </div>

          {/* Action Buttons - Manual Check-in (Admin only) */}
          <Can anyPermissions={["can_manual_checkin"]}>
            <div className="border-t pt-6">
              <p className="text-xs text-muted-foreground text-center mb-4">
                Pointage manuel (Admin uniquement)
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Check In Button */}
                {state === "not_started" && (
                  <Button
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700 h-12"
                    onClick={() => handleAction("check_in")}
                    disabled={actionLoading === "check_in"}
                  >
                    {actionLoading === "check_in" ? (
                      <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="size-5" />
                    )}
                    Pointer l'arrivée
                    <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1.5 font-mono text-xs">I</kbd>
                  </Button>
                )}

                {/* Working State Buttons */}
                {state === "checked_in" && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 h-12"
                      onClick={() => handleAction("start_break")}
                      disabled={actionLoading === "start_break"}
                    >
                      {actionLoading === "start_break" ? (
                        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Coffee className="size-5" />
                      )}
                      Commencer une pause
                      <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs">B</kbd>
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 h-12"
                      onClick={() => handleAction("check_out")}
                      disabled={actionLoading === "check_out"}
                    >
                      {actionLoading === "check_out" ? (
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="size-5" />
                      )}
                      Pointer le départ
                      <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1.5 font-mono text-xs">O</kbd>
                    </Button>
                  </>
                )}

                {/* On Break Buttons */}
                {state === "on_break" && (
                  <Button
                    size="lg"
                    className="gap-2 bg-amber-600 hover:bg-amber-700 h-12"
                    onClick={() => handleAction("end_break")}
                    disabled={actionLoading === "end_break"}
                  >
                    {actionLoading === "end_break" ? (
                      <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="size-5" />
                    )}
                    Terminer la pause ({breakDuration} min)
                    <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1.5 font-mono text-xs">B</kbd>
                  </Button>
                )}
              </div>
            </div>
          </Can>
        </div>
      </Card>

      {/* Today's Summary */}
      {attendance && (
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Timer className="size-5 text-primary" />
            Résumé de la journée
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Check-in Time */}
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <LogIn className="size-5 text-green-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Arrivée</p>
              <p className="text-lg font-bold">
                {attendance.check_in 
                  ? format(new Date(attendance.check_in), "HH:mm")
                  : "--:--"
                }
              </p>
            </div>

            {/* Check-out Time */}
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <LogOut className="size-5 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Départ</p>
              <p className="text-lg font-bold">
                {attendance.check_out 
                  ? format(new Date(attendance.check_out), "HH:mm")
                  : "--:--"
                }
              </p>
            </div>

            {/* Total Hours */}
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <Clock className="size-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Travaillé</p>
              <p className="text-lg font-bold">
                {attendance.total_hours 
                  ? `${Math.floor(attendance.total_hours)}h ${Math.round((attendance.total_hours % 1) * 60)}m`
                  : "--"
                }
              </p>
            </div>

            {/* Break Duration */}
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <Coffee className="size-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Pause</p>
              <p className="text-lg font-bold">
                {attendance.break_duration 
                  ? `${Math.round(attendance.break_duration * 60)}m`
                  : "0m"
                }
              </p>
            </div>
          </div>

          {/* Status & Approval */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Statut:</span>
              <Badge variant="outline" className="capitalize">
                {attendance.status === 'present' && '✓ Présent'}
                {attendance.status === 'absent' && 'Absent'}
                {attendance.status === 'late' && '⏰ En retard'}
                {attendance.status === 'half_day' && '½ Demi-journée'}
                {attendance.status === 'on_leave' && '🏖 En congé'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Approbation:</span>
              <Badge
                variant={
                  attendance.approval_status === 'approved' ? 'success' :
                  attendance.approval_status === 'rejected' ? 'error' :
                  'warning'
                }
              >
                {attendance.approval_status === 'approved' && '✓ Approuvé'}
                {attendance.approval_status === 'rejected' && '✗ Rejeté'}
                {attendance.approval_status === 'pending' && '⏳ En attente'}
              </Badge>
            </div>
          </div>

          {/* Rejection Reason */}
          {attendance.approval_status === 'rejected' && attendance.rejection_reason && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
              <strong>Raison du rejet:</strong> {attendance.rejection_reason}
            </div>
          )}

          {/* Overtime */}
          {attendance.is_overtime && attendance.overtime_hours > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-600" />
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                +{attendance.overtime_hours.toFixed(1)}h supplémentaires
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/apps/${slug}/hr/attendance/history`}
          className="p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
        >
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Historique</p>
            <p className="text-xs text-muted-foreground">Voir mes pointages</p>
          </div>
        </Link>
        <Can anyPermissions={["can_view_all_attendance"]}>
          <Link
            href={`/apps/${slug}/hr/attendance/all`}
            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
          >
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Tous les pointages</p>
              <p className="text-xs text-muted-foreground">Vue équipe</p>
            </div>
          </Link>
        </Can>
      </div>

      {/* Hint */}
      <KeyboardHint />
    </div>
  );
}
