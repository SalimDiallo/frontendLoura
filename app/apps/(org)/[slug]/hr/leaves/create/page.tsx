"use client";

import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormTextareaField,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useUser } from "@/lib/hooks";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import { createLeaveRequest, getLeaveRequests, getMyLeaveBalances } from "@/lib/services/hr/leave.service";
import type { LeaveBalance, LeaveRequest, LeaveRequestCreate, LeaveType } from "@/lib/types/hr";
import { formatLeaveDaysWithLabel } from "@/lib/utils/leave";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineUserGroup,
  HiOutlineXMark,
} from "react-icons/hi2";
import * as z from "zod";

// Use react-day-picker for improved UX on range
import { eachDayOfInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// =================================================================================
// ZOD SCHEMA
// =================================================================================

const leaveRequestSchema = z
  .object({
    leave_type: z.string().optional(),
    title: z.string().optional(),
    period: z.object({
      from: z.date({ message: "Date de début requise" }),
      to: z.date({ message: "Date de fin requise" }),
    }),
    start_half_day: z.boolean().optional(),
    end_half_day: z.boolean().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.period?.from || !data.period?.to) return false;
      return data.period.to >= data.period.from;
    },
    {
      message: "La date de fin doit être supérieure ou égale à la date de début",
      path: ["period", "to"],
    }
  )
  .refine(
    (data) => {
      // If no leave_type selected, title is required
      if (!data.leave_type) {
        return !!data.title?.trim();
      }
      return true;
    },
    {
      message: "Le titre est obligatoire si aucun type de congé n'est sélectionné",
      path: ["title"],
    }
  );

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

// =================================================================================
// LEAVE TYPE SELECTOR
// =================================================================================

