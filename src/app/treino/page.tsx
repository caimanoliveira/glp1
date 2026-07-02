"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { parseISODate } from "@/lib/calc";
import { Button, Card, PageTitle, Stat } from "@/components/ui";
import type { TrainingType } from "@/lib/types";

const TYPE_LABELS: Record<TrainingType, string> = {
  forca: "Força",
  corrida: "Corrida",
  outro: "Outro",
};

export default function TreinoPage() {
  const { data, today, addTraining, remove } = useStore();
  const logs = [...data.training_log].sort((a, b) => (a.data < b.data ? 1 : -1));

  const [date, setDate] = useState(today);
  const [tipo, setTipo] = useState<TrainingType>("forca");
  const [duracao, setDuracao] = useState<number>(45);
  const [obs, setObs] = useState("");

  // Contador de sessões de força na semana corrente (segunda a domingo).
  const { start, end } = currentWeek(today);
  const forcaSemana = data.training_log.filter(
    (l) => l.tipo === "forca" && l.data >= start && l.data <= end
  ).length;
  const META_FORCA = 3; // meta 2–4

  function submit() {
    addTraining({
      data: date,
      tipo,
      duracao_min: duracao,
      observacao: obs.trim() || null,
    });
    setObs("");
  }

  return (
    <div className="space-y-4">
      <PageTitle subtitle="Treino de força preserva massa magra no ciclo">Treino</PageTitle>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Força esta semana"
          value={`${forcaSemana} / ${META_FORCA}`}
          sub="meta 2–4 sessões"
          tone={forcaSemana >= 2 ? "good" : "default"}
        />
        <Stat label="Sessões totais" value={logs.length} sub="registradas" />
      </div>

      <Card title="Registrar sessão">
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
            <span className="text-xs font-medium text-slate-600">Tipo</span>
            <div className="mt-1 flex gap-2">
              {(Object.keys(TYPE_LABELS) as TrainingType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    tipo === t ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Duração: {duracao} min</span>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Observação</span>
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <Button onClick={submit} className="w-full">
            Salvar sessão
          </Button>
        </div>
      </Card>

      <Card title="Histórico">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Sem sessões registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {formatShort(l.data)} · {TYPE_LABELS[l.tipo]} · {l.duracao_min} min
                  {l.observacao ? ` · ${l.observacao}` : ""}
                </span>
                <button
                  onClick={() => remove("training_log", l.id)}
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

// Semana corrente (segunda 00:00 a domingo) contendo `todayISO`.
function currentWeek(todayISO: string): { start: string; end: string } {
  const d = parseISODate(todayISO);
  const dow = (d.getDay() + 6) % 7; // 0 = segunda
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: iso(monday), end: iso(sunday) };
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatShort(isoStr: string): string {
  const d = new Date(isoStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
