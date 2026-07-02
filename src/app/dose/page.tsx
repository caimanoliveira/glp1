"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  daysSinceLastDose,
  inDoseIncreaseWindow,
  latestDose,
  nextDoseDate,
  nextTitrationStep,
} from "@/lib/calc";
import { AlertBanner, Button, Card, PageTitle } from "@/components/ui";
import { INJECTION_SITES } from "@/lib/types";

export default function DosePage() {
  const { data, today, addDose, remove } = useStore();
  const doses = [...data.dose_log].sort((a, b) => (a.data < b.data ? 1 : -1));
  const last = latestDose(data.dose_log);
  const esquema = data.profile.esquema_titulacao_mg;
  const suggestedNext = nextTitrationStep(esquema, last?.dose_mg ?? null);

  // Rotação de local sugerida: próximo local após o último usado.
  const lastSiteIdx = last?.local_aplicacao
    ? INJECTION_SITES.indexOf(last.local_aplicacao as (typeof INJECTION_SITES)[number])
    : -1;
  const suggestedSite = INJECTION_SITES[(lastSiteIdx + 1) % INJECTION_SITES.length];

  const [date, setDate] = useState(today);
  const [doseMg, setDoseMg] = useState<number>(last?.dose_mg ?? esquema[0]);
  const [site, setSite] = useState<string>(suggestedSite);
  const [obs, setObs] = useState("");

  const inWindow = inDoseIncreaseWindow(data.dose_log, today);
  const nextDate = nextDoseDate(data.dose_log);
  const since = daysSinceLastDose(data.dose_log, today);

  function submit() {
    addDose({
      data: date,
      dose_mg: doseMg,
      local_aplicacao: site,
      observacao: obs.trim() || null,
    });
    setObs("");
  }

  return (
    <div className="space-y-4">
      <PageTitle subtitle="Registro de aplicação semanal e titulação">Dose</PageTitle>

      {inWindow && (
        <AlertBanner
          alert={{
            id: "titulacao",
            severity: "warn",
            title: "Janela pós-aumento de dose",
            message:
              "Você aumentou a dose nas últimas 4 semanas. Efeitos GI tendem a ser mais intensos nesse período — reforce proteína, líquidos e registre os sintomas.",
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card title="Dose atual">
          <p className="text-2xl font-bold text-slate-900">
            {last ? `${last.dose_mg} mg` : "—"}
          </p>
          {suggestedNext != null && (
            <p className="text-xs text-slate-400">próximo degrau do esquema: {suggestedNext} mg</p>
          )}
        </Card>
        <Card title="Próxima aplicação">
          <p className="text-2xl font-bold text-slate-900">
            {nextDate ? formatShort(nextDate) : "—"}
          </p>
          <p className="text-xs text-slate-400">
            {since != null ? `${since} dias desde a última` : "última + 7 dias"}
          </p>
        </Card>
      </div>

      <Card title="Registrar aplicação">
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-slate-600">Dose (mg)</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {esquema.map((mg) => (
                <button
                  key={mg}
                  onClick={() => setDoseMg(mg)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    doseMg === mg ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-600">
              Local (rotação sugerida: {suggestedSite})
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {INJECTION_SITES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSite(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    site === s ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Observação</span>
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <Button type="button" onClick={submit} className="w-full">
            Salvar aplicação
          </Button>
        </div>
      </Card>

      <Card title="Histórico">
        {doses.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma aplicação registrada.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {doses.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {formatShort(d.data)} · {d.dose_mg} mg
                  </p>
                  <p className="text-xs text-slate-400">
                    {d.local_aplicacao ?? "sem local"}
                    {d.observacao ? ` · ${d.observacao}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remove("dose_log", d.id)}
                  className="text-xs text-slate-400 active:text-red-600"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