function LeaveTypeSelector({
  leaveTypes,
  selected,
  onSelect,
}: {
  leaveTypes: LeaveType[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {leaveTypes.map((type) => {
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              className={[
                "relative group rounded-xl border-2 transition-all px-4 py-4 text-left",
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/40 border-muted bg-background hover:bg-muted/30",
              ].join(" ")}
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? "" : type.id)}
              tabIndex={0}
              data-testid={`leave-type-${type.id}`}
            >
              {/* Color indicator */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="inline-block size-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
                  style={{
                    backgroundColor: type.color || "#3B82F6",
                  }}
                />
                {isSelected ? (
                  <HiOutlineCheckCircle className="size-4 text-primary" />
                ) : (
                  <HiOutlineUserGroup className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {type.name}
                </span>
              </div>
              {type.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 ml-[22px]">
                  {type.description}
                </p>
              )}
              {isSelected && (
                <span className="absolute top-2 right-2 rounded-full bg-primary text-white px-2 py-0.5 text-[10px] font-medium">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {leaveTypes.length === 0 && (
        <div className="text-center py-6">
          <HiOutlineCalendar className="size-10 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aucun type de congé disponible — renseignez un titre à la place
          </p>
        </div>
      )}
    </div>
  );
}

// =================================================================================
// MAIN PAGE
// =================================================================================

export default function CreateLeaveRequestPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [existingRequests, setExistingRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const user = useUser();

  // Helper: normalize date to midnight (00:00:00) for accurate comparison
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Today at midnight (for disabling past dates)
  const today = normalizeDate(new Date());

  // Build the list of disabled dates from existing pending/approved requests
  const disabledDates = (() => {
    const dates: Date[] = [];

    console.log('🔍 Building disabled dates from', existingRequests.length, 'requests');

    for (const req of existingRequests) {
      console.log('🔍 Processing request:', req.id, 'Status:', req.status, 'Dates:', req.start_date, '-', req.end_date);

      // Only include pending or approved requests
      if (req.status !== 'pending' && req.status !== 'approved') {
        console.log('⏭️  Skipping request (status not pending/approved)');
        continue;
      }

      try {
        const start = parseISO(req.start_date);
        const end = parseISO(req.end_date);

        console.log('🔍 Parsed dates:', start, '-', end);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const interval = eachDayOfInterval({ start, end });
          console.log('📅 Generated interval:', interval.length, 'days');

          // Normalize each date to midnight for consistent comparison
          const normalizedInterval = interval.map(normalizeDate);
          dates.push(...normalizedInterval);
        } else {
          console.log('❌ Invalid dates after parsing');
        }
      } catch (error) {
        console.log('❌ Error parsing dates:', error);
      }
    }

    console.log('✅ Total disabled dates:', dates.length);
    console.log('📅 Sample disabled dates:', dates.slice(0, 3));

    return dates;
  })();

  // useForm with react-hook-form + Zod
  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: "",
      title: "",
      period: {
        from: undefined,
        to: undefined,
      },
      start_half_day: false,
      end_half_day: false,
      reason: "",
    },
  });

  const selectedLeaveType = form.watch("leave_type");
  const period = form.watch("period");
  const startHalfDay = form.watch("start_half_day");
  const endHalfDay = form.watch("end_half_day");
  const titleValue = form.watch("title");

  const calendarRef = useRef<HTMLDivElement>(null);

  // Whether a leave type is selected
  const hasLeaveType = !!selectedLeaveType;
  // Whether title is required (no leave type selected)
  const titleRequired = !hasLeaveType;

  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (period?.from && period?.to) {
      const days = calculateBusinessDays(
        period.from,
        period.to,
        startHalfDay,
        endHalfDay
      );
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [period, startHalfDay, endHalfDay]);

  // Clear title validation errors when leave type changes
  useEffect(() => {
    if (hasLeaveType) {
      form.clearErrors("title");
    }
  }, [hasLeaveType, form]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      if (!user || !user.id) {
        setError("Impossible de charger vos informations d'employé. Contactez l'administrateur.");
        setLoadingData(false);
        return;
      }

      // Fetch leave types, existing requests, and balances in parallel
      const currentYear = new Date().getFullYear();


      // For employees, fetch their own requests
      // For admins, we need a different approach since they don't have employee records
      const requestParams = user.user_type === 'employee'
        ? { employee: user.id, page_size: 200 }
        : { page_size: 200, organization_subdomain: slug };

      console.log('🔍 Fetching requests with params:', requestParams);

      const [types, pendingRes, approvedRes, balances] = await Promise.all([
        getLeaveTypes({ is_active: true }),
        getLeaveRequests({ ...requestParams, status: "pending" }),
        getLeaveRequests({ ...requestParams, status: "approved" }),
        getMyLeaveBalances(currentYear),
      ]);

      setLeaveTypes(types);
      setLeaveBalances(balances);

      console.log('🔍 API Response - Pending:', pendingRes);
      console.log('🔍 API Response - Approved:', approvedRes);

      // Combine pending + approved requests
      const allRequests = [
        ...(pendingRes?.results || []),
        ...(approvedRes?.results || []),
      ];

      console.log('🔍 DEBUG: Loaded requests:', {
        pending: pendingRes?.results?.length || 0,
        approved: approvedRes?.results?.length || 0,
        total: allRequests.length,
        sampleRequest: allRequests[0],
        allRequests: allRequests
      });

      setExistingRequests(allRequests);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors du chargement des données");
      }
    } finally {
      setLoadingData(false);
    }
  };

  const calculateBusinessDays = (
    start: Date,
    end: Date,
    halfStart: boolean = false,
    halfEnd: boolean = false
  ): number => {
    if (!(start instanceof Date) || !(end instanceof Date)) return 0;
    const s = new Date(start);
    const e = new Date(end);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

    let count = 0;
    const current = new Date(s);
    while (current <= e) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    if (halfStart) count -= 0.5;
    if (halfEnd) count -= 0.5;
    return Math.max(0, count);
  };

  const getSelectedLeaveTypeDetails = (): LeaveType | null => {
    return leaveTypes.find(type => type.id === selectedLeaveType) || null;
  };

  const onSelectLeaveType = (typeId: string) => {
    form.setValue("leave_type", typeId, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: LeaveRequestFormData) => {
    try {
      setLoading(true);
      setError(null);

      const totalDays = calculateBusinessDays(
        data.period.from,
        data.period.to,
        data.start_half_day,
        data.end_half_day
      );

      const formatDate = (d: Date) =>
        d.toISOString().split("T")[0];

      const requestData: LeaveRequestCreate = {
        leave_type: data.leave_type || undefined,
        title: data.title || "",
        start_date: formatDate(data.period.from),
        end_date: formatDate(data.period.to),
        start_half_day: data.start_half_day,
        end_half_day: data.end_half_day,
        total_days: totalDays,
        reason: data.reason,
      };

      await createLeaveRequest(requestData);

      router.push(`/apps/${slug}/hr/leaves/history`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.data && typeof err.data === "object") {
          const errorMessages = Object.entries(err.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(", ")}`;
              }
              return `${field}: ${messages}`;
            })
            .join("\n");
          setError(errorMessages || err.message);
        } else {
          setError(`${err.message} (Status: ${err.status})`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la création de la demande");
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Admin cannot request leaves
  if (user && user.user_type === "admin") {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center">
        <Card className="p-8 max-w-lg w-full shadow-md border-0">
          <div className="flex flex-col items-center gap-4 text-center">
            <HiOutlineInformationCircle className="size-12 text-destructive" />
            <h2 className="text-2xl font-bold text-foreground">
              Accès réservé
            </h2>
            <p className="text-lg text-muted-foreground">
              En tant que <span className="font-bold text-primary">administrateur</span>,
              vous ne pouvez pas demander de congés.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href={`/apps/${slug}/hr/leaves`}>
                Retour à la liste des congés
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const leaveTypeDetails = getSelectedLeaveTypeDetails();

  const dayjsFormat = (d?: Date) =>
    d && !isNaN(d.getTime()) ? d.toLocaleDateString("fr-FR") : "";

  // Vérifier si le solde est insuffisant (solde global)
  const hasInsufficientBalance = (() => {
    if (!calculatedDays || calculatedDays === 0) {
      return false;
    }
    const currentYear = new Date().getFullYear();
    const balance = leaveBalances.find(b => b.year === currentYear);
    if (!balance) {
      return false; // Pas de solde configuré = pas de limite
    }
    const remainingDaysNum = Math.max(0, Number(balance.remaining_days));
    return remainingDaysNum < calculatedDays;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineCalendar className="size-7" />
              Nouvelle demande de congé
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Remplissez les informations pour créer votre demande
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="flex items-start justify-between">
          <span className="whitespace-pre-line">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ─── Step 1: Leave Type (optional) ─── */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
                Type de congé
                <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
              </h2>
              {hasLeaveType && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onSelectLeaveType("")}
                >
                  <HiOutlineXMark className="size-4 mr-1" />
                  Désélectionner
                </Button>
              )}
            </div>
            <LeaveTypeSelector
              leaveTypes={leaveTypes}
              selected={selectedLeaveType || ""}
              onSelect={onSelectLeaveType}
            />
            {!hasLeaveType && leaveTypes.length > 0 && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HiOutlineInformationCircle className="size-4 shrink-0" />
                  Vous pouvez sélectionner un type ci-dessus, ou simplement renseigner un titre à l&apos;étape suivante.
                </p>
              </div>
            )}
          </Card>

          {/* Leave type details banner */}
          {leaveTypeDetails && (
            <Card className="p-4 border-0 shadow-sm bg-muted/40">
              <div className="flex items-start gap-3">
                <span
                  className="inline-block size-4 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: leaveTypeDetails.color }}
                />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">
                    {leaveTypeDetails.name}
                  </h3>
                  {leaveTypeDetails.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {leaveTypeDetails.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {leaveTypeDetails.is_paid && (
                      <span className="text-xs text-green-600 font-medium">✓ Congé payé</span>
                    )}
                    {!leaveTypeDetails.is_paid && (
                      <span className="text-xs text-muted-foreground">Non payé</span>
                    )}
                    {leaveTypeDetails.max_consecutive_days && (
                      <span className="text-xs text-muted-foreground">
                        Max {leaveTypeDetails.max_consecutive_days} jours consécutifs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Leave balance info - Global balance (all leave types combined) */}
          {leaveBalances.length > 0 && (() => {
            // Get balance for current year (global balance)
            const currentYear = new Date().getFullYear();
            const balance = leaveBalances.find(b => b.year === currentYear);
            if (!balance) return null;

            const remainingDaysNum = Math.max(0, Number(balance.remaining_days));
            const hasEnough = calculatedDays === 0 || remainingDaysNum >= calculatedDays;
            const isLow = remainingDaysNum <= 5 && remainingDaysNum > 0;

            return (
              <Card className={`p-4 border-0 shadow-sm ${hasEnough ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-start gap-3">
                  <HiOutlineInformationCircle className={`size-5 shrink-0 mt-0.5 ${hasEnough ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">Solde de congés {currentYear} (tous types confondus)</h3>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Alloués</span>
                        <span className="text-sm font-bold">{balance.allocated_days} j</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Utilisés</span>
                        <span className="text-sm font-bold">{balance.used_days} j</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">En attente</span>
                        <span className="text-sm font-bold">{balance.pending_days} j</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Restants</span>
                        <span className={`text-sm font-bold ${isLow ? 'text-orange-600' : hasEnough ? 'text-green-600' : 'text-red-600'}`}>
                          {remainingDaysNum} j
                        </span>
                      </div>
                    </div>
                    {calculatedDays > 0 && !hasEnough && (
                      <p className="mt-2 text-xs text-red-600 font-medium">
                        ⚠️ Vous demandez {calculatedDays} jour{calculatedDays > 1 ? 's' : ''} mais vous n'avez que {remainingDaysNum} jour{remainingDaysNum > 1 ? 's' : ''} disponible{remainingDaysNum > 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* ─── Step 2: Title ─── */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold">2</span>
              Titre de la demande
              {titleRequired ? (
                <span className="text-xs text-destructive font-medium">*obligatoire</span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
              )}
            </h2>
            <Input
              {...form.register("title")}
              placeholder={
                titleRequired
                  ? "Ex: Vacances familiales, Formation, Rendez-vous médical..."
                  : "Ex: Vacances familiales (optionnel si un type est sélectionné)"
              }
              className={`text-sm ${form.formState.errors.title ? "border-destructive" : ""}`}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1.5">
                {form.formState.errors.title.message}
              </p>
            )}
            {titleRequired && !titleValue?.trim() && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Un titre est requis car aucun type de congé n&apos;est sélectionné
              </p>
            )}
          </Card>

          {/* ─── Step 3: Period ─── */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold">3</span>
              Période
            </h2>
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <Controller
                control={form.control}
                name="period"
                render={({ field }) => (
                  <div ref={calendarRef} className="flex flex-col items-center md:items-start gap-2 w-full">
                    <label className="font-medium text-sm mb-1 w-full">
                      Sélectionnez la période de congé
                    </label>
                    <DayPicker
                      mode="range"
                      selected={field.value}
                      onSelect={(range:any) => {
                        if (range) field.onChange(range);
                      }}
                      locale={fr}
                      showOutsideDays
                      numberOfMonths={2}
                      disabled={[
                        { before: today },
                        ...disabledDates,
                      ]}
                      modifiers={{
                        booked: disabledDates,
                      }}
                      modifiersClassNames={{
                        selected: "bg-primary text-white",
                        range_start: "bg-primary text-primary",
                        range_end: "bg-primary text-white",
                        range_middle: "bg-primary/30 text-primary",
                        today: "border border-primary",
                        booked:
                          "!bg-red-100 !text-red-400 line-through dark:!bg-red-900/30 dark:!text-red-400",
                      }}
                      className="mx-auto"
                    />
                    {disabledDates.length > 0 && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block size-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800" />
                          Jours déjà couverts par une demande (en attente ou approuvée)
                        </span>
                      </div>
                    )}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex flex-col p-3 rounded-lg bg-muted/50">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date de début</span>
                        <span className="font-semibold text-sm mt-1">
                          {dayjsFormat(field.value?.from) || "—"}
                        </span>
                        {field.value?.from && (
                          <input
                            type="hidden"
                            value={field.value.from.toISOString().split("T")[0]}
                            name="start_date"
                            readOnly
                          />
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="start_half_day"
                            {...form.register("start_half_day")}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="start_half_day" className="text-sm text-muted-foreground">
                            Demi-journée
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col p-3 rounded-lg bg-muted/50">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date de fin</span>
                        <span className="font-semibold text-sm mt-1">
                          {dayjsFormat(field.value?.to) || "—"}
                        </span>
                        {field.value?.to && (
                          <input
                            type="hidden"
                            value={field.value.to.toISOString().split("T")[0]}
                            name="end_date"
                            readOnly
                          />
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="end_half_day"
                            {...form.register("end_half_day")}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="end_half_day" className="text-sm text-muted-foreground">
                            Demi-journée
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      {form.formState.errors["period"]?.from && (
                        <span className="text-xs text-destructive">{form.formState.errors["period"]?.from.message}</span>
                      )}
                      {form.formState.errors["period"]?.to && (
                        <span className="text-xs text-destructive">{form.formState.errors["period"]?.to.message}</span>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
            {calculatedDays > 0 && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                <HiOutlineCalendar className="size-5 text-primary shrink-0" />
                <p className="text-sm font-medium">
                  Durée totale :{" "}
                  <span className="text-primary font-bold">
                    {formatLeaveDaysWithLabel(calculatedDays)} ouvrables
                  </span>
                </p>
              </div>
            )}
          </Card>

          {/* ─── Step 4: Reason ─── */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold">4</span>
              Motif
              <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
            </h2>
            <FormTextareaField
              name="reason"
              label="Motif de la demande"
              placeholder="Expliquez brièvement le motif de votre demande..."
              rows={4}
            />
          </Card>

          {/* ─── Submit ─── */}
          {hasInsufficientBalance && (
            <Alert variant="error" className="animate-in fade-in">
              <div className="flex items-start gap-3">
                <HiOutlineXMark className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Solde insuffisant</p>
                  <p className="text-sm mt-0.5">
                    Vous ne pouvez pas soumettre cette demande car vous n'avez pas assez de jours disponibles.
                    Veuillez réduire la durée ou contacter votre administrateur.
                  </p>
                </div>
              </div>
            </Alert>
          )}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>Annuler</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading || calculatedDays === 0 || hasInsufficientBalance}
            >
              {loading ? (
                <>Création en cours...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Créer la demande
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
