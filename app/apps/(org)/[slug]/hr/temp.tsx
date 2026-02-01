"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Badge,
  Button
} from "@/components/ui";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, Label } from "recharts";
import { Users, Wallet, Calendar, ArrowUpRight, Building2 } from "lucide-react";
// Pour la démo, données statiques simulées

const COLOR_PALETTE = [
  "#6366F1","#F59E42","#22B573","#EB4646","#A16ADE","#17A2B8","#EAB308","#3B82F6","#FF6384"
];

// SIMULATIONS DE DONNÉES (seraient récupérées d'une API en réel)
const fakeHRData = {
  totalEmployees: 120,
  presenceRate: 92,
  payrollCurrentMonth: 14.8, // en millions
  payrollEvolution: [
    { month: "Jan", value: 11.5 },
    { month: "Fév", value: 12.0 },
    { month: "Mar", value: 12.8 },
    { month: "Avr", value: 13.2 },
    { month: "Mai", value: 14.1 },
    { month: "Juin", value: 14.8 },
  ],
  departments: [
    { name: "IT", headcount: 30 },
    { name: "RH", headcount: 12 },
    { name: "Finance", headcount: 18 },
    { name: "Commercial", headcount: 25 },
    { name: "Opérations", headcount: 15 },
    { name: "Support", headcount: 20 }
  ],
  positions: [
    { title: "Développeur", count: 18 },
    { title: "Analyste", count: 11 },
    { title: "Manager", count: 10 },
    { title: "Assistant", count: 14 },
    { title: "Technicien", count: 8 },
    { title: "RH", count: 12 },
    { title: "Commercial", count: 15 }
  ],
  gender: [
    { label: "Homme", value: 70 },
    { label: "Femme", value: 50 }
  ],
  ageRanges: [
    { range: "<25", count: 8 },
    { range: "25-34", count: 32 },
    { range: "35-44", count: 41 },
    { range: "45-54", count: 25 },
    { range: "55+", count: 14 }
  ],
  seniority: [
    { range: "<1 an", count: 23 },
    { range: "1-2 ans", count: 26 },
    { range: "3-5 ans", count: 34 },
    { range: "6-10 ans", count: 19 },
    { range: "10+ ans", count: 18 }
  ],
  payrollByDept: [
    { dept: "IT", payroll: 3.2 },
    { dept: "RH", payroll: 1.3 },
    { dept: "Finance", payroll: 1.9 },
    { dept: "Commercial", payroll: 4.4 },
    { dept: "Opérations", payroll: 2.1 },
    { dept: "Support", payroll: 1.9 }
  ],
  bonusByType: [
    { type: "Transport", value: 0.8 },
    { type: "Performance", value: 1.2 },
    { type: "Responsabilité", value: 0.6 },
    { type: "Logement", value: 0.5 },
  ],
  avgSalaryEvolution: [
    { month: "Jan", value: 320 },
    { month: "Fév", value: 335 },
    { month: "Mar", value: 340 },
    { month: "Avr", value: 348 },
    { month: "Mai", value: 362 },
    { month: "Juin", value: 371 },
  ],
  leavesPerMonth: [
    { month: "Jan", leaves: 13 },
    { month: "Fév", leaves: 9 },
    { month: "Mar", leaves: 11 },
    { month: "Avr", leaves: 15 },
    { month: "Mai", leaves: 17 },
    { month: "Juin", leaves: 22 },
  ],
  leavesByDept: [
    { dept: "IT", leaves: 6 },
    { dept: "RH", leaves: 2 },
    { dept: "Finance", leaves: 3 },
    { dept: "Commercial", leaves: 9 },
    { dept: "Opérations", leaves: 5 },
    { dept: "Support", leaves: 7 }
  ],
  leavesByType: [
    { type: "Annuel", value: 37 },
    { type: "Maladie", value: 11 },
    { type: "Maternité", value: 7 },
    { type: "Sans solde", value: 4 }
  ],
  avgLeaveBalance: [
    { type: "Solde moyen", value: 12 },
    { type: "Solde min.", value: 0 },
    { type: "Solde max.", value: 18 }
  ],
  absenceRate: 5, // %
  absencesPerMonth: [
    { month: 'Jan', value: 7 },
    { month: 'Fév', value: 8 },
    { month: 'Mar', value: 8 },
    { month: 'Avr', value: 12 },
    { month: 'Mai', value: 17 },
    { month: 'Juin', value: 10 },
  ],
  delaysPerEmployee: [
    { employee: 'S. Camara', late: 6 },
    { employee: 'N. Sylla', late: 3 },
    { employee: 'B. Barry', late: 5 },
    { employee: 'K. Bangoura', late: 9 },
    { employee: 'M. Bah', late: 4 },
  ],
  overtimePerEmployee: [
    { employee: 'S. Camara', overtime: 5.5 },
    { employee: 'N. Sylla', overtime: 2.1 },
    { employee: 'B. Barry', overtime: 7.2 },
    { employee: 'K. Bangoura', overtime: 4.3 },
    { employee: 'M. Bah', overtime: 3.4 },
  ],
  turnover: [
    { month: "Jan", rate: 2.0 },
    { month: "Fév", rate: 2.5 },
    { month: "Mar", rate: 3.1 },
    { month: "Avr", rate: 2.8 },
    { month: "Mai", rate: 2.9 },
    { month: "Juin", rate: 2.2 },
  ],
  employeesPerDeptByMonth: [
    { dept: "IT", data: [28,29,29,30,30,30] },
    { dept: "RH", data: [11,12,12,12,12,12] },
    { dept: "Finance", data: [18,17,17,18,18,18] },
    { dept: "Commercial", data: [23,23,25,25,25,25] },
    { dept: "Support", data: [21,21,20,20,20,20] },
  ]
};

