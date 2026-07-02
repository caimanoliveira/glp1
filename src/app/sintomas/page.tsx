"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { daysBetween, evaluateAlerts, latestDose } from "@/lib/calc";
import { AlertBanner, Card, PageTitle } from "@/components/ui";
import {
  INTENSITY_LABELS,
  SYMPTOM_KEYS,
  SYMPTOM_LABELS,
  type SymptomKey,
} from "@/lib/types";
import { ScatterChart, type Point } from "@/components/charts";

export default function SintomasPage() {
  const { data, today, upsertSymptom } = useStore();
  const symptom = data.symptom_log.find((s) => s.data === today) ?? null;
  const [selected, setSelected] = useState<SymptomKey>("nausea");

  const recent = useMemo(
    () =>
      [...data.symptom_log]
        .filter((s) => s.data <= today)
        .sort((a, b) => (a.data < b.data ? -1 : 1))
        .slice(-14),
    [data.symptom_log, today]
  );

  const alerts = evaluateAlerts({
    today: symptom,
    recentSymptoms: recent,
    todayNutrition: data.nutrition_log.find((n) => n.data === today) ?? null,
    profile: data.profile,
  });

  // dias_desde_dose calculado a partir do último dose_log <= data do registro.
  function diasDesdeDose(dataISO: string): number | null {
    const doseBefore = [...data.dose_log]
      .filter((d) => d.data <= dataISO)
      .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
    return doseBefore ? daysBetween(doseBefore.data, dataISO) : null;
  }

  function setLevel(key: SymptomKey, value: number) {
    upsertSymptom(today, { [key]: value, dias_desde_dose: diasDesdeDose(today) });
  }

  function toggleIcteria() {
    upsertSymptom(today, {
      ictericia: !(symptom?.ictericia ?? false),
      dias_desde_dose: diasDesdeDose(today),
    });
  }

  // Pontos do gráfico: intensidade do sintoma selecionado × dias desde a dose.
  const scatter: Point[] = recent
    .map((s) => {
      const dd = s.dias_desde_dose ?? diasDesdeDose(s.data);
      if (dd == null) return null;
      return { x: dd, y: s[selected] } as Point;
    })
    .filter((p): p is Point => p != null && p.y > 0);

  return (
    <div className="space-y-4">
      <PageTitle subtitle="Registro diário · escala 0–3">Sintomas</PageTitle>

      {alerts.map((a) => (
        <AlertBanner key={a.id} alert={a} />
      ))}

      <Card title="Como você está hoje?">
        <div className="space-y-4">
          {SYMPTOM_KEYS.map((key) => {
            const val = symptom?.[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{SYMPTOM_LABELS[key]}</span>
                  <span className="text-xs text-slate-500">{INTENSITY_LABELS[val]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={val}
                  onChange={(e) => setLevel(key, Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
            );
          })}

          <button
            onClick={toggleIcteria}
            className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${
              symptom?.ictericia
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {symptom?.ictericia ? "⚠️ Icterícia registrada" : "Marcar icterícia (pele/olhos amarelados)"}
          </button>
        </div>
      </Card>

      <Card
        title="Padrão pós-titulação"
        action={
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as SymptomKey)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
          >
            {SYMPTOM_KEYS.map((k) => (
              <option key={k} value={k}>
                {SYMPTOM_LABELS[k]}
              </option>
            ))}
          </select>
        }
      >
        <p className="mb-2 text-xs text-slate-400">
          Intensidade de {SYMPTOM_LABELS[selected].toLowerCase()} conforme os dias desde a última
          aplicação.
        </p>
        <ScatterChart points={scatter} />
      </Card>
    </div>
  );
}
