"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Alert, Button, Card, Form, Badge } from "@/components/ui";
import {
  FormTextareaField,
} from "@/components/ui/form-fields";
import { createLeaveRequest, getLeaveBalances } from "@/lib/services/hr/leave.service";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import { getCurrentEmployee } from "@/lib/services/hr/employee.service";
import type { LeaveType, LeaveBalance, Employee } from "@/lib/types/hr";
import { ApiError } from "@/lib/api/client";
import { formatLeaveDays, formatLeaveDaysWithLabel } from "@/lib/utils/leave";
import {
  HiOutlineCalendar,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { useUser } from "@/lib/hooks";
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineStar } from "react-icons/hi2";

// Use react-day-picker for improved UX on range
import { DayPicker } from "react-day-picker";
import { fr } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Maximize } from "lucide-react";

// Zod + RHF schema as before
const leaveRequestSchema = z
  .object({
    leave_type: z.string().min(1, "Le type de congé est requis"),
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
  );

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema> & {
  // legacy for type (not stored but will exist virtually)
  start_date?: string;
  end_date?: string;
};

function LeaveTypeSelector({
  leaveTypes,
  // leaveBalances,
  selected,
  onSelect,
}: {
  leaveTypes: LeaveType[];
  // leaveBalances: LeaveBalance[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {leaveTypes.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            Aucun type de congé disponible.
          </div>
        )}
        {leaveTypes.map((type) => {
          // const balance = leaveBalances.find((b) => b.leave_type === type.id);
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              className={[
                "relative group rounded-xl border shadow transition-all px-4 py-4 text-left bg-background text-foreground",
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "hover:ring-2 hover:ring-primary/40 border-muted"
              ].join(" ")}
              aria-pressed={isSelected}
              onClick={() => onSelect(type.id)}
              tabIndex={0}
              data-testid={`leave-type-${type.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isSelected ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/80 p-1 text-white text-xs">
                    <HiOutlineCheckCircle className="size-4" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full p-1">
                    <HiOutlineUserGroup className="size-4 text-muted-foreground" />
                  </span>
                )}
                <span className="font-semibold text-primary">{type.name}</span>
              </div>
              {type.description && (
                <div className="text-xs text-muted-foreground mb-2">
                  {type.description}
                </div>
              )}
              {isSelected && (
                <span className="absolute top-2 right-2 rounded-full bg-primary/90 text-white px-2 py-0.5 text-xs">
                  Sélectionné
                </span>
              )}
            </button>
          );
        })}
      </div>
      {leaveTypes.length > 0 && (
        <input type="hidden" name="leave_type" value={selected} readOnly />
      )}
      {!selected && (
        <div className="text-sm text-destructive mt-2 ml-1">
          Merci de sélectionner un type de congé.
        </div>
      )}
    </div>
  );
}

export default function CreateLeaveRequestPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  // const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const user = useUser();

  // useForm with react-hook-form + Zod
  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: "",
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

  // Date Picker: help focusing opening on click
  const calendarRef = useRef<HTMLDivElement>(null);

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

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      if (!user || !user.id) {
        setError("Impossible de charger vos informations d'employé. Contactez l'administrateur.");
        setLoadingData(false);
        return;
      }

      const employee = await getCurrentEmployee();

      const currentYear = new Date().getFullYear();
      // const balances = await getLeaveBalances({
      //   employee: employee.id,
      //   year: currentYear,
      // });
      // setLeaveBalances(balances);

      const types = await getLeaveTypes({ is_active: true });
      setLeaveTypes(types);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors du chargement des données");
      }
    } finally {
      setLoadingData(false);
    }
  };

  // date: Date objects expected
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

  // const getLeaveBalance = (): LeaveBalance | null => {
  //   if (!selectedLeaveType || !Array.isArray(leaveBalances)) return null;
  //   return (
  //     leaveBalances.find(
  //       (balance) => balance.leave_type === selectedLeaveType
  //     ) || null
  //   );
  // };

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

      // Convert to yyyy-mm-dd
      const formatDate = (d: Date) =>
        d.toISOString().split("T")[0];

      const requestData: any = {
        leave_type: data.leave_type,
        start_date: formatDate(data.period.from),
        end_date: formatDate(data.period.to),
        start_half_day: data.start_half_day,
        end_half_day: data.end_half_day,
        total_days: totalDays,
        reason: data.reason,
        employee: user?.id,
      };

      await createLeaveRequest(requestData);

      router.push(`/apps/${slug}/hr/leaves`);
    } catch (err: any) {
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
      } else {
        setError(err?.message || "Erreur lors de la création de la demande");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (
    user &&
    (
      user.user_type === "admin"
    )
  ) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center">
        <Card className="p-8 max-w-lg w-full shadow-md border-0">
          <div className="flex flex-col items-center gap-4 text-center">
            <HiOutlineInformationCircle className="size-12 text-destructive" />
            <h2 className="text-2xl font-bold text-foreground">
              Accès réservé
            </h2>
            <p className="text-lg text-muted-foreground">
              En tant que <span className="font-bold text-primary">
                {user.user_type === "admin"
                  ? "administrateur"
                  : "propriétaire"
                }
              </span>, vous ne pouvez pas demander de congés.
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
  // const leaveBalance = getLeaveBalance();

  // For calendar display format
  const dayjsFormat = (d?: Date) =>
    d && !isNaN(d.getTime()) ? d.toLocaleDateString("fr-FR") : "";

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
            Créez une nouvelle demande de congé
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Sélectionneur de type de congé amélioré */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Type de congé</h2>
            <LeaveTypeSelector
              leaveTypes={leaveTypes}
              // leaveBalances={leaveBalances}
              selected={selectedLeaveType}
              onSelect={onSelectLeaveType}
            />
          </Card>

          {leaveTypeDetails && (
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-start gap-3">
                <HiOutlineInformationCircle className="size-5 text-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900">
                    {leaveTypeDetails.name}
                  </h3>
                  {leaveTypeDetails.description && (
                    <p className="text-sm text-blue-700 mt-1">
                      {leaveTypeDetails.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Période</h2>
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
                      onSelect={(range) => {
                        // DayPicker passes undefined if empty
                        if (range) field.onChange(range);
                      }}
                      locale={fr}
                      showOutsideDays
                      numberOfMonths={2}
                      modifiersClassNames={{
                        selected: "bg-primary text-white",
                        range_start: "bg-primary text-primary",
                        range_end: "bg-primary text-white",
                        range_middle: "bg-primary/30 text-primary",
                        today: "border border-primary",
                      }}
                      className="mx-auto"
                    />
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Date de début</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {dayjsFormat(field.value?.from) || "—"}
                          </span>
                          {field.value?.from && (
                            <input
                              type="hidden"
                              value={field.value?.from?.toISOString().split("T")[0]}
                              name="start_date"
                              // fake legacy for native forms
                              readOnly
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
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
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Date de fin</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {dayjsFormat(field.value?.to) || "—"}
                          </span>
                          {field.value?.to && (
                            <input
                              type="hidden"
                              value={field.value?.to?.toISOString().split("T")[0]}
                              name="end_date"
                              readOnly
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
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
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Durée totale:{" "}
                  <span className="text-primary">
                    {formatLeaveDaysWithLabel(calculatedDays)} ouvrables
                  </span>
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Motif (optionnel)</h2>
            <FormTextareaField
              name="reason"
              label="Motif de la demande"
              placeholder="Expliquez brièvement le motif de votre demande..."
              rows={4}
            />
          </Card>

          {/* {leaveBalance && selectedLeaveType && (
            <Card className="p-4 border-0 shadow-sm bg-muted">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total alloué</p>
                  <p className="text-lg font-semibold">{formatLeaveDays(leaveBalance.total_days)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Utilisé</p>
                  <p className="text-lg font-semibold text-red-600">{formatLeaveDays(leaveBalance.used_days)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-lg font-semibold text-orange-600">{formatLeaveDays(leaveBalance.pending_days)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disponible</p>
                  <p className="text-lg font-semibold text-green-600">{formatLeaveDays(leaveBalance.available_days)}</p>
                </div>
              </div>
            </Card>
          )} */}

          {/* {leaveBalance && calculatedDays > leaveBalance.available_days && (
            <Alert variant="warning">
              <HiOutlineInformationCircle className="size-4" />
              <span>
                Attention : Cette demande dépasse votre solde disponible (
                {formatLeaveDaysWithLabel(leaveBalance.available_days)} restants).
              </span>
            </Alert>
          )} */}

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>Annuler</Link>
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                calculatedDays === 0 ||
                !selectedLeaveType ||
                leaveTypes.length === 0
              }
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
