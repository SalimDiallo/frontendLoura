"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button } from "@/components/ui";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMinusCircle,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import { formatLeaveDays } from "@/lib/utils/leave";

const ReactApexChart = dynamic(
  () => import("react-apexcharts").then((mod) => mod.default as any),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: "all", label: "Tous", icon: HiOutlineCalendar, color: "text-neutral-800", bg: "bg-neutral-100" },
  { value: "approved", label: "Validées", icon: HiOutlineCheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { value: "pending", label: "En attente", icon: HiOutlineMinusCircle, color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: "rejected", label: "Refusées", icon: HiOutlineXCircle, color: "text-red-500", bg: "bg-red-50" },
];

const STATUS_COLORS = {
  approved: "#22c55e",
  pending: "#eab308",
  rejected: "#ef4444",
};

const STATUS_ICONS = {
  approved: HiOutlineCheckCircle,
  pending: HiOutlineMinusCircle,
  rejected: HiOutlineXCircle,
  all: HiOutlineCalendar,
};

function getUniqueUsers(reqs: any[]) {
  const users = new Set(reqs.map((r) => r.user?.id ?? r.user));
  return users.size;
}

export default function LeaveStatsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const currentYear = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState<string>("");

  // On page d'accueil: sélectionner/désélectionner status multiples pour graphe
  const [selectedStatuses, setSelectedStatuses] = useState(["approved", "pending", "rejected", "all"]);

  const availableYears = useMemo(() => {
    const years = leaveRequests.length > 0
      ? leaveRequests.map((r) => new Date(r.start_date).getFullYear())
      : [currentYear];
    const min = Math.min(...years);
    const max = Math.max(...years, currentYear);
    return Array.from({ length: max - min + 1 }, (_, i) => (min + i).toString()).reverse();
  }, [leaveRequests]);

  // Gestion de la plage d'années pour le graphe (multi années)
  const [yearFrom, setYearFrom] = useState<string>(availableYears[availableYears.length - 1] || currentYear.toString());
  const [yearTo, setYearTo] = useState<string>(availableYears[0] || currentYear.toString());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const requestsResponse = await getLeaveRequests();
        setLeaveRequests(requestsResponse.results || []);
      } catch (err: any) {
        setError(err?.message || "Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const monthList = useMemo(() => {
    let yFrom = Number(yearFrom);
    let yTo = Number(yearTo);
    if (yFrom > yTo) [yFrom, yTo] = [yTo, yFrom];
    const months: string[] = [];
    for (let y = yFrom; y <= yTo; ++y) {
      for (let m = 1; m <= 12; ++m) {
        months.push(`${y}-${("0" + m).slice(-2)}`);
      }
    }
    return months;
  }, [yearFrom, yearTo]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const reqStart = new Date(req.start_date);
      const reqEnd = new Date(req.end_date);

      let byDate = true;
      if (yearFrom && yearTo) {
        const start = new Date(`${yearFrom}-01-01`);
        const end = new Date(`${yearTo}-12-31`);
        byDate =
          (reqStart >= start && reqStart <= end) ||
          (reqEnd >= start && reqEnd <= end) ||
          (reqStart <= start && reqEnd >= end);
      }

      // Search (utilisateur ou raison)
      let bySearch = true;
      if (searchTerm) {
        const val = searchTerm.toLowerCase();
        const userStr =
          typeof req.user === "string"
            ? req.user
            : [req.user?.first_name, req.user?.last_name, req.user?.email]
                .filter(Boolean)
                .join(" ");
        const reason = req.reason ?? "";
        bySearch =
          (userStr ?? "")
            .toLowerCase()
            .includes(val) ||
          reason.toLowerCase().includes(val);
      }

      return byDate && bySearch;
    });
  }, [leaveRequests, yearFrom, yearTo, searchTerm]);

  // Statistiques globales (modèle page.tsx : mini-cards à l'affichage horizontal avec petit label et couleur image-like)
  const stats = useMemo(() => {
    return {
      total: filteredRequests.length,
      approved: filteredRequests.filter((r) => r.status === "approved").length,
      rejected: filteredRequests.filter((r) => r.status === "rejected").length,
      pending: filteredRequests.filter((r) => r.status === "pending").length,
      uniqueUsers: getUniqueUsers(filteredRequests),
    };
  }, [filteredRequests]);

  // Statistique mini-cards data et component (pattern du page.tsx : stacked, plus gros, couleur de background icon)
  const statCards = [
    {
      label: "Employé" + (stats.uniqueUsers !== 1 ? "s" : "") + " concernés",
      value: stats.uniqueUsers,
      icon: HiOutlineUserGroup,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-700"
    },
    {
      label: "Demandes",
      value: stats.total,
      icon: HiOutlineCalendar,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      label: "Validées",
      value: stats.approved,
      icon: HiOutlineCheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      label: "En attente",
      value: stats.pending,
      icon: HiOutlineMinusCircle,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      label: "Refusées",
      value: stats.rejected,
      icon: HiOutlineXCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
  ];

  // Choix des statuts visibles sur graphe (avec "all" = total, ou on peut sélectionner plusieurs, pattern comme un toggle group style horizontal filter pill)
  function handleToggleStatus(status: string) {
    if (status === "all") {
      setSelectedStatuses(["all"]);
    } else {
      let copy = selectedStatuses.includes("all")
        ? []
        : [...selectedStatuses];
      if (copy.includes(status)) {
        copy = copy.filter((s) => s !== status);
      } else {
        copy.push(status);
      }
      // Always at least 1 selected
      if (copy.length === 0) copy = ["all"];
      setSelectedStatuses(copy);
    }
  }

  // Data pour graphe (plusieurs séries si multi statuts, "all" = total)
  const chartSeries = useMemo(() => {
    if (!filteredRequests.length) {
      return [];
    }
    // Helper to count requests by status/mois
    function getCountByMonth(statusFilter?: string) {
      const counts: Record<string, number> = {};
      filteredRequests.forEach((req) => {
        if (statusFilter && req.status !== statusFilter) return;
        let d = new Date(req.start_date);
        const y = d.getFullYear();
        const m = ("0" + (d.getMonth() + 1)).slice(-2);
        const key = `${y}-${m}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      // Map all monthList
      return monthList.map((key) => counts[key] || 0);
    }

    // "all" = tout confondu
    if (selectedStatuses.includes("all")) {
      return [{
        name: "Total",
        data: getCountByMonth(),
        color: "#6366f1"
      }];
    }
    // sinon, une série par status sélectionné
    return selectedStatuses.map((status) => ({
      name:
        STATUS_OPTIONS.find((opt) => opt.value === status)?.label ??
        status,
      data: getCountByMonth(status),
      color: (STATUS_COLORS as Record<string, string>)[status] ?? "#6366f1",
    }));
  }, [filteredRequests, selectedStatuses, monthList]);

  const chartCategories = monthList;

  // Loader
  if (loading) {
    return (
      <div className="space-y-6 px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded bg-neutral-100 dark:bg-neutral-900 w-2/5 mb-2" />
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 w-40 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex-1"
              />
            ))}
          </div>
          <div className="h-80 bg-neutral-100 dark:bg-neutral-900 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-8 px-2 md:px-8 py-6 w-full max-w-screen-2xl mx-auto">

      {/* Header */}
      <header className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="p-1 border border-transparent hover:border-primary rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Link href={`/apps/${slug}/hr/leaves`}>
            <HiOutlineArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Statistiques congés
        </h1>
      </header>

      {/* Stat cards à la page.tsx pattern */}
      <section className="flex w-full flex-wrap gap-4">
        {statCards.map((card, i) => (
          <Card
            key={card.label}
            className="flex items-center gap-3 min-w-[160px] px-6 py-4 flex-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-none"
          >
            <div
              className={`flex items-center justify-center size-12 rounded-full ${card.iconBg} ${card.iconColor} bg-opacity-70 border`}
            >
              <card.icon className={`size-7 ${card.iconColor}`} />
            </div>
            <div>
              <div className="text-[2rem] leading-none font-extrabold text-neutral-900 dark:text-neutral-100">{card.value}</div>
              <span className="text-xs text-neutral-500">{card.label}</span>
            </div>
          </Card>
        ))}
      </section>

      {/* Filtres */}
      <section className="flex flex-wrap gap-4 items-end justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 px-4 py-3">
        <div className="flex gap-3 flex-wrap items-end">
          {/* Plage d'années */}
          <label className="flex flex-col gap-1 text-xs text-neutral-700 dark:text-neutral-300">
            De
            <select
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded text-sm font-medium bg-transparent text-neutral-900 dark:text-neutral-100 min-w-[82px] appearance-none"
              aria-label="Année de début"
            >
              {availableYears.slice().reverse().map((y) => (
                <option value={y} key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-700 dark:text-neutral-300">
            à
            <select
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded text-sm font-medium bg-transparent text-neutral-900 dark:text-neutral-100 min-w-[82px] appearance-none"
              aria-label="Année de fin"
            >
              {availableYears.slice().reverse().map((y) => (
                <option value={y} key={y}>{y}</option>
              ))}
            </select>
          </label>
          {/* Statut pour le graphe : bouton toggle filter pills */}
          <div className="flex items-end gap-2">
            <span className="text-xs text-neutral-700 dark:text-neutral-300 mb-1">Statuts sur le graphe</span>
            <div className="flex gap-1 flex-wrap">
              {STATUS_OPTIONS.map((opt) => {
                // show 'all' as a pill, and if "all" is ON, no other can be ON
                const isActive =
                  opt.value === "all"
                    ? selectedStatuses.includes("all")
                    : selectedStatuses.includes(opt.value) && !selectedStatuses.includes("all");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleStatus(opt.value)}
                    className={
                      `inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition
                      ${
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                      }
                      `
                    }
                  >
                    <opt.icon className={`mr-1 h-4 w-4 ${isActive ? "" : "opacity-60"}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Recherche */}
          <label className="flex flex-col gap-1 text-xs text-neutral-700 dark:text-neutral-300">
            Recherche
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Employé ou motif…"
              className="px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded text-sm font-medium bg-transparent text-neutral-900 dark:text-neutral-100 min-w-[160px]"
            />
          </label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded border border-transparent px-3 py-1 text-xs hover:border-primary/50"
          onClick={() => {
            setYearFrom(availableYears[availableYears.length - 1] || currentYear.toString());
            setYearTo(availableYears[0] || currentYear.toString());
            setSelectedStatuses(["approved", "pending", "rejected", "all"]);
            setSearchTerm("");
          }}
        >
          Réinitialiser
        </Button>
      </section>

      {/* Message erreur */}
      {error && (
        <Alert variant="error" className="mt-1 mb-1">
          {error}
        </Alert>
      )}

      {/* Graph bar multi status */}
      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 md:px-6 py-5 w-full mt-1">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineCalendar className="size-5 text-primary/70" />
          <span className="font-semibold text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
            Nombre de demandes de congé par mois ({yearFrom} - {yearTo})
          </span>
        </div>
        {chartCategories.length === 0 || chartSeries.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mx-auto mb-2">
              <HiOutlineCalendar className="size-7 text-neutral-300 dark:text-neutral-500" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Aucune donnée selon le filtre choisi.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-2">
            <ReactApexChart
              type="bar"
              height={390}
              width="100%"
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  background: "transparent",
                  fontFamily: "inherit",
                  animations: { enabled: true, easing: "easeinout" }
                },
                plotOptions: {
                  bar: {
                    columnWidth: "50%",
                    borderRadius: 6,
                  },
                },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ["transparent"] },
                xaxis: {
                  categories: chartCategories,
                  labels: {
                    style: { fontSize: "13px", color: "#646473" },
                    rotate: -45,
                    rotateAlways: false
                  },
                  tickPlacement: "on",
                  axisTicks: { show: false },
                  axisBorder: { show: false },
                },
                yaxis: {
                  labels: {
                    style: { fontSize: "13px", color: "#646473" },
                  },
                  min: 0,
                  forceNiceScale: true,
                  title: { text: "" },
                },
                colors: chartSeries.map((serie) => serie.color),
                tooltip: {
                  enabled: true,
                  shared: true,
                  intersect: false, // <-- Fix: disable intersect to allow shared tooltips
                  y: {
                    formatter: function (val: any) {
                      return `${val} demande${val === 1 ? "" : "s"}`;
                    }
                  }
                },
                grid: { strokeDashArray: 2, borderColor: "#ececf2" },
                legend: { show: chartSeries.length > 1 },
              }}
              series={chartSeries}
            />
          </div>
        )}
      </section>
    </main>
  );
}
