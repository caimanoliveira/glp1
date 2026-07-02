"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { MEAL_TEMPLATE } from "@/lib/seed";
import {
  daysSinceLastDose,
  evaluateAlerts,
  nextDoseDate,
  proteinTarget,
} from "@/lib/calc";
import { AlertBanner, Card, GoalBar, NumberField, PageTitle } from "@/components/ui";
import { SYMPTOM_KEYS, SYMPTOM_LABELS } from "@/lib/types";
import { useState } from "react";

export default function HojePage() {
  const { data, today, ready, upsertNutrition } = useStore();
  const { profile } = data;

  const nutri = data.nutrition_log.find((n) => n.data === today);
  const symptom = data.symptom_log.find((s) => s.data === today) ?? null;
  const recent = last7(data.symptom_log, today);

  const alerts = evaluateAlerts({
    today: symptom,
    recentSymptoms: recent,
    todayNutrition: nutri ?? null,
    profile,
  });

  const latestWeight =
    [...data.body_log].sort((a, b) => (a.data < b.data ? 1 : -1))[0]?.peso_kg ??
    profile.peso_inicial_kg;
  const pTarget = proteinTarget(latestWeight);

  const proteinaHoje = nutri?.proteina_g ?? 0;
  const activeSymptoms = symptom
    ? SYMPTOM_KEYS.filter((k) => symptom[k] > 0)
    : [];

  const nextDose = nextDoseDate(data.dose_log);
  const sinceDose = daysSinceLastDose(data.dose_log, today);

  if (!ready) return <PageTitle>Hoje</PageTitle>;

  return (
    <div className="space-y-4">
      <PageTitle subtitle={formatToday(today)}>Hoje</PageTitle>

      {alerts.map((a) => (
        <AlertBanner key={a.id} alert={a} />
      ))}

      <Card title="Metas do dia">
        <div className="space-y-3">
          <GoalBar
            label="Proteína"
            value={proteinaHoje}
            target={profile.proteina_g_alvo}
            unit="g"
            hint={`Faixa ${pTarget.min}–${pTarget.max} g (alvo ${pTarget.alvo} g p/ ${latestWeight} kg)`}
          />
          <GoalBar label="Líquidos" value={nutri?.liquidos_ml ?? 0} target={profile.liquidos_ml_alvo} unit="ml" />
          <GoalBar label="Fibra" value={nutri?.fibra_g ?? 0} target={profile.fibra_g_alvo} unit="g" />
          <GoalBar
            label="Calorias"
            value={nutri?.kcal ?? 0}
            target={profile.kcal_alvo}
            unit="kcal"
            hint={
              profile.kcal_alvo == null
                ? "kcal indisponível — informe a idade em Config"
                : undefined
            }
          />
        </div>
      </Card>

      <ManualNutrition />

      <Card
        title="Adicionar do template"
        action={<Link href="/config" className="text-xs text-brand">substituições</Link>}
      >
        <p className="mb-2 text-xs text-slate-400">Toque para somar a proteína da refeição ao dia.</p>
        <div className="grid grid-cols-1 gap-2">
          {MEAL_TEMPLATE.map((m) => (
            <button
              key={m.refeicao}
              onClick={() =>
                upsertNutrition(today, { proteina_g: proteinaHoje + m.proteina_g })
              }
              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left active:bg-slate-50"
            >
              <span>
                <span className="text-sm font-medium text-slate-700">{m.refeicao}</span>
                <span className="block text-xs text-slate-400">{m.exemplo}</span>
              </span>
              <span className="shrink-0 rounded-lg bg-brand-soft px-2 py-1 text-xs font-semibold text-teal-700">
                +{m.proteina_g} g
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Dose">
          {nextDose ? (
            <>
              <p className="text-lg font-bold text-slate-900">{formatShort(nextDose)}</p>
              <p className="text-xs text-slate-400">
                próxima aplicação{sinceDose != null ? ` · ${sinceDose}d desde a última` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">Nenhuma dose registrada.</p>
              <Link href="/dose" className="mt-1 inline-block text-xs text-brand">
                registrar 1ª aplicação →
              </Link>
            </>
          )}
        </Card>

        <Card title="Sintomas hoje">
          {symptom == null ? (
            <Link href="/sintomas" className="text-sm text-brand">
              registrar →
            </Link>
          ) : activeSymptoms.length === 0 ? (
            <p className="text-sm text-brand">Sem sintomas 👍</p>
          ) : (
            <ul className="text-xs text-slate-600">
              {activeSymptoms.map((k) => (
                <li key={k}>
                  {SYMPTOM_LABELS[k]}: {symptom[k]}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// Editor manual dos números do dia (proteína/fibra/líquidos/kcal).
function ManualNutrition() {
  const { data, today, upsertNutrition } = useStore();
  const nutri = data.nutrition_log.find((n) => n.data === today);
  const [open, setOpen] = useState(false);

  const field = (
    key: "proteina_g" | "fibra_g" | "liquidos_ml" | "kcal",
    label: string,
    unit: string,
    step = 1
  ) => (
    <NumberField
      label={label}
      unit={unit}
      step={step}
      value={nutri?.[key] ?? 0}
      onChange={(v) => upsertNutrition(today, { [key]: v === "" ? 0 : v })}
    />
  );

  return (
    <Card
      title="Registrar manualmente"
      action={
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-brand">
          {open ? "fechar" : "editar"}
        </button>
      }
    >
      {open ? (
        <div className="grid grid-cols-2 gap-3">
          {field("proteina_g", "Proteína", "g")}
          {field("fibra_g", "Fibra", "g")}
          {field("liquidos_ml", "Líquidos", "ml", 100)}
          {field("kcal", "Calorias", "kcal", 10)}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Ajuste os valores exatos do dia.</p>
      )}
    </Card>
  );
}

function last7<T extends { data: string }>(logs: T[], today: string): T[] {
  return [...logs]
    .filter((l) => l.data <= today)
    .sort((a, b) => (a.data < b.data ? -1 : 1))
    .slice(-7);
}

function formatToday(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
