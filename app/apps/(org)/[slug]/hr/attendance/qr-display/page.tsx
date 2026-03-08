'use client';

import { Can } from '@/components/apps/common/protected-route';
import { Alert, Badge, Button, Card, Input } from '@/components/ui';
import { createQRSession, getEmployees } from '@/lib/services/hr';
import type { EmployeeListItem, QRCodeSession } from '@/lib/types/hr';
import { COMMON_PERMISSIONS } from '@/lib/types/permissions';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Moon,
  QrCode,
  RefreshCw,
  Search,
  Sun,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

type AttendanceMode = 'auto' | 'check_in' | 'check_out';

export default function QRDisplayPage() {
  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.CREATE_QR_SESSION}
      showMessage={true}
    >
      <QRDisplayContent />
    </Can>
  );
}

function QRDisplayContent() {
  const params = useParams();
  const orgSlug = params.slug as string;

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeListItem[]>([]);
  const [session, setSession] = useState<QRCodeSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(10);
  const [mode, setMode] = useState<AttendanceMode>('auto');

  useEffect(() => {
    loadEmployees();
  }, [orgSlug]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees(orgSlug, { is_active: true, page_size: 500 });
      setEmployees(data.results);
    } catch (err: any) {
      setError('Erreur lors du chargement des employés');
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const expiresAt = new Date(session.expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setSession(null);
        setSelectedEmployees([]);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const toggleEmployee = (employee: EmployeeListItem) => {
    setSelectedEmployees(prev => {
      const exists = prev.find(e => e.id === employee.id);
      if (exists) return prev.filter(e => e.id !== employee.id);
      return [...prev, employee];
    });
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectAll = () => setSelectedEmployees(filteredEmployees);
  const clearSelection = () => setSelectedEmployees([]);

  const handleGenerateQR = async () => {
    if (selectedEmployees.length === 0) {
      setError('Veuillez sélectionner au moins un employé');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newSession = await createQRSession(
        {
          employee_ids: selectedEmployees.map(e => e.id),
          expires_in_minutes: expirationMinutes,
          mode: mode,
        },
        orgSlug
      );
      setSession(newSession);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la session QR');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSession(null);
    setSelectedEmployees([]);
    setSearchQuery('');
    setError(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const modeConfig = {
    auto: {
      label: 'Auto',
      icon: Zap,
      description: 'Détection automatique arrivée/départ',
    },
    check_in: {
      label: 'Arrivée',
      icon: Sun,
      description: 'Pointage d\'arrivée uniquement',
    },
    check_out: {
      label: 'Départ',
      icon: Moon,
      description: 'Pointage de départ uniquement',
    },
  };

  // Loading
  if (loadingEmployees) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="size-10 rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  // QR Display
  if (session) {
    const isLowTime = timeRemaining < 60;
    const isExpired = timeRemaining === 0;
    const sessionMode = session.mode || 'auto';
    const ModeIcon = modeConfig[sessionMode].icon;

    return (
      <div className="max-w-lg mx-auto pb-10 space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="size-4 mr-1.5" />
            Nouveau QR
          </Button>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm">
          {/* Mode & Employees header */}
          <div className="text-center mb-6 pb-5 border-b">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm font-medium mb-3">
              <ModeIcon className="size-4" />
              {modeConfig[sessionMode].label}
            </div>
            <h2 className="text-lg font-semibold">
              QR Code — {session.employee_count} employé{session.employee_count > 1 ? 's' : ''}
            </h2>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {session.all_employees.slice(0, 5).map((emp) => (
                <Badge key={emp.id} variant="outline" className="text-xs font-normal">
                  {emp.full_name}
                </Badge>
              ))}
              {session.all_employees.length > 5 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{session.all_employees.length - 5} autres
                </Badge>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "bg-white p-5 rounded-xl border transition-opacity",
              isExpired && "opacity-30 grayscale"
            )}>
              <QRCodeSVG
                value={session.qr_code_data}
                size={260}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-5">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Clock className={cn(
                "size-3.5",
                isExpired ? "text-red-500" : isLowTime ? "text-amber-500" : "text-muted-foreground"
              )} />
              Temps restant
            </p>
            <p className={cn(
              "text-3xl font-mono font-semibold tabular-nums",
              isExpired ? "text-red-500" : isLowTime ? "text-amber-500" : ""
            )}>
              {isExpired ? "Expiré" : formatTime(timeRemaining)}
            </p>

            {/* Progress */}
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isExpired ? "bg-red-400" : isLowTime ? "bg-amber-400" : "bg-zinc-800 dark:bg-zinc-200"
                )}
                style={{ width: `${(timeRemaining / (expirationMinutes * 60)) * 100}%` }}
              />
            </div>
          </div>

          {/* Warning */}
          {isLowTime && !isExpired && (
            <Alert variant="warning" className="mb-5 text-sm">
              <AlertTriangle className="size-4" />
              Le code expire bientôt
            </Alert>
          )}

          {/* Mode instruction */}
          <div className="p-3 rounded-lg bg-muted/40 text-center text-sm mb-5">
            {sessionMode === 'check_in' && (
              <p className="flex items-center justify-center gap-2 text-muted-foreground">
                <Sun className="size-4" />
                Ce QR code enregistre uniquement les <strong className="text-foreground">arrivées</strong>
              </p>
            )}
            {sessionMode === 'check_out' && (
              <p className="flex items-center justify-center gap-2 text-muted-foreground">
                <Moon className="size-4" />
                Ce QR code enregistre uniquement les <strong className="text-foreground">départs</strong>
              </p>
            )}
            {sessionMode === 'auto' && (
              <p className="flex items-center justify-center gap-2 text-muted-foreground">
                <Zap className="size-4" />
                Détection automatique arrivée / départ
              </p>
            )}
          </div>

          {session.employee_count > 1 && (
            <p className="text-xs text-muted-foreground text-center mb-5">
              Chaque employé sélectionnera son nom après le scan
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-center border-t pt-5">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <ArrowLeft className="size-4 mr-1.5" />
              Nouveau
            </Button>
            <Button size="sm" onClick={() => handleGenerateQR()} disabled={loading}>
              <RefreshCw className={cn("size-4 mr-1.5", loading && "animate-spin")} />
              Régénérer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Employee Selection
  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/apps/${orgSlug}/hr/attendance`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <QrCode className="size-5" />
            Générer un QR de pointage
          </h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les employés concernés
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="text-sm">
          {error}
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Employee list */}
        <div className="lg:col-span-2">
          <Card className="p-5 shadow-sm">
            {/* Search & bulk actions */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  <Users className="size-3.5 mr-1" />
                  Tous
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="size-3.5 mr-1" />
                  Aucun
                </Button>
              </div>
            </div>

            {/* Selection count */}
            {selectedEmployees.length > 0 && (
              <div className="mb-3 py-2 px-3 rounded-md bg-muted/50 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {selectedEmployees.length} sélectionné{selectedEmployees.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Effacer
                </button>
              </div>
            )}

            {/* Employee grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredEmployees.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-sm text-muted-foreground">
                  {searchQuery ? 'Aucun employé trouvé' : 'Aucun employé actif'}
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployees.some(e => e.id === employee.id);
                  return (
                    <button
                      key={employee.id}
                      onClick={() => toggleEmployee(employee)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5",
                        isSelected
                          ? "border-zinc-400 dark:border-zinc-500 bg-muted/60"
                          : "border-transparent hover:bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                        isSelected
                          ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {isSelected ? (
                          <Check className="size-4" />
                        ) : (
                          employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{employee.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Settings panel */}
        <div className="space-y-4">
          {/* Mode */}
          <Card className="p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3 uppercase tracking-wider text-muted-foreground">
              Mode
            </h3>
            <div className="space-y-1.5">
              {(Object.keys(modeConfig) as AttendanceMode[]).map((m) => {
                const config = modeConfig[m];
                const Icon = config.icon;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5",
                      mode === m
                        ? "border-zinc-400 dark:border-zinc-500 bg-muted/60"
                        : "border-transparent hover:bg-muted/40"
                    )}
                  >
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Duration */}
          <Card className="p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-3 uppercase tracking-wider text-muted-foreground">
              Durée de validité
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 10, 15, 30, 60].map((mins) => (
                <Button
                  key={mins}
                  variant={expirationMinutes === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpirationMinutes(mins)}
                  className="text-xs"
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </Button>
              ))}
            </div>
          </Card>

          {/* Generate */}
          <Button
            size="lg"
            onClick={handleGenerateQR}
            disabled={selectedEmployees.length === 0 || loading}
            className="w-full gap-2 h-12"
          >
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <QrCode className="size-4" />
                Générer le QR
                {selectedEmployees.length > 0 && (
                  <Badge variant="outline" className="ml-1 bg-white/20 border-white/30 text-xs">
                    {selectedEmployees.length}
                  </Badge>
                )}
              </>
            )}
          </Button>

          {/* Info */}
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
            <p className="text-xs font-medium mb-1.5 text-muted-foreground">Comment ça marche</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 leading-relaxed">
              <li>• Sélectionnez un ou plusieurs employés</li>
              <li>• Choisissez le mode de pointage</li>
              <li>• Affichez le QR pour que les employés le scannent</li>
              <li>• Si plusieurs : ils choisiront leur nom</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
