import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  basalMetabolicRate,
  clampKcalTarget,
  compositionDelta,
  daysBetween,
  daysSinceLastDose,
  estimateTDEE,
  evaluateAlerts,
  fatMassKg,
  inDoseIncreaseWindow,
  leanMassKg,
  nextDoseDate,
  nextTitrationStep,
  proteinAdherence,
  proteinTarget,
} from "./calc";
import { defaultProfile } from "./seed";
import type { BodyLog, DoseLog, NutritionLog, SymptomLog } from "./types";

const emptySymptom = (over: Partial<SymptomLog>): SymptomLog => ({
  id: over.id ?? "s",
  data: over.data ?? "2026-07-02",
  nausea: 0,
  vomito: 0,
  diarreia: 0,
  constipacao: 0,
  dispepsia: 0,
  saciedade_precoce: 0,
  dor_abdominal: 0,
  ictericia: false,
  observacao: null,
  dias_desde_dose: null,
  ...over,
});

describe("datas", () => {
  it("daysBetween conta dias corridos", () => {
    expect(daysBetween("2026-07-02", "2026-07-09")).toBe(7);
    expect(daysBetween("2026-07-09", "2026-07-02")).toBe(-7);
  });
  it("addDaysISO soma dias respeitando virada de mês", () => {
    expect(addDaysISO("2026-07-30", 7)).toBe("2026-08-06");
  });
});

describe("proteína", () => {
  it("faixa 1,6–2,0 g/kg", () => {
    expect(proteinTarget(75)).toEqual({ min: 120, alvo: 135, max: 150 });
  });
  it("adesão = % de dias >= min", () => {
    const logs: NutritionLog[] = [
      { id: "1", data: "d1", proteina_g: 130, fibra_g: 0, liquidos_ml: 0, kcal: 0 },
      { id: "2", data: "d2", proteina_g: 100, fibra_g: 0, liquidos_ml: 0, kcal: 0 },
      { id: "3", data: "d3", proteina_g: 120, fibra_g: 0, liquidos_ml: 0, kcal: 0 },
      { id: "4", data: "d4", proteina_g: 90, fibra_g: 0, liquidos_ml: 0, kcal: 0 },
    ];
    expect(proteinAdherence(logs, 120)).toBe(50);
    expect(proteinAdherence([], 120)).toBe(0);
  });
});

describe("TDEE / kcal", () => {
  it("BMR Mifflin-St Jeor (homem)", () => {
    // 10*75 + 6.25*173 - 5*40 + 5 = 750 + 1081.25 - 200 + 5 = 1636.25 → 1636
    expect(basalMetabolicRate(75, 173, 40, "M")).toBe(1636);
  });
  it("mulher usa -161", () => {
    expect(basalMetabolicRate(75, 173, 40, "F")).toBe(1470);
  });
  it("TDEE indisponível enquanto idade for null", () => {
    expect(basalMetabolicRate(75, 173, null, "M")).toBeNull();
    expect(estimateTDEE(75, 173, null, "M", 1.5)).toBeNull();
  });
  it("TDEE = BMR × fator atividade", () => {
    expect(estimateTDEE(75, 173, 40, "M", 1.5)).toBe(2454);
  });
});

describe("trava anti-déficit", () => {
  it("bloqueia meta abaixo de TDEE − deficit_max", () => {
    const r = clampKcalTarget(1800, 2450, 400);
    expect(r.floor).toBe(2050);
    expect(r.clamped).toBe(true);
    expect(r.value).toBe(2050);
  });
  it("aceita meta dentro do limite", () => {
    const r = clampKcalTarget(2100, 2450, 400);
    expect(r.clamped).toBe(false);
    expect(r.value).toBe(2100);
  });
  it("null quando TDEE indisponível", () => {
    expect(clampKcalTarget(1800, null, 400).value).toBeNull();
  });
});

describe("composição corporal", () => {
  it("massa magra e massa gorda", () => {
    expect(leanMassKg(75, 25.1)).toBe(56.2);
    expect(fatMassKg(75, 25.1)).toBe(18.8);
  });
  it("sinaliza perda de massa magra mesmo com peso caindo", () => {
    const from: BodyLog = { id: "a", data: "d1", peso_kg: 75, gordura_pct: 25 };
    const to: BodyLog = { id: "b", data: "d2", peso_kg: 73, gordura_pct: 25.5 };
    const d = compositionDelta(from, to);
    expect(d.pesoDelta).toBe(-2);
    expect(d.leanDelta).toBeLessThan(0);
    expect(d.leanLossWhileLosingWeight).toBe(true);
  });
  it("não sinaliza quando massa magra sobe", () => {
    const from: BodyLog = { id: "a", data: "d1", peso_kg: 75, gordura_pct: 25 };
    const to: BodyLog = { id: "b", data: "d2", peso_kg: 74, gordura_pct: 22 };
    expect(compositionDelta(from, to).leanLossWhileLosingWeight).toBe(false);
  });
});

