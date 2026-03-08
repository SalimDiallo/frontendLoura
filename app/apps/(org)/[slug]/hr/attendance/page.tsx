"use client";

import { Can } from "@/components/apps/common/protected-route";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { KeyboardHint, ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { KeyboardShortcut, useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { checkIn, checkOut, endBreak, getTodayAttendance, startBreak } from "@/lib/services/hr";
import type { Attendance, Break as BreakType } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";
import { differenceInMinutes, differenceInSeconds, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  HelpCircle,
  History,
  ListChecks,
  LogIn,
  LogOut,
  Pause,
  Play,
  QrCode,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
      if (data && !('data' in data && data.data === null)) {
        setAttendance(data);
      } else {
        setAttendance(null);
      }
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
    if (attendance.is_on_break) return "on_break";
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

  // Active break duration in minutes (live)
  const activeBreakDuration = useMemo(() => {
    if (!attendance?.breaks) return 0;
    const activeBreak = attendance.breaks.find(b => b.is_active);
    if (!activeBreak) return 0;
    return differenceInMinutes(currentTime, new Date(activeBreak.start_time));
  }, [attendance, currentTime]);

  // Total breaks count
  const breaksCount = attendance?.breaks?.length ?? 0;
  const completedBreaks = attendance?.breaks?.filter(b => !b.is_active) ?? [];
  const totalBreakMinutes = attendance?.total_break_minutes ?? 0;

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
          setSuccess("Arrivée enregistrée");
          break;
        case "check_out":
          data = await checkOut({ location: "Bureau" }, slug);
          setSuccess("Départ enregistré");
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
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.error || err.message || "Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const stateConfig = {
    not_started: {
      label: "Non pointé",
      description: "Vous n'avez pas encore pointé aujourd'hui",
      dot: "bg-zinc-400",
      badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    },
    checked_in: {
      label: "En service",
      description: "Vous êtes actuellement en service",
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    on_break: {
      label: "En pause",
      description: "Vous êtes actuellement en pause",
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    checked_out: {
      label: "Journée terminée",
      description: "Vous avez terminé votre journée",
      dot: "bg-zinc-900 dark:bg-zinc-100",
      badge: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    },
  };

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: "i", action: () => { if (state === "not_started") handleAction("check_in"); }, description: "Pointer l'arrivée" },
    { key: "o", action: () => { if (state === "checked_in") handleAction("check_out"); }, description: "Pointer le départ" },
    { key: "b", action: () => {
      if (state === "checked_in") handleAction("start_break");
      else if (state === "on_break") handleAction("end_break");
    }, description: "Démarrer/Terminer la pause" },
    { key: "q", action: () => router.push(`/apps/${slug}/hr/attendance/qr-scan`), description: "Scanner le QR Code" },
    { key: "h", action: () => router.push(`/apps/${slug}/hr/attendance/history`), description: "Historique" },
    { key: "a", action: () => router.push(`/apps/${slug}/hr/attendance/approvals`), description: "Approbations" },
    { key: "?", action: () => setShowShortcuts(true), description: "Afficher l'aide" },
    { key: "Escape", action: () => setShowShortcuts(false), description: "Fermer" },
  ], [state, slug, router]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="size-10 rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Shortcuts Modal */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Pointage"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pointage</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(currentTime, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Raccourcis clavier"
            className="text-muted-foreground"
          >
            <HelpCircle className="size-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/attendance/history`}>
              <History className="size-4 mr-1.5" />
              Historique
            </Link>
          </Button>
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/attendance/all`}>
                <ListChecks className="size-4 mr-1.5" />
                Tous
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="text-sm">
          <AlertCircle className="size-4" />
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="text-sm">
          <CheckCircle2 className="size-4" />
          {success}
        </Alert>
      )}

      {/* Main Card */}
      <Card className="p-6 sm:p-8 shadow-sm">
        {/* Status */}
        <div className="flex items-center justify-center mb-6">
          <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", stateConfig[state].badge)}>
            <span className="relative flex size-2">
              {(state === "checked_in" || state === "on_break") && (
                <span className={cn("absolute inline-flex h-full w-full rounded-full animate-ping opacity-50", stateConfig[state].dot)} />
              )}
              <span className={cn("relative inline-flex rounded-full size-2", stateConfig[state].dot)} />
            </span>
            {stateConfig[state].label}
          </div>
        </div>

        {/* Clock */}
        <div className="text-center mb-6">
          <div className="text-5xl sm:text-6xl font-semibold font-mono tracking-tight tabular-nums">
            {format(currentTime, "HH:mm")}
          </div>
          <div className="text-lg font-mono text-muted-foreground tabular-nums">
            :{format(currentTime, "ss")}
          </div>
        </div>

        {/* Elapsed time */}
        {state !== "not_started" && (
          <div className="text-center mb-6">
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">
              {state === "checked_out" ? "Temps travaillé" : "Temps écoulé"}
            </p>
            <p className="text-2xl font-mono font-semibold tabular-nums">
              {formatElapsedTime(elapsedTime)}
            </p>
          </div>
        )}

        {/* QR Code Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
          <Button size="lg" asChild className="w-full sm:w-auto gap-2 h-11">
            <Link href={`/apps/${slug}/hr/attendance/qr-scan`}>
              <QrCode className="size-5" />
              Scanner le QR Code
              <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-[10px]">Q</kbd>
            </Link>
          </Button>
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_QR_SESSION}>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto gap-2 h-11">
              <Link href={`/apps/${slug}/hr/attendance/qr-display`}>
                <QrCode className="size-4" />
               Générer QR pour collègues
              </Link>
            </Button>
          </Can>
        </div>

        {/* Manual actions */}
        <div className="border-t pt-5">
          <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
            Pointage manuel
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
              {state === "not_started" && (
                <Button
                  size="default"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction("check_in")}
                  disabled={actionLoading === "check_in"}
                >
                  {actionLoading === "check_in" ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                  Pointer l'arrivée
                  <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-[10px]">I</kbd>
                </Button>
              )}
            </Can>

            {state === "checked_in" && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleAction("start_break")}
                  disabled={actionLoading === "start_break"}
                >
                  {actionLoading === "start_break" ? (
                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Coffee className="size-4" />
                  )}
                  Pause
                  <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-[10px]">B</kbd>
                </Button>
                <Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
                  <Button
                    className="gap-2"
                    onClick={() => handleAction("check_out")}
                    disabled={actionLoading === "check_out"}
                  >
                    {actionLoading === "check_out" ? (
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    Pointer le départ
                    <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-[10px]">O</kbd>
                  </Button>
                </Can>
              </>
            )}

            {state === "on_break" && (
              <Button
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleAction("end_break")}
                disabled={actionLoading === "end_break"}
              >
                {actionLoading === "end_break" ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Reprendre ({activeBreakDuration} min)
                <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-[10px]">B</kbd>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary */}
      {attendance && (
        <Card className="p-5 shadow-sm">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Timer className="size-4" />
            Résumé
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <LogIn className="size-4 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground mb-0.5">Arrivée</p>
              <p className="text-base font-semibold tabular-nums">
                {attendance.check_in
                  ? format(new Date(attendance.check_in), "HH:mm")
                  : "--:--"
                }
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <LogOut className="size-4 text-zinc-500 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground mb-0.5">Départ</p>
              <p className="text-base font-semibold tabular-nums">
                {attendance.check_out
                  ? format(new Date(attendance.check_out), "HH:mm")
                  : "--:--"
                }
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <Clock className="size-4 text-blue-500 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground mb-0.5">Travaillé</p>
              <p className="text-base font-semibold tabular-nums">
                {attendance.total_hours
                  ? `${Math.floor(attendance.total_hours)}h${Math.round((attendance.total_hours % 1) * 60).toString().padStart(2, '0')}`
                  : "--"
                }
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <Coffee className="size-4 text-amber-500 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground mb-0.5">Pauses ({breaksCount})</p>
              <p className="text-base font-semibold tabular-nums">
                {totalBreakMinutes > 0 ? `${totalBreakMinutes}m` : "0m"}
              </p>
            </div>
          </div>

          {/* Breaks detail list */}
          {breaksCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                Détail des pauses
              </p>
              <div className="space-y-1.5">
                {attendance.breaks.map((brk: BreakType, idx: number) => (
                  <div
                    key={brk.id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Pause className="size-3.5 text-amber-500" />
                      <span className="text-muted-foreground">Pause {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-muted-foreground">
                        {format(new Date(brk.start_time), "HH:mm")}
                        {" → "}
                        {brk.end_time
                          ? format(new Date(brk.end_time), "HH:mm")
                          : <span className="text-amber-600 font-medium">en cours</span>
                        }
                      </span>
                      {brk.duration_minutes > 0 && (
                        <Badge variant="outline" className="text-xs tabular-nums">
                          {brk.duration_minutes}m
                        </Badge>
                      )}
                      {brk.is_active && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          {activeBreakDuration}m
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Approval */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Statut :</span>
              <Badge variant="outline" className="capitalize text-xs">
                {attendance.status === 'present' && '✓ Présent'}
                {attendance.status === 'absent' && 'Absent'}
                {attendance.status === 'late' && '⏰ En retard'}
                {attendance.status === 'half_day' && '½ Demi-journée'}
                {attendance.status === 'on_leave' && '🏖 En congé'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Approbation :</span>
              <Badge
                variant={
                  attendance.approval_status === 'approved' ? 'success' :
                  attendance.approval_status === 'rejected' ? 'error' :
                  'warning'
                }
                className="text-xs"
              >
                {attendance.approval_status === 'approved' && '✓ Approuvé'}
                {attendance.approval_status === 'rejected' && '✗ Rejeté'}
                {attendance.approval_status === 'pending' && '⏳ En attente'}
              </Badge>
            </div>
          </div>

          {/* Rejection reason */}
          {attendance.approval_status === 'rejected' && attendance.rejection_reason && (
            <div className="mt-3 p-2.5 rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
              <strong>Raison :</strong> {attendance.rejection_reason}
            </div>
          )}

          {/* Overtime */}
          {attendance.is_overtime && attendance.overtime_hours > 0 && (
            <div className="mt-3 p-2.5 rounded-md bg-purple-50 dark:bg-purple-950/20 flex items-center gap-2 text-xs">
              <TrendingUp className="size-4 text-purple-600" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">
                +{attendance.overtime_hours.toFixed(1)}h supplémentaires
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/apps/${slug}/hr/attendance/history`}
          className="group p-4 rounded-xl border hover:border-zinc-300 dark:hover:border-zinc-600 bg-card transition-colors flex items-center gap-3"
        >
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Calendar className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Historique</p>
            <p className="text-xs text-muted-foreground">Voir mes pointages</p>
          </div>
        </Link>
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}>
          <Link
            href={`/apps/${slug}/hr/attendance/all`}
            className="group p-4 rounded-xl border hover:border-zinc-300 dark:hover:border-zinc-600 bg-card transition-colors flex items-center gap-3"
          >
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Tous les pointages</p>
              <p className="text-xs text-muted-foreground">Voir les pointages des employés</p>
            </div>
          </Link>
        </Can>
      </div>

      <KeyboardHint />
    </div>
  );
}
