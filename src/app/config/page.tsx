"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { clampKcalTarget, estimateTDEE } from "@/lib/calc";
import { SUBSTITUTIONS } from "@/lib/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AlertBanner, Button, Card, NumberField, PageTitle, Stat } from "@/components/ui";

export default function ConfigPage() {
  const { data, updateProfile, reset } = useStore();
  const p = data.profile;

  const [idade, setIdade] = useState<number | "">(p.idade ?? "");
  const [fator, setFator] = useState<number>(p.fator_atividade);
  const [kcalDesejado, setKcalDesejado] = useState<number | "">(p.kcal_alvo ?? "");
  const [proteina, setProteina] = useState<number | "">(p.proteina_g_alvo);
  const [fibra, setFibra] = useState<number | "">(p.fibra_g_alvo);
  const [liquidos, setLiquidos] = useState<number | "">(p.liquidos_ml_alvo);
  const [gordAlvo, setGordAlvo] = useState<number | "">(p.gordura_pct_alvo ?? "");
  const [esquema, setEsquema] = useState<string>(p.esquema_titulacao_mg.join(", "));

  const latestWeight =
    [...data.body_log].sort((a, b) => (a.data < b.data ? 1 : -1))[0]?.peso_kg ?? p.peso_inicial_kg;

  const idadeNum = idade === "" ? null : Number(idade);
  const tdee = estimateTDEE(latestWeight, p.altura_cm, idadeNum, p.sexo, fator);
  const clamp = clampKcalTarget(
    kcalDesejado === "" ? tdee ?? 0 : Number(kcalDesejado),
    tdee,
    p.deficit_max_kcal
  );

  function save() {
    updateProfile({
      idade: idadeNum,
      fator_atividade: fator,
      tdee_kcal: tdee,
      kcal_alvo: clamp.value,
      proteina_g_alvo: proteina === "" ? p.proteina_g_alvo : Number(proteina),
      fibra_g_alvo: fibra === "" ? p.fibra_g_alvo : Number(fibra),
      liquidos_ml_alvo: liquidos === "" ? p.liquidos_ml_alvo : Number(liquidos),
      gordura_pct_alvo: gordAlvo === "" ? null : Number(gordAlvo),
      esquema_titulacao_mg: parseEsquema(esquema, p.esquema_titulacao_mg),
    });
  }

  return (
    <div className="space-y-4">
      <PageTitle subtitle="Metas, idade (TDEE), titulação">Config</PageTitle>

      {idadeNum == null && (
        <AlertBanner
          alert={{
            id: "tdee-indisponivel",
            severity: "info",
            title: "TDEE indisponível",
            message: "Informe a idade para calcular o gasto energético (Mifflin-St Jeor) e a meta calórica.",
          }}
        />
      )}

      <Card title="Perfil & energia">
        <div className="space-y-3">
          <NumberField label="Idade" value={idade} onChange={setIdade} unit="anos" placeholder="informe a idade" />
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Fator de atividade: {fator.toFixed(2)} (1,40–1,60)
            </span>
            <input
              type="range"
              min={1.4}
              max={1.6}
              step={0.05}
              value={fator}
              onChange={(e) => setFator(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="TDEE estimado" value={tdee ?? "—"} sub={tdee ? "kcal/dia" : "informe idade"} />
            <Stat
              label="Piso de kcal"
              value={clamp.floor ?? "—"}
              sub={`TDEE − ${p.deficit_max_kcal}`}
            />
          </div>

          <NumberField
            label="Meta calórica desejada"
            value={kcalDesejado}
            onChange={setKcalDesejado}
            unit="kcal"
            placeholder={tdee ? String(tdee - 350) : "—"}
          />
          {clamp.clamped && (
            <AlertBanner
              alert={{
                id: "trava-deficit",
                severity: "warn",
                title: "Meta ajustada pela trava anti-déficit",
                message: `Meta abaixo do piso (${clamp.floor} kcal). Em GLP-1 o risco é subalimentação + perda de massa magra. A meta será salva como ${clamp.value} kcal.`,
              }}
            />
          )}
        </div>
      </Card>

      <Card title="Metas de nutrição">
        <div className="space-y-3">
          <NumberField label="Proteína alvo" value={proteina} onChange={setProteina} unit="g" />
          <p className="-mt-2 text-xs text-slate-400">
            Sugestão p/ {latestWeight} kg: {Math.round(latestWeight * 1.6)}–{Math.round(latestWeight * 2.0)} g
          </p>
          <NumberField label="Fibra alvo" value={fibra} onChange={setFibra} unit="g" />
          <NumberField label="Líquidos alvo" value={liquidos} onChange={setLiquidos} unit="ml" />
          <NumberField
            label="% Gordura alvo (opcional)"
            value={gordAlvo}
            onChange={setGordAlvo}
            step={0.1}
            unit="%"
          />
        </div>
      </Card>

      <Card title="Esquema de titulação">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Doses (mg), separadas por vírgula</span>
          <input
            value={esquema}
            onChange={(e) => setEsquema(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </Card>

      <Button onClick={save} className="w-full">
        Salvar configurações
      </Button>

      <Card title="Substituições">
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-700">Proteína:</span>{" "}
            {SUBSTITUTIONS.proteina.join(" · ")}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Carbo:</span>{" "}
            {SUBSTITUTIONS.carbo.join(" · ")}
          </p>
        </div>
      </Card>

      <Card title="Dados">
        <p className="mb-2 text-xs text-slate-500">
          Armazenamento: {isSupabaseConfigured() ? "Supabase (sincronizado)" : "local (este dispositivo)"}.
        </p>
        <Button variant="danger" onClick={reset} className="w-full">
          Restaurar dados iniciais (seed)
        </Button>
      </Card>

      <p className="px-1 pb-2 text-center text-xs leading-snug text-slate-400">
        Registros inseridos por você; não é orientação médica. Dose e sintomas devem ser
        acompanhados pelo prescritor.
      </p>
    </div>
  );
}

function parseEsquema(input: string, fallback: number[]): number[] {
  const parsed = input
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return parsed.length ? parsed : fallback;
}
