"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Alert, Button, Card, Form, Badge } from "@/components/ui";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form-fields";
import { createLeaveRequest, getLeaveBalances } from "@/lib/services/hr/leave.service";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import { getCurrentEmployee, getEmployees } from "@/lib/services/hr/employee.service";
import type { LeaveType, LeaveBalance, Employee, EmployeeListItem } from "@/lib/types/hr";
import { ApiError } from "@/lib/api/client";
import { tokenManager } from "@/lib/api/client";
import { formatLeaveDays, formatLeaveDaysWithLabel } from "@/lib/utils/leave";
import {
  HiOutlineCalendar,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

// Schéma de validation
const leaveRequestSchema = z
  .object({
    employee: z.string().optional(), // For AdminUser creating request for employee
    leave_type: z.string().min(1, "Le type de congé est requis"),
    start_date: z.string().min(1, "La date de début est requise"),
    end_date: z.string().min(1, "La date de fin est requise"),
    start_half_day: z.boolean().optional(),
    end_half_day: z.boolean().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "La date de fin doit être supérieure ou égale à la date de début",
      path: ["end_date"],
    }
  );

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export default function CreateLeaveRequestPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employee: "",
      leave_type: "",
      start_date: "",
      end_date: "",
      start_half_day: false,
      end_half_day: false,
      reason: "",
    },
  });

  const selectedEmployee = form.watch("employee");
  const selectedLeaveType = form.watch("leave_type");
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const startHalfDay = form.watch("start_half_day");
  const endHalfDay = form.watch("end_half_day");

  useEffect(() => {
    loadFormData();
  }, []);

  // Calcul des jours lorsqu'une date change
  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateBusinessDays(
        startDate,
        endDate,
        startHalfDay,
        endHalfDay
      );
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate, startHalfDay, endHalfDay]);

  // Charger les balances lorsqu'un employé est sélectionné (AdminUser)
  useEffect(() => {
    if (isAdminUser && selectedEmployee) {
      loadEmployeeBalances(selectedEmployee);
    }
  }, [selectedEmployee, isAdminUser]);

  const loadEmployeeBalances = async (employeeId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      console.log("Loading balances for employee:", employeeId, "year:", currentYear);
      const balances = await getLeaveBalances({
        employee: employeeId,
        year: currentYear
      });
      console.log("Balances loaded:", balances);
      console.log("Is array?", Array.isArray(balances));
      setLeaveBalances(balances);
    } catch (err) {
      console.error("Erreur lors du chargement des soldes:", err);
      setLeaveBalances([]);
    }
  };

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Vérifier le type d'utilisateur (Employee ou AdminUser)
      const user = tokenManager.getUser();
      const isAdmin = user && !user.employee_id; // AdminUser n'a pas d'employee_id
      setIsAdminUser(isAdmin);

      if (isAdmin) {
        // Si AdminUser, charger la liste des employés
        const employeesList = await getEmployees(slug);
        setEmployees(employeesList.results || []);
      } else {
        // Si Employee, charger ses informations
        try {
          const employee = await getCurrentEmployee();
          setCurrentEmployee(employee);

          // Charger les soldes de congé de l'employé pour l'année en cours
          const currentYear = new Date().getFullYear();
          console.log("Loading balances for current employee:", employee.id);
          const balances = await getLeaveBalances({
            employee: employee.id,
            year: currentYear
          });
          console.log("Balances loaded:", balances);
          console.log("Is array?", Array.isArray(balances));
          setLeaveBalances(balances);

          // Pré-remplir l'employé dans le formulaire
          form.setValue("employee", employee.id);
        } catch (empErr) {
          console.error("Erreur lors du chargement de l'employé:", empErr);
          // Peut-être que c'est un AdminUser sans compte Employee
          setIsAdminUser(true);
          const employeesList = await getEmployees(slug);
          setEmployees(employeesList.results || []);
        }
      }

      // Charger les types de congé actifs
      const types = await getLeaveTypes({ is_active: true });
      setLeaveTypes(types);

    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
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
    start: string,
    end: string,
    halfStart: boolean = false,
    halfEnd: boolean = false
  ): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Sauter les weekends (samedi = 6, dimanche = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Ajuster pour les demi-journées
    if (halfStart) count -= 0.5;
    if (halfEnd) count -= 0.5;

    return Math.max(0, count);
  };

  const getSelectedLeaveTypeDetails = (): LeaveType | null => {
    return leaveTypes.find(type => type.id === selectedLeaveType) || null;
  };

  const getLeaveBalance = (): LeaveBalance | null => {
    if (!selectedLeaveType || !Array.isArray(leaveBalances)) return null;
    return (
      leaveBalances.find(
        (balance) => balance.leave_type === selectedLeaveType
      ) || null
    );
  };

  const onSubmit = async (data: LeaveRequestFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Calculer le total de jours
      const totalDays = calculateBusinessDays(
        data.start_date,
        data.end_date,
        data.start_half_day,
        data.end_half_day
      );

      const requestData: any = {
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        start_half_day: data.start_half_day,
        end_half_day: data.end_half_day,
        total_days: totalDays,
        reason: data.reason,
      };

      // Si AdminUser, inclure l'employé
      if (isAdminUser && data.employee) {
        requestData.employee = data.employee;
      }

      console.log("=== DONNÉES ENVOYÉES ===");
      console.log("Is Admin User:", isAdminUser);
      console.log("Request Data:", JSON.stringify(requestData, null, 2));
      console.log("========================");

      await createLeaveRequest(requestData);

      router.push(`/apps/${slug}/hr/leaves`);
    } catch (err: any) {
      console.error("=== ERREUR CRÉATION CONGÉ ===");
      console.error("Error object:", err);
      console.error("Error data:", err.data);
      console.error("Error status:", err.status);
      console.error("Error message:", err.message);
      console.error("==============================");

      if (err instanceof ApiError) {
        // Format backend errors more clearly
        if (err.data && typeof err.data === 'object') {
          console.log("Error details:", JSON.stringify(err.data, null, 2));
          const errorMessages = Object.entries(err.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
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

  const leaveTypeDetails = getSelectedLeaveTypeDetails();
  const leaveBalance = getLeaveBalance();

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

      {/* Info Card */}
      {leaveTypeDetails && (
        <Card className="p-4 border-0 shadow-sm bg-blue-50">
          <div className="flex items-start gap-3">
            <HiOutlineInformationCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Selection (AdminUser only) */}
          {isAdminUser && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Employé</h2>
              <FormSelectField
                name="employee"
                label="Employé"
                placeholder="Sélectionnez un employé"
                required
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: emp.full_name || emp.email,
                }))}
              />
            </Card>
          )}

          {/* Leave Type Selection */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Type de congé</h2>
            <FormSelectField
              name="leave_type"
              label="Type de congé"
              placeholder="Sélectionnez un type de congé"
              required
              options={leaveTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
            />
          </Card>

          {/* Dates */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Période</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormInputField
                  name="start_date"
                  label="Date de début"
                  type="date"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="start_half_day"
                    {...form.register("start_half_day")}
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="start_half_day"
                    className="text-sm text-muted-foreground"
                  >
                    Demi-journée
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <FormInputField
                  name="end_date"
                  label="Date de fin"
                  type="date"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="end_half_day"
                    {...form.register("end_half_day")}
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="end_half_day"
                    className="text-sm text-muted-foreground"
                  >
                    Demi-journée
                  </label>
                </div>
              </div>
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

          {/* Reason */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Motif (optionnel)</h2>
            <FormTextareaField
              name="reason"
              label="Motif de la demande"
              placeholder="Expliquez brièvement le motif de votre demande..."
              rows={4}
            />
          </Card>

          {/* Leave Balance Display */}
          {leaveBalance && selectedLeaveType && (
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
          )}

          {/* Warning if exceeding balance */}
          {leaveBalance && calculatedDays > leaveBalance.available_days && (
            <Alert variant="warning">
              <HiOutlineInformationCircle className="size-4" />
              <span>
                Attention : Cette demande dépasse votre solde disponible (
                {formatLeaveDaysWithLabel(leaveBalance.available_days)} restants).
              </span>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>Annuler</Link>
            </Button>
            <Button type="submit" disabled={loading || calculatedDays === 0}>
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
