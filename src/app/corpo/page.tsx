"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { compositionDelta, leanMassKg } from "@/lib/calc";
import { AlertBanner, Button, Card, NumberField, PageTitle, Stat } from "@/components/ui";
import { LineChart, type Point } from "@/components/charts";

export default function CorpoPage() {
  const { data, today, addBody, remove } = useStore();
  const logs = [...data.body_log].sort((a, b) => (a.data < b.data ? -1 : 1));

  const [date, setDate] = useState(today);
  const [peso, setPeso] = useState<number | "">("");
  const [gordura, setGordura] = useState<number | "">("");

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const delta = logs.length >= 2 ? compositionDelta(first, latest) : null;

  const pesoPoints: Point[] = logs.map((l, i) => ({ x: i, y: l.peso_kg }));
  const leanPoints: Point[] = logs
    .filter((l) => l.gordura_pct != null)
    .map((l) => ({ x: logs.indexOf(l), y: leanMassKg(l.peso_kg, l.gordura_pct as number) }));

  function submit() {
    if (peso === "") return;
    addBody({
      data: date,
      peso_kg: Number(peso),
      gordura_pct: gordura === "" ? null : Number(gordura),
    });
    setPeso("");
    setGordura("");
  }

  return (
    <div className="space-y-4">
      <PageTitle subtitle="Peso, composição e — o mais importante — massa magra">Corpo</PageTitle>

      {delta?.leanLossWhileLosingWeight && (
        <AlertBanner
          alert={{
            id: "massa-magra",
            severity: "warn",
            title: "Massa magra caindo junto com o peso",
            message: `Peso ${delta.pesoDelta} kg e massa magra ${delta.leanDelta} kg desde o início. Em GLP-1 o objetivo é perder gordura preservando massa magra — reforce proteína e treino de força.`,
          }}
        />
      )}

      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Peso" value={`${latest.peso_kg}`} sub="kg" />
          <Stat
            label="Massa magra"
            value={latest.gordura_pct != null ? leanMassKg(latest.peso_kg, latest.gordura_pct) : "—"}
            sub="kg"
            tone={delta?.leanLossWhileLosingWeight ? "bad" : "good"}
          />
          <Stat
            label="% Gordura"
            value={latest.gordura_pct != null ? `${latest.gordura_pct}` : "—"}
            sub="%"
          />
        </div>
      )}

      {delta && (
        <Card title="Variação desde o início">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-slate-500">Peso</p>
              <p className="font-semibold">{signed(delta.pesoDelta)} kg</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Massa magra</p>
              <p className={`font-semibold ${delta.leanDelta != null && delta.leanDelta < 0 ? "text-red-600" : "text-brand"}`}>
                {delta.leanDelta != null ? `${signed(delta.leanDelta)} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Massa gorda</p>
              <p className="font-semibold">{delta.fatDelta != null ? `${signed(delta.fatDelta)} kg` : "—"}</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Evolução">
        <LineChart
          yUnit="(kg)"
          series={[
            { name: "Peso", color: "#0d9488", points: pesoPoints },
            { name: "Massa magra", color: "#f59e0b", points: leanPoints },
          ]}
        />
      </Card>

      <Card title="Nova medição">
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
          <NumberField label="Peso" value={peso} onChange={setPeso} step={0.1} unit="kg" placeholder="75.0" />
          <NumberField
            label="% Gordura (opcional)"
            value={gordura}
            onChange={setGordura}
            step={0.1}
            unit="%"
            placeholder="25.1"
          />
          <Button onClick={submit} className="w-full" disabled={peso === ""}>
            Salvar medição
          </Button>
        </div>
      </Card>

      <Card title="Histórico">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Sem medições.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...logs].reverse().map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {formatShort(l.data)} · {l.peso_kg} kg
                  {l.gordura_pct != null ? ` · ${l.gordura_pct}%` : ""}
                </span>
                <button
                  onClick={() => remove("body_log", l.id)}
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

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