describe("dose / titulação", () => {
  const doses: DoseLog[] = [
    { id: "1", data: "2026-06-25", dose_mg: 2.5, local_aplicacao: null, observacao: null },
    { id: "2", data: "2026-07-02", dose_mg: 5.0, local_aplicacao: null, observacao: null },
  ];
  it("próxima dose = última + 7 dias", () => {
    expect(nextDoseDate(doses)).toBe("2026-07-09");
    expect(nextDoseDate([])).toBeNull();
  });
  it("dias desde a última dose", () => {
    expect(daysSinceLastDose(doses, "2026-07-05")).toBe(3);
  });
  it("próximo degrau do esquema de titulação", () => {
    const esquema = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0];
    expect(nextTitrationStep(esquema, null)).toBe(2.5);
    expect(nextTitrationStep(esquema, 5.0)).toBe(7.5);
    expect(nextTitrationStep(esquema, 15.0)).toBeNull();
  });
  it("janela de aumento de dose (2–4 semanas)", () => {
    expect(inDoseIncreaseWindow(doses, "2026-07-10")).toBe(true); // 8 dias após aumento
    expect(inDoseIncreaseWindow(doses, "2026-08-15")).toBe(false); // >28 dias
  });
});

describe("alertas de segurança", () => {
  const profile = defaultProfile();

  it("bandeira vermelha de pancreatite", () => {
    const today = emptySymptom({ dor_abdominal: 3, nausea: 2 });
    const alerts = evaluateAlerts({
      today,
      recentSymptoms: [today],
      todayNutrition: null,
      profile,
    });
    expect(alerts[0].id).toBe("pancreatite");
    expect(alerts[0].severity).toBe("red");
  });

  it("não dispara pancreatite sem náusea/vômito", () => {
    const today = emptySymptom({ dor_abdominal: 3 });
    const alerts = evaluateAlerts({ today, recentSymptoms: [today], todayNutrition: null, profile });
    expect(alerts.find((a) => a.id === "pancreatite")).toBeUndefined();
  });

  it("desidratação por GI grave persistente (2 dias)", () => {
    const y = emptySymptom({ id: "y", data: "2026-07-01", vomito: 3 });
    const today = emptySymptom({ id: "t", data: "2026-07-02", vomito: 3 });
    const alerts = evaluateAlerts({
      today,
      recentSymptoms: [y, today],
      todayNutrition: null,
      profile,
    });
    expect(alerts.find((a) => a.id === "desidratacao")).toBeDefined();
  });

  it("icterícia é bandeira vermelha", () => {
    const today = emptySymptom({ ictericia: true });
    const alerts = evaluateAlerts({ today, recentSymptoms: [today], todayNutrition: null, profile });
    expect(alerts.find((a) => a.id === "ictericia")?.severity).toBe("red");
  });

  it("constipação >= 2 por >= 2 dias", () => {
    const d1 = emptySymptom({ id: "1", data: "2026-07-01", constipacao: 2 });
    const d2 = emptySymptom({ id: "2", data: "2026-07-02", constipacao: 3 });
    const alerts = evaluateAlerts({
      today: d2,
      recentSymptoms: [d1, d2],
      todayNutrition: null,
      profile,
    });
    expect(alerts.find((a) => a.id === "constipacao")).toBeDefined();
  });

  it("hidratação: GI ativo + líquidos abaixo do alvo", () => {
    const today = emptySymptom({ nausea: 1 });
    const nutrition: NutritionLog = {
      id: "n",
      data: "2026-07-02",
      proteina_g: 100,
      fibra_g: 20,
      liquidos_ml: 1000,
      kcal: 1800,
    };
    const alerts = evaluateAlerts({
      today,
      recentSymptoms: [today],
      todayNutrition: nutrition,
      profile,
    });
    expect(alerts.find((a) => a.id === "hidratacao")).toBeDefined();
  });

  it("sem sintomas → sem alertas", () => {
    expect(
      evaluateAlerts({ today: null, recentSymptoms: [], todayNutrition: null, profile })
    ).toEqual([]);
  });
});
