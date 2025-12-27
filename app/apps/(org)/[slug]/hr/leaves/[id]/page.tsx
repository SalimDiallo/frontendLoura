'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { 
  getLeaveRequest, 
  approveLeaveRequest, 
  rejectLeaveRequest,
  deleteLeaveRequest 
} from '@/lib/services/hr';
import type { LeaveRequest } from '@/lib/types/hr';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  CalendarDays,
  MessageSquare,
  UserCheck,
  Hourglass,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/lib/api/config';
import { PDFPreviewModal } from '@/components/ui';

export default function LeaveRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.slug as string;
  const leaveId = params.id as string;

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
  }>({
    isOpen: false,
    pdfUrl: '',
  });

  useEffect(() => {
    loadLeaveRequest();
  }, [leaveId]);

  const loadLeaveRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaveRequest(leaveId);
      setLeave(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading('approve');
      setError(null);
      await approveLeaveRequest(leaveId);
      setSuccess('Demande approuvée avec succès');
      await loadLeaveRequest();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading('reject');
      setError(null);
      await rejectLeaveRequest(leaveId, { approval_notes: rejectNotes });
      setSuccess('Demande rejetée');
      setShowRejectModal(false);
      setRejectNotes('');
      await loadLeaveRequest();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;
    
    try {
      setActionLoading('delete');
      await deleteLeaveRequest(leaveId);
      router.push(`/apps/${orgSlug}/hr/leaves`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      setActionLoading(null);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/leave-requests/${leaveId}/export-pdf/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Organization-Slug': orgSlug,
          },
        }
      );
      
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setPdfPreview({
        isOpen: true,
        pdfUrl: url,
      });
    } catch (err) {
      setError('Erreur lors du chargement du PDF');
    }
  };

  const closePdfPreview = () => {
    if (pdfPreview.pdfUrl) {
      window.URL.revokeObjectURL(pdfPreview.pdfUrl);
    }
    setPdfPreview({
      isOpen: false,
      pdfUrl: '',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approuvée',
          variant: 'success' as const,
          icon: CheckCircle2,
          bgClass: 'bg-green-50 dark:bg-green-950/30',
          textClass: 'text-green-600 dark:text-green-400',
        };
      case 'rejected':
        return {
          label: 'Rejetée',
          variant: 'error' as const,
          icon: XCircle,
          bgClass: 'bg-red-50 dark:bg-red-950/30',
          textClass: 'text-red-600 dark:text-red-400',
        };
      case 'cancelled':
        return {
          label: 'Annulée',
          variant: 'default' as const,
          icon: XCircle,
          bgClass: 'bg-gray-50 dark:bg-gray-800',
          textClass: 'text-gray-600 dark:text-gray-400',
        };
      default:
        return {
          label: 'En attente',
          variant: 'warning' as const,
          icon: Hourglass,
          bgClass: 'bg-amber-50 dark:bg-amber-950/30',
          textClass: 'text-amber-600 dark:text-amber-400',
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !leave) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="error" className="mb-4">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </Alert>
        <Button asChild>
          <Link href={`/apps/${orgSlug}/hr/leaves`}>
            <ArrowLeft className="size-4 mr-2" />
            Retour aux congés
          </Link>
        </Button>
      </div>
    );
  }

  if (!leave) return null;

  const statusConfig = getStatusConfig(leave.status);
  const StatusIcon = statusConfig.icon;
  const isPending = leave.status === 'pending';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/apps/${orgSlug}/hr/leaves`}>
              <ArrowLeft className="size-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Demande de congé</h1>
            <p className="text-muted-foreground text-sm">
              {leave.leave_type_name || 'Type non spécifié'}
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <Badge variant={statusConfig.variant} className="gap-1.5 px-3 py-1.5 text-sm">
          <StatusIcon className="size-4" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="mb-4">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle2 className="size-4" />
          <span>{success}</span>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dates Card */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              Période de congé
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className={cn(
                "p-4 rounded-xl",
                statusConfig.bgClass
              )}>
                <p className="text-sm text-muted-foreground mb-1">Date de début</p>
                <p className="font-semibold text-lg">{formatShortDate(leave.start_date)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(leave.start_date).split(',')[0]}
                </p>
                {leave.start_half_day && (
                  <Badge variant="outline" className="mt-2 text-xs">Demi-journée</Badge>
                )}
              </div>
              
              <div className={cn(
                "p-4 rounded-xl",
                statusConfig.bgClass
              )}>
                <p className="text-sm text-muted-foreground mb-1">Date de fin</p>
                <p className="font-semibold text-lg">{formatShortDate(leave.end_date)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(leave.end_date).split(',')[0]}
                </p>
                {leave.end_half_day && (
                  <Badge variant="outline" className="mt-2 text-xs">Demi-journée</Badge>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">Durée totale</span>
              </div>
              <span className="font-bold text-xl">
                {leave.total_days} jour{leave.total_days > 1 ? 's' : ''}
              </span>
            </div>
          </Card>

          {/* Reason Card */}
          {leave.reason && (
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                Motif
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {leave.reason}
              </p>
            </Card>
          )}

          {/* Attachment */}
          {leave.attachment_url && (
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Pièce jointe
              </h2>
              <Button variant="outline" asChild>
                <a href={leave.attachment_url} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4 mr-2" />
                  Télécharger le document
                </a>
              </Button>
            </Card>
          )}

          {/* Approval Notes */}
          {leave.approval_notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                Notes d'approbation
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {leave.approval_notes}
              </p>
              {leave.approver_name && (
                <p className="text-sm text-muted-foreground mt-4">
                  Par {leave.approver_name}
                  {leave.approval_date && ` le ${formatShortDate(leave.approval_date)}`}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Info */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <User className="size-5 text-primary" />
              Demandeur
            </h2>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {leave.employee_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <div>
                <p className="font-medium">{leave.employee_name || 'Non spécifié'}</p>
                <p className="text-sm text-muted-foreground">Employé</p>
              </div>
            </div>
          </Card>

          {/* Leave Type */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Type de congé
            </h2>
            <div className="flex items-center gap-3">
              <div 
                className="size-4 rounded-full"
                style={{ backgroundColor: leave.leave_type_color || '#6B7280' }}
              />
              <span className="font-medium">{leave.leave_type_name || 'Non spécifié'}</span>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Historique</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Demande créée</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(leave.created_at)}
                  </p>
                </div>
              </div>
              
              {leave.status !== 'pending' && (
                <div className="flex gap-3">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center",
                    leave.status === 'approved' 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-red-100 dark:bg-red-900/30"
                  )}>
                    <StatusIcon className={cn(
                      "size-4",
                      leave.status === 'approved'
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {leave.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leave.approval_date 
                        ? formatDate(leave.approval_date)
                        : formatDate(leave.updated_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Download PDF */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Document</h2>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handlePreviewPDF}
            >
              <FileDown className="size-4 mr-2" />
              Aperçu PDF
            </Button>
          </Card>

          {/* Actions */}
          {isPending && (
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">Actions</h2>
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'approve' ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  Approuver
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading !== null}
                >
                  <XCircle className="size-4 mr-2" />
                  Rejeter
                </Button>
                <Button 
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="size-4 mr-2" />
                  )}
                  Supprimer
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Rejeter la demande</h2>
            <p className="text-muted-foreground mb-4">
              Voulez-vous ajouter un commentaire pour expliquer le rejet ?
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Motif du rejet (optionnel)"
              className="w-full p-3 border rounded-lg mb-4 min-h-[100px] resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNotes('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50"
                onClick={handleReject}
                disabled={actionLoading === 'reject'}
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="size-4 mr-2" />
                )}
                Confirmer le rejet
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={closePdfPreview}
        title={`Demande de congé - ${leave?.employee_name || ''}`}
        pdfUrl={pdfPreview.pdfUrl}
        filename={`Conge_${leave?.employee_name?.replace(/\s+/g, '_') || 'demande'}.pdf`}
      />
    </div>
  );
}
