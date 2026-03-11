"use client";

import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DepartmentStats, HRStats } from "@/lib/types/hr";
import { cn } from "@/lib/utils";
import { Download, FileText, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────
function fmtCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
  return value.toLocaleString("fr-FR");
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ────────────────────────────────────────────────────────────
interface HRReportPDFProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: HRStats | null;
  departmentStats: DepartmentStats[];
  payrollTrend: any[];
  organizationSlug: string;
}

export function HRReportPDF({
  open,
  onOpenChange,
  stats,
  departmentStats,
  payrollTrend,
  organizationSlug,
}: HRReportPDFProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const generatePDF = useCallback(async () => {
    if (!reportRef.current) return;
    setGenerating(true);

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = reportRef.current;

      // Render the hidden report area to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false,
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = position - pageHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const filename = `rapport_rh_${organizationSlug}_${periodStart}_${periodEnd}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  }, [organizationSlug, periodStart, periodEnd]);

  // ─── Calculs ────────────────
  const statusData = stats
    ? [
        { name: "Actifs", value: stats.active_employees, fill: "#64808a" },
        { name: "En congé", value: stats.on_leave_employees, fill: "#adb0b5" },
        { name: "Inactifs", value: stats.inactive_employees, fill: "#d1d5db" },
      ].filter((d) => d.value > 0)
    : [];

  const deptData = departmentStats
    .sort((a, b) => b.employee_count - a.employee_count)
    .slice(0, 8)
    .map((d) => ({
      name: d.department.name.length > 20 ? d.department.name.substring(0, 20) + "…" : d.department.name,
      effectif: d.employee_count,
      actifs: d.active_count,
    }));

  const deptPayrollData = (stats?.department_payroll || []).slice(0, 8).map((d) => ({
    name: d.department_name.length > 20 ? d.department_name.substring(0, 20) + "…" : d.department_name,
    salaire: d.total_salary,
    pct: d.pct_of_total,
  }));

  // ─── UI ────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Rapport RH (PDF)
          </DialogTitle>
          <DialogDescription>
            Période à exporter&nbsp;:
          </DialogDescription>
        </DialogHeader>

        {/* Sélecteur de période */}
        <div className={cn("grid grid-cols-2 gap-4")}>
          <div>
            <label className={cn("text-xs font-medium text-muted-foreground mb-1 block")}>
              Début
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className={cn(
                "w-full rounded border px-3 py-2 text-sm bg-background",
                "focus:outline-none focus:ring-1 focus:ring-primary/20"
              )}
            />
          </div>
          <div>
            <label className={cn("text-xs font-medium text-muted-foreground mb-1 block")}>
              Fin
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className={cn(
                "w-full rounded border px-3 py-2 text-sm bg-background",
                "focus:outline-none focus:ring-1 focus:ring-primary/20"
              )}
            />
          </div>
        </div>

        {/* Bref Sommaire */}
        <div className={cn("border rounded p-4 bg-background text-sm space-y-2")}>
          <p className={cn("font-medium")}>Inclus :</p>
          <ul className={cn("space-y-1 text-muted-foreground text-xs ml-4 list-disc")}>
            <li>Résumé effectifs (total, actifs, inactifs, congés)</li>
            <li>Répartition par statut</li>
            <li>Evolution masse salariale (12 mois)</li>
            <li>Départements (effectifs &amp; salaires)</li>
            <li>Situation des contrats</li>
            <li>Turnover / présence</li>
            <li>Congés en attente</li>
            <li>Dernières embauches</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={generatePDF} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className={cn("size-4 mr-1 animate-spin")} />
                Génération...
              </>
            ) : (
              <>
                <Download className={cn("size-4 mr-1")} />
                Télécharger PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Hidden report area for PDF (sobre, minimaliste) */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "900px",
          zIndex: -1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={reportRef}
          style={{
            width: "900px",
            padding: "36px",
            backgroundColor: "#fff",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: "#18181b",
          }}
        >
          {/* En-tête du PDF */}
          <div style={{ borderBottom: "2px solid #ececec", paddingBottom: "18px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#18181b", margin: 0 }}>
                  Rapport RH
                </h1>
                <p style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
                  {organizationSlug.replace(/-/g, " ").toUpperCase()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", color: "#888" }}>Période</p>
                <p style={{ fontSize: "13px", fontWeight: 500 }}>
                  {new Date(periodStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  {" – "}
                  {new Date(periodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p style={{ fontSize: "10px", color: "#aaa", marginTop: "3px" }}>
                  Généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* Section Efffectifs */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: "0.2px" }}>
              Effectifs
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {[
                { label: "Total", value: stats?.total_employees ?? 0 },
                { label: "Actifs", value: stats?.active_employees ?? 0 },
                { label: "En congé", value: stats?.on_leave_employees ?? 0 },
                { label: "Inactifs", value: stats?.inactive_employees ?? 0 },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <p style={{ fontSize: "10px", color: "#858585", textTransform: "uppercase", margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "20px", fontWeight: 600, color: "#18181b", margin: "5px 0 0 0" }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs financiers */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: "0.2px" }}>
              Données salariales
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                {
                  label: "Masse salariale/mois",
                  value: `${fmtCurrency(stats?.total_contract_mass || stats?.total_payroll_this_month || 0)} GNF`,
                },
                {
                  label: "Salaire moyen",
                  value: `${fmtCurrency(stats?.avg_contract_salary || stats?.average_salary || 0)} GNF`,
                },
                {
                  label: "Variation mensuelle",
                  value: stats?.payroll_variation ? `${stats.payroll_variation > 0 ? "+" : ""}${stats.payroll_variation}%` : "—",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px"
                  }}
                >
                  <p style={{ fontSize: "10px", color: "#858585", textTransform: "uppercase", margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#18181b", margin: "5px 0 0 0" }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Courbe Masse salariale */}
          {payrollTrend.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: "0.2px" }}>
                Evolution masse salariale
              </h2>
              <div style={{ border: "1px solid #ececec", borderRadius: "8px", padding: "16px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={payrollTrend} margin={{ top: 8, right: 16, bottom: 0, left: 10 }}>
                    <defs>
                      <linearGradient id="pdfPayrollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#adb0b5" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#adb0b5" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#858585" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => v > 0 ? `${(v / 1_000_000).toFixed(1)}M` : "0"}
                      tick={{ fontSize: 10, fill: "#aaa" }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${fmtCurrency(value)} GNF`, "Masse salariale"]}
                      labelFormatter={(label) => {
                        const item = payrollTrend.find((p: any) => p.month === label);
                        return item?.fullMonth || label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      stroke="#858585"
                      strokeWidth={2}
                      fill="url(#pdfPayrollGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Distribution statuts (Pie) & Département (Bar) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "24px" }}>
            {/* Statuts */}
            <div style={{ border: "1px solid #ececec", borderRadius: "8px", padding: "14px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 500, color: "#18181b", marginBottom: "8px" }}>
                Statut
              </h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={46}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} employés`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: "center", color: "#bdbdbd", fontSize: "12px", padding: "28px 0" }}>
                  (aucune donnée)
                </p>
              )}
            </div>

            {/* Départements */}
            <div style={{ border: "1px solid #ececec", borderRadius: "8px", padding: "14px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 500, color: "#18181b", marginBottom: "8px" }}>
                Départements
              </h3>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={deptData} layout="vertical" margin={{ left: 6, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#bbb" }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 9, fill: "#888" }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip formatter={(value: number) => [`${value} employés`, "Effectif"]} />
                    <Bar dataKey="effectif" fill="#adb0b5" barSize={8} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: "center", color: "#bdbdbd", fontSize: "12px", padding: "28px 0" }}>
                  (aucune donnée)
                </p>
              )}
            </div>
          </div>

          {/* Département - Masse salariale */}
          {deptPayrollData.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: ".2px" }}>
                Masse salariale par département
              </h2>
              <div style={{ border: "1px solid #ececec", borderRadius: "8px", padding: "14px" }}>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={deptPayrollData} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: "#bbb" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => v > 0 ? `${(v / 1_000_000).toFixed(1)}M` : "0"}
                      tick={{ fontSize: 9, fill: "#bbb" }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip formatter={(value: number) => [`${fmtCurrency(value)} GNF`, "Salaires"]} />
                    <Bar dataKey="salaire" fill="#adb0b5" barSize={18} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Situation contrats */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: ".2px" }}>
              Contrats
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {[
                { label: "Nb.", value: stats?.total_contracts ?? 0 },
                { label: "Actifs", value: stats?.active_contracts ?? 0 },
                { label: "Exp. < 30j", value: stats?.expiring_contracts ?? 0 },
                { label: "~60j", value: stats?.contracts_warning_60d ?? 0 },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <p style={{ fontSize: "10px", color: "#858585", textTransform: "uppercase", margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: "4px 0 0 0" }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Contrats expirants */}
            {stats?.expiring_contracts_detail && stats.expiring_contracts_detail.length > 0 && (
              <div style={{ marginTop: "12px", border: "1px solid #ececec", borderRadius: "7px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", background: "#fcfcfc" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Employé</th>
                      <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Type</th>
                      <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Fin</th>
                      <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Jours restants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.expiring_contracts_detail.map((c) => (
                      <tr key={c.employee_id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                        <td style={{ padding: "7px 8px", fontWeight: 500 }}>{c.employee_name}</td>
                        <td style={{ padding: "7px 8px", color: "#868686" }}>{c.contract_type || "—"}</td>
                        <td style={{ padding: "7px 8px", color: "#868686" }}>{c.end_date ? fmtDate(c.end_date) : "—"}</td>
                        <td style={{
                          padding: "7px 8px",
                          textAlign: "right",
                          fontWeight: 500,
                          color: (c.days_remaining ?? 0) <= 7 ? "#b31115" : "#a87702",
                        }}>
                          {c.days_remaining}j
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Turnover / Présence */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: ".2px" }}>
              Mouvements
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {[
                { label: "Turnover (90j)", value: `${stats?.turnover_rate ?? 0}%` },
                { label: "Embauches (90j)", value: stats?.hires_last_90d ?? 0 },
                { label: "Départs (90j)", value: stats?.departures_last_90d ?? 0 },
                { label: "Présence ajd.", value: stats?.attendance_today ? `${stats.attendance_today.rate}%` : "—" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <p style={{ fontSize: "10px", color: "#858585", textTransform: "uppercase", margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: "4px 0 0 0" }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Congés */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: ".2px" }}>
              Congés
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { label: "En attente", value: stats?.pending_leave_requests ?? 0 },
                { label: "Approuvées ce mois", value: stats?.approved_leave_requests_this_month ?? 0 },
                { label: "En congé", value: stats?.on_leave_now ?? 0 },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <p style={{ fontSize: "10px", color: "#858585", textTransform: "uppercase", margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: "4px 0 0 0" }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Embauches récentes */}
          {stats?.recent_hires && stats.recent_hires.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#18181b", marginBottom: "12px", letterSpacing: ".2px" }}>
                Nouvelles embauches
              </h2>
              <div style={{ border: "1px solid #ececec", borderRadius: "7px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", background: "#fcfcfc" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Nom</th>
                      <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Département</th>
                      <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Poste</th>
                      <th style={{ padding: "7px 12px", textAlign: "right", fontWeight: 500, color: "#858585", borderBottom: "1px solid #ececec" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_hires.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                        <td style={{ padding: "7px 12px", fontWeight: 500 }}>{emp.full_name}</td>
                        <td style={{ padding: "7px 12px", color: "#868686" }}>{emp.department_name || "—"}</td>
                        <td style={{ padding: "7px 12px", color: "#868686" }}>{emp.position_title || "—"}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", color: "#868686" }}>
                          {emp.hire_date ? fmtDate(emp.hire_date) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pied de page */}
          <div style={{
            borderTop: "1.5px solid #ececec",
            paddingTop: "10px",
            marginTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <p style={{ fontSize: "10px", color: "#b0b0b0", margin: 0 }}>
              Rapport RH généré depuis Loura — {organizationSlug}
            </p>
            <p style={{ fontSize: "10px", color: "#b0b0b0", margin: 0 }}>
              Page 1
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