export default function HRDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Note: toutes les données sont "simulées" en mémoire
  const d = fakeHRData;

  // Pour démos PieChart departements
  const deptPieData = d.departments.map(row => ({
    name: row.name,
    value: row.headcount
  }));
  const deptPieTotal = deptPieData.reduce((a, b) => a + b.value, 0);

  // Pour bar departements
  const deptBarData = d.departments.map(row => ({
    dept: row.name,
    Effectif: row.headcount
  }));

  // Répartition par poste/fonction
  const positionsBarData = d.positions.map((p) => ({
    Poste: p.title,
    Effectif: p.count
  }));

  // Genre
  const genderPieData = d.gender.map((g) => ({
    name: g.label,
    value: g.value
  }));

  // Genre bar
  const genderBarData = d.gender.map((g) => ({
    Genre: g.label,
    Effectif: g.value
  }));

  // Tranche d'âge
  const ageHistogramData = d.ageRanges;

  // Ancienneté
  const seniorityHistData = d.seniority;

  // Masse salariale par mois
  const payrollLineData = d.payrollEvolution;

  // Masse salariale par département
  const payrollDeptBarData = d.payrollByDept.map(row => ({
    Dépt: row.dept,
    Masse: row.payroll
  }));

  // Répartition primes/indemnités
  const bonusPieData = d.bonusByType.map((b) => ({
    name: b.type, value: b.value
  }));

  // Salaires moyens évolution
  const avgSalaryLineData = d.avgSalaryEvolution;

  // Congés par mois
  const leavesPerMonthBarData = d.leavesPerMonth;

  // Congés par département
  const leavesDeptBarData = d.leavesByDept;

  // Types de congés camembert
  const leavesTypePieData = d.leavesByType;

  // Solde moyen congés restant
  const avgLeaveBalanceBar = d.avgLeaveBalance;

  // Présence (jauge) données simples
  const presenceRate = d.presenceRate;

  // Absentéisme mois
  const absPerMonthLineBarData = d.absencesPerMonth;

  // Retards par employé
  const delaysBarData = d.delaysPerEmployee;

  // Heures sup
  const overtimeBarData = d.overtimePerEmployee;

  // Turnover évolution
  const turnoverLineData = d.turnover;

  // Effectif par Département dans le temps
  const effectifDeptTemps = d.employeesPerDeptByMonth;

  return (
    <div className="space-y-8">
      {/* KPIs HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* KPI Effectif total */}
        <Card className="p-5 flex flex-col gap-2 items-center text-center">
          <Users className="mb-2 text-primary" />
          <div className="text-2xl font-bold">{d.totalEmployees}</div>
          <div className="text-muted-foreground text-sm">Effectif total</div>
        </Card>
        {/* KPI présence */}
        <Card className="p-5 flex flex-col gap-2 items-center text-center">
          <span className="inline-flex rounded-full bg-green-100 text-green-700 dark:bg-green-900/10 dark:text-green-400 p-2">
            <span className="font-bold text-2xl">{presenceRate}%</span>
          </span>
          <div className="text-muted-foreground mt-1">Taux de présence</div>
        </Card>
        {/* KPI masse salariale */}
        <Card className="p-5 flex flex-col gap-2 items-center text-center">
          <Wallet className="mb-2 text-primary" />
          <div className="text-2xl font-bold">{d.payrollCurrentMonth.toFixed(1)}M</div>
          <div className="text-muted-foreground text-sm">Masse salariale du mois</div>
        </Card>
      </div>

      {/* CENTRE: Graphiques principaux */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
        {/* Masse salariale : ligne */}
        <Card className="p-6 ">
          <h3 className="font-semibold text-lg mb-2">Évolution de la masse salariale (M GNF)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={payrollLineData}>
              <CartesianGrid strokeDasharray="4 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip
                formatter={(v) => `${v.toFixed(1)} M GNF`} />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: "#6366F1" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        {/* Effectif par département barchart */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Répartition des employés par département</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="dept" width={100} />
              <RechartsTooltip formatter={v => `${v} employés`} />
              <Bar dataKey="Effectif">
                {deptBarData.map((entry, idx) => (
                  <Cell key={entry.dept} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* En bas : autres graphiques analytiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-4">
        {/* a) Pie chart répartition des départements */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Départements (%)</h4>
          <ResponsiveContainer width="100%" height={185}>
            <PieChart>
              <Pie data={deptPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                label={(props) => `${props.name}: ${Math.round((props.value / deptPieTotal) * 100)}%`}>
                {deptPieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value, name) => [`${value} employés`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* b) Répartition par poste/fonction */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Top postes (effectif)</h4>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={positionsBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="Poste" width={90} />
              <RechartsTooltip formatter={v => `${v} pers.`} />
              <Bar dataKey="Effectif" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* c) Genre */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Répartition par genre</h4>
          <div className="grid grid-cols-2 gap-1">
            <ResponsiveContainer width="100%" height={90}>
              <PieChart>
                <Pie data={genderPieData} cx="50%" cy="50%" outerRadius={38} fill="#A16ADE" dataKey="value"
                  label={d => d.name}
                >
                  {genderPieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={genderBarData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="Genre" type="category" width={40} hide />
                <Bar dataKey="Effectif">
                  {genderBarData.map((entry, i) => (
                    <Cell key={entry.Genre} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* d) Tranche d'âge */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Répartition par âge</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={ageHistogramData}>
              <XAxis dataKey="range" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="count" fill="#EB4646" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ENCORE PLUS D'ANALYTIQUE en accord avec la maquette proposée */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-4">

        {/* e) Ancienneté histogramme */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Ancienneté des employés</h4>
          <ResponsiveContainer width="100%" height={95}>
            <BarChart data={seniorityHistData}>
              <XAxis dataKey="range" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="count" fill="#22B573" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Masse salariale/département */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Masse salariale par département</h4>
          <ResponsiveContainer width="100%" height={95}>
            <BarChart data={payrollDeptBarData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="Dépt" type="category" width={60} />
              <RechartsTooltip formatter={v => `${v} M GNF`} />
              <Bar dataKey="Masse" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition primes/indemnités pie */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Répartition des primes</h4>
          <ResponsiveContainer width="100%" height={95}>
            <PieChart>
              <Pie data={bonusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40}
                label={(entry) => entry.name}>
                {bonusPieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(v, n) => [`${v} M GNF`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Salaires moyens évolution */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Évolution salaire moyen (K GNF)</h4>
          <ResponsiveContainer width="100%" height={95}>
            <LineChart data={avgSalaryLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip formatter={v => v + " K"} />
              <Line dataKey="value" stroke="#17A2B8" strokeWidth={2} dot={{ r: 3, fill: "#17A2B8" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Congés et absences bas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-4">

        {/* Congés par mois bar */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Congés par mois</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={leavesPerMonthBarData}>
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip formatter={v => `${v} congés`} />
              <Bar dataKey="leaves" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Congés par département */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Congés par département</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={leavesDeptBarData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="dept" type="category" width={70} />
              <RechartsTooltip />
              <Bar dataKey="leaves" fill="#A16ADE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Types de congés camembert */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Types de congé</h4>
          <ResponsiveContainer width="100%" height={90}>
            <PieChart>
              <Pie data={leavesTypePieData} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={35}
                label={(e) => e.type}>
                {leavesTypePieData.map((entry, idx) => (
                  <Cell key={entry.type} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(v, n) => [`${v} abs.`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        {/* Solde moyen congés restants (bar) */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Solde congés restant</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={avgLeaveBalanceBar}>
              <XAxis dataKey="type" />
              <YAxis />
              <RechartsTooltip formatter={v => `${v} jours`} />
              <Bar dataKey="value" fill="#F59E42" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Présence/absences/retards/heures supp */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-4">
        {/* Présence globale (jauge) : juste une barre/sans jauge */}
        <Card className="p-5">
          <h4 className="font-semibold mb-1">Taux de présence</h4>
          <div className="flex items-end gap-2 mt-3">
            <div className="w-[9ch] h-7 bg-green-100 dark:bg-green-900/30 rounded-full relative">
              <div style={{ width: `${presenceRate}%` }} className="h-full bg-green-500 rounded-full transition-all duration-700" />
              <div className="absolute inset-0 flex items-center justify-center font-semibold">{presenceRate}%</div>
            </div>
          </div>
        </Card>
        {/* Absences par mois */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Absences par mois</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={absPerMonthLineBarData}>
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip formatter={v => `${v} abs.`} />
              <Bar dataKey="value" fill="#EB4646" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Retards employé */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Retards par employé</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={delaysBarData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="employee" type="category" width={90} />
              <RechartsTooltip formatter={v => `${v} fois`} />
              <Bar dataKey="late" fill="#A16ADE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Heures sup */}
        <Card className="p-5">
          <h4 className="font-semibold mb-2">Heures supplémentaires</h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={overtimeBarData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="employee" type="category" width={90} />
              <RechartsTooltip formatter={v => `${v} h`} />
              <Bar dataKey="overtime" fill="#17A2B8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* KPIs + bado: parité/turnover etc */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-3">
        {/* Turnover */}
        <Card className="p-6">
          <h4 className="font-semibold mb-2">Turnover global (%)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={turnoverLineData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Line dataKey="rate" stroke="#FF6384" strokeWidth={2} dot={{ r: 3 }} />
              <RechartsTooltip formatter={(v)=>v+"%"} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Effectif par département dans le temps */}
        <Card className="p-6">
          <h4 className="font-semibold mb-2">Effectif par département (6 derniers mois)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart>
              <XAxis dataKey="month"
                type="category"
                allowDuplicatedCategory={false}
                domain={['auto', 'auto']} />
              <YAxis />
              {effectifDeptTemps.map((dept, idx) => (
                <Line
                  key={dept.dept}
                  data={dept.data.map((v, i) => ({ x: d.payrollEvolution[i].month, y: v }))}
                  dataKey="y"
                  name={dept.dept}
                  stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                  dot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
              ))}
              {/* recrée axes months */}
              <XAxis
                dataKey="x"
                type="category"
                allowDuplicatedCategory={false}
                hide={false}
                ticks={d.payrollEvolution.map(e=>e.month)}
              />
              <RechartsTooltip formatter={v => `${v} pers.`} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}