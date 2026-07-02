// Regras de cálculo (§6) e alertas de segurança (§7) do prompt de build.
// Todas as funções são puras e testadas em src/lib/calc.test.ts.

import type {
  BodyLog,
  DoseLog,
  NutritionLog,
  Profile,
  Sexo,
  SymptomLog,
} from "./types";

// --- Datas ---------------------------------------------------------------

export function parseISODate(iso: string): Date {
  // Interpreta YYYY-MM-DD como data local (evita drift de fuso).
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- Proteína ------------------------------------------------------------

export interface ProteinTarget {
  min: number; // 1,6 g/kg
  alvo: number; // 1,8 g/kg
  max: number; // 2,0 g/kg
}

// Faixa 1,6–2,0 g/kg de peso corporal (até 2,0 com treino de força).
export function proteinTarget(pesoKg: number): ProteinTarget {
  return {
    min: Math.round(pesoKg * 1.6),
    alvo: Math.round(pesoKg * 1.8),
    max: Math.round(pesoKg * 2.0),
  };
}

// --- TDEE / kcal ---------------------------------------------------------

// Mifflin-St Jeor (BMR). Retorna null enquanto idade for desconhecida.
export function basalMetabolicRate(
  pesoKg: number,
  alturaCm: number,
  idade: number | null,
  sexo: Sexo
): number | null {
  if (idade == null) return null;
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  return Math.round(base + (sexo === "M" ? 5 : -161));
}

// TDEE = BMR × fator de atividade (1,4–1,6). Null enquanto idade for null.
export function estimateTDEE(
  pesoKg: number,
  alturaCm: number,
  idade: number | null,
  sexo: Sexo,
  fatorAtividade: number
): number | null {
  const bmr = basalMetabolicRate(pesoKg, alturaCm, idade, sexo);
  if (bmr == null) return null;
  return Math.round(bmr * fatorAtividade);
}

// Trava anti-déficit: kcal_alvo nunca abaixo de TDEE − deficit_max.
// Em GLP-1 o risco é subalimentação + perda de massa magra.
export function clampKcalTarget(
  desiredKcal: number,
  tdee: number | null,
  deficitMax: number
): { value: number | null; clamped: boolean; floor: number | null } {
  if (tdee == null) return { value: null, clamped: false, floor: null };
  const floor = tdee - deficitMax;
  if (desiredKcal < floor) return { value: floor, clamped: true, floor };
  return { value: Math.round(desiredKcal), clamped: false, floor };
}

// --- Composição corporal -------------------------------------------------

export function leanMassKg(pesoKg: number, gorduraPct: number): number {
  return round1(pesoKg * (1 - gorduraPct / 100));
}

export function fatMassKg(pesoKg: number, gorduraPct: number): number {
  return round1(pesoKg * (gorduraPct / 100));
}

export interface CompositionDelta {
  pesoDelta: number;
  leanDelta: number | null;
  fatDelta: number | null;
  // true quando o peso caiu mas a massa magra também caiu (métrica-chave).
  leanLossWhileLosingWeight: boolean;
}

// Compara dois body logs (ordem cronológica: from → to).
export function compositionDelta(from: BodyLog, to: BodyLog): CompositionDelta {
  const pesoDelta = round1(to.peso_kg - from.peso_kg);
  let leanDelta: number | null = null;
  let fatDelta: number | null = null;
  if (from.gordura_pct != null && to.gordura_pct != null) {
    const leanFrom = leanMassKg(from.peso_kg, from.gordura_pct);
    const leanTo = leanMassKg(to.peso_kg, to.gordura_pct);
    leanDelta = round1(leanTo - leanFrom);
    fatDelta = round1(
      fatMassKg(to.peso_kg, to.gordura_pct) - fatMassKg(from.peso_kg, from.gordura_pct)
    );
  }
  return {
    pesoDelta,
    leanDelta,
    fatDelta,
    leanLossWhileLosingWeight: pesoDelta < 0 && leanDelta != null && leanDelta < 0,
  };
}

// --- Adesão proteica -----------------------------------------------------

// % de dias no período com proteina_g >= min.
export function proteinAdherence(logs: NutritionLog[], min: number): number {
  if (logs.length === 0) return 0;
  const ok = logs.filter((l) => l.proteina_g >= min).length;
  return Math.round((ok / logs.length) * 100);
}

// --- Dose / titulação ----------------------------------------------------

export function latestDose(doses: DoseLog[]): DoseLog | null {
  if (doses.length === 0) return null;
  return [...doses].sort((a, b) => (a.data < b.data ? 1 : -1))[0];
}

export function nextDoseDate(doses: DoseLog[]): string | null {
  const last = latestDose(doses);
  return last ? addDaysISO(last.data, 7) : null;
}

export function daysSinceLastDose(doses: DoseLog[], todayISO: string): number | null {
  const last = latestDose(doses);
  if (!last) return null;
  return daysBetween(last.data, todayISO);
}

// Próxima dose sugerida no esquema de titulação (não é recomendação médica;
// apenas exibe o próximo degrau do esquema definido pelo usuário).
export function nextTitrationStep(
  esquema: number[],
  doseAtual: number | null
): number | null {
  if (doseAtual == null) return esquema[0] ?? null;
  const idx = esquema.indexOf(doseAtual);
  if (idx === -1 || idx === esquema.length - 1) return null;
  return esquema[idx + 1];
}

// Janela de efeitos GI aumentados após um aumento de dose (2–4 semanas).
// Retorna true se a dose mais recente foi um aumento em relação à anterior
// e estamos dentro de 28 dias dela.
export function inDoseIncreaseWindow(doses: DoseLog[], todayISO: string): boolean {
  if (doses.length < 2) return false;
  const sorted = [...doses].sort((a, b) => (a.data < b.data ? -1 : 1));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const increased = last.dose_mg > prev.dose_mg;
  const days = daysBetween(last.data, todayISO);
  return increased && days >= 0 && days <= 28;
}

// --- Alertas de segurança (§7) ------------------------------------------

export type AlertSeverity = "red" | "warn" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

interface AlertContext {
  today: SymptomLog | null;
  recentSymptoms: SymptomLog[]; // ordenados; usados para regras multi-dia
  todayNutrition: NutritionLog | null;
  profile: Profile;
}

export function evaluateAlerts(ctx: AlertContext): Alert[] {
  const alerts: Alert[] = [];
  const s = ctx.today;

  if (s) {
    // Bandeira vermelha: possível pancreatite.
    if (s.dor_abdominal === 3 && (s.nausea > 0 || s.vomito > 0)) {
      alerts.push({
        id: "pancreatite",
        severity: "red",
        title: "Possível pancreatite — procure atendimento",
        message:
          "Dor abdominal intensa (epigástrica, podendo irradiar para as costas) com náusea/vômito. Interrompa e procure atendimento médico agora.",
      });
    }

    // Bandeira vermelha: vômito/diarreia grave persistente → desidratação/rim.
    const severeGIToday = s.vomito === 3 || s.diarreia === 3;
    const severeGIYesterday = ctx.recentSymptoms.some(
      (r) => r.id !== s.id && (r.vomito === 3 || r.diarreia === 3)
    );
    if (severeGIToday && severeGIYesterday) {
      alerts.push({
        id: "desidratacao",
        severity: "red",
        title: "Vômito/diarreia grave persistente",
        message:
          "Risco de desidratação e sobrecarga renal. Procure atendimento médico se não conseguir se hidratar.",
      });
    }

    // Bandeira vermelha: icterícia.
    if (s.ictericia) {
      alerts.push({
        id: "ictericia",
        severity: "red",
        title: "Icterícia (pele/olhos amarelados)",
        message: "Sinal de alerta hepatobiliar. Procure atendimento médico.",
      });
    }
  }

  // Constipação ≥ 2 por ≥ 2 dias → lembrete fibra + líquidos.
  const constipDays = ctx.recentSymptoms.filter((r) => r.constipacao >= 2).length;
  if (constipDays >= 2) {
    alerts.push({
      id: "constipacao",
      severity: "warn",
      title: "Constipação persistente",
      message: `Registrada constipação moderada+ em ${constipDays} dias. Reforce fibra (${ctx.profile.fibra_g_alvo} g) e líquidos.`,
    });
  }

  // Hidratação: sintomas GI ativos e líquidos abaixo do alvo → reforço.
  const giActiveToday =
    !!s && (s.nausea > 0 || s.vomito > 0 || s.diarreia > 0 || s.dor_abdominal > 0);
  if (
    giActiveToday &&
    ctx.todayNutrition &&
    ctx.todayNutrition.liquidos_ml < ctx.profile.liquidos_ml_alvo
  ) {
    alerts.push({
      id: "hidratacao",
      severity: "warn",
      title: "Reforce a hidratação",
      message: `Sintomas GI ativos com líquidos abaixo do alvo (${ctx.todayNutrition.liquidos_ml} / ${ctx.profile.liquidos_ml_alvo} ml). Risco renal.`,
    });
  }

  // Ordena por severidade (red > warn > info).
  const order: Record<AlertSeverity, number> = { red: 0, warn: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// --- utils ---------------------------------------------------------------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
