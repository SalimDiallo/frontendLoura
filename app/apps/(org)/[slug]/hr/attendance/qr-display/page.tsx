'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Button, Input, Alert, Badge } from '@/components/ui';
import { createQRSession, getEmployees } from '@/lib/services/hr';
import type { QRCodeSession, EmployeeListItem, QRCodeSessionEmployee } from '@/lib/types/hr';
import {
  QrCode,
  User,
  Users,
  Search,
  RefreshCw,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Zap,
  X,
} from 'lucide-react';
import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared/permissions';
import { cn } from '@/lib/utils';

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

  // Load employees
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

  // Timer countdown
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
      if (exists) {
        return prev.filter(e => e.id !== employee.id);
      }
      return [...prev, employee];
    });
  };

  const selectAll = () => {
    setSelectedEmployees(filteredEmployees);
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const handleGenerateQR = async () => {
    if (selectedEmployees.length === 0) {
      setError('Veuillez sélectionner au moins un employé');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Send all selected employee IDs
      const newSession = await createQRSession(
        {
          employee_ids: selectedEmployees.map(e => e.id),
          expires_in_minutes: expirationMinutes,
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

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modeConfig = {
    auto: {
      label: 'Auto',
      icon: Zap,
      description: 'Détection automatique arrivée/départ',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    check_in: {
      label: 'Arrivée',
      icon: Sun,
      description: 'Pointage d\'arrivée uniquement',
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    check_out: {
      label: 'Départ',
      icon: Moon,
      description: 'Pointage de départ uniquement',
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  };

  // Loading State
  if (loadingEmployees) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  // QR Code Display State
  if (session) {
    const isLowTime = timeRemaining < 60;
    const isExpired = timeRemaining === 0;
    const ModeIcon = modeConfig[session.mode || 'auto'].icon;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-2xl w-full p-8 border-0 shadow-2xl">
          {/* Header with employees */}
          <div className="text-center mb-6 pb-6 border-b">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={cn("p-2 rounded-lg", modeConfig[session.mode || 'auto'].bg)}>
                <ModeIcon className={cn("size-6", modeConfig[session.mode || 'auto'].color)} />
              </div>
              <Badge variant="outline" className="text-sm">
                {modeConfig[session.mode || 'auto'].label}
              </Badge>
            </div>
            
            <h2 className="text-xl font-bold mb-2">
              QR Code pour {session.employee_count} employé{session.employee_count > 1 ? 's' : ''}
            </h2>
            
            {/* Employee list */}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {session.all_employees.slice(0, 5).map((emp) => (
                <Badge key={emp.id} variant="outline" className="text-xs">
                  {emp.full_name}
                </Badge>
              ))}
              {session.all_employees.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{session.all_employees.length - 5} autres
                </Badge>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "bg-white p-6 rounded-2xl shadow-lg transition-all",
              isExpired && "opacity-50 grayscale"
            )}>
              <QRCodeSVG
                value={session.qr_code_data}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={cn(
                "size-5",
                isExpired ? "text-red-500" : isLowTime ? "text-amber-500" : "text-muted-foreground"
              )} />
              <span className="text-sm text-muted-foreground">Temps restant</span>
            </div>
            <div className={cn(
              "text-5xl font-mono font-bold",
              isExpired ? "text-red-500" : isLowTime ? "text-amber-500" : "text-primary"
            )}>
              {isExpired ? "Expiré" : formatTime(timeRemaining)}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden max-w-sm mx-auto">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isExpired ? "bg-red-500" : isLowTime ? "bg-amber-500" : "bg-primary"
                )}
                style={{
                  width: `${(timeRemaining / (expirationMinutes * 60)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Warning */}
          {isLowTime && !isExpired && (
            <Alert variant="warning" className="mb-6">
              <AlertTriangle className="size-4" />
              Le code expire bientôt !
            </Alert>
          )}

          {/* Instructions based on mode */}
          <div className="border-t pt-6 mb-6">
            <div className={cn(
              "p-4 rounded-xl text-center mb-4",
              modeConfig[session.mode || 'auto'].bg
            )}>
              {session.mode === 'check_in' && (
                <p className="font-medium flex items-center justify-center gap-2">
                  <Sun className="size-5" />
                  Ce QR code enregistre uniquement les ARRIVÉES
                </p>
              )}
              {session.mode === 'check_out' && (
                <p className="font-medium flex items-center justify-center gap-2">
                  <Moon className="size-5" />
                  Ce QR code enregistre uniquement les DÉPARTS
                </p>
              )}
              {session.mode === 'auto' && (
                <p className="font-medium flex items-center justify-center gap-2">
                  <Zap className="size-5" />
                  Détection automatique : Arrivée le matin, Départ le soir
                </p>
              )}
            </div>
            
            {session.employee_count > 1 && (
              <p className="text-sm text-muted-foreground text-center">
                Chaque employé devra sélectionner son nom après avoir scanné le QR code
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="size-4 mr-2" />
              Nouveau QR
            </Button>
            <Button onClick={handleGenerateQR} disabled={loading}>
              <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
              Régénérer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Employee Selection State
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/apps/${orgSlug}/hr/attendance`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <QrCode className="size-6 text-primary" />
              Générer un QR de Pointage
            </h1>
            <p className="text-sm text-muted-foreground">
              Sélectionnez un ou plusieurs employés
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Employee Selection Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-0 shadow-lg">
              {/* Search & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <Users className="size-4 mr-1" />
                    Tous
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <X className="size-4 mr-1" />
                    Aucun
                  </Button>
                </div>
              </div>

              {/* Selection indicator */}
              {selectedEmployees.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedEmployees.length} employé{selectedEmployees.length > 1 ? 's' : ''} sélectionné{selectedEmployees.length > 1 ? 's' : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Effacer
                  </Button>
                </div>
              )}

              {/* Employee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
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
                          "p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/30 hover:bg-muted/60"
                        )}
                      >
                        <div className={cn(
                          "size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isSelected ? (
                            <CheckCircle2 className="size-5" />
                          ) : (
                            employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            {/* Mode Selection */}
            <Card className="p-4 border-0 shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="size-5 text-primary" />
                Mode de pointage
              </h3>
              <div className="space-y-2">
                {(Object.keys(modeConfig) as AttendanceMode[]).map((m) => {
                  const config = modeConfig[m];
                  const Icon = config.icon;
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                        mode === m
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/60"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Icon className={cn("size-5", config.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Expiration Time */}
            <Card className="p-4 border-0 shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                Durée de validité
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <Button
                    key={mins}
                    variant={expirationMinutes === mins ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpirationMinutes(mins)}
                    className="w-full"
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              size="lg"
              onClick={handleGenerateQR}
              disabled={selectedEmployees.length === 0 || loading}
              className="w-full gap-2 h-14"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <QrCode className="size-5" />
                  Générer le QR
                  {selectedEmployees.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {selectedEmployees.length}
                    </Badge>
                  )}
                </>
              )}
            </Button>

            {/* Info */}
            <Card className="p-4 border-0 shadow-sm bg-muted/30">
              <h4 className="font-medium text-sm mb-2">💡 Comment ça marche</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Sélectionnez un ou plusieurs employés</li>
                <li>• Choisissez le mode (arrivée, départ ou auto)</li>
                <li>• Affichez le QR code pour que les employés le scannent</li>
                <li>• Si plusieurs employés : ils choisiront leur nom</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
