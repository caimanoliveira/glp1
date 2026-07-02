"use client";

// Store single-user do app. Por padrão persiste no localStorage do navegador
// (modo local, zero-config). Quando NEXT_PUBLIC_SUPABASE_URL/ANON_KEY estão
// definidos, o app pode sincronizar via Supabase (ver src/lib/supabase e
// /supabase/migrations). O seam de persistência está isolado em load()/save().

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toISODate } from "./calc";
import { seedData } from "./seed";
import type {
  AppData,
  BodyLog,
  DoseLog,
  NutritionLog,
  Profile,
  SymptomLog,
  TrainingLog,
} from "./types";

const STORAGE_KEY = "tirze:appdata:v1";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function todayISO(): string {
  return toISODate(new Date());
}

function load(): AppData {
  if (typeof window === "undefined") return seedData(todayISO());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData(todayISO());
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return seedData(todayISO());
  }
}

function save(data: AppData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — ignora */
  }
}

interface StoreApi {
  data: AppData;
  ready: boolean;
  today: string;
  updateProfile: (patch: Partial<Profile>) => void;
  // upsert por data (um registro por dia) para logs diários
  upsertNutrition: (data: string, patch: Partial<Omit<NutritionLog, "id" | "data">>) => void;
  upsertSymptom: (data: string, patch: Partial<Omit<SymptomLog, "id" | "data">>) => void;
  addDose: (entry: Omit<DoseLog, "id">) => void;
  addBody: (entry: Omit<BodyLog, "id">) => void;
  addTraining: (entry: Omit<TrainingLog, "id">) => void;
  remove: (table: "dose_log" | "body_log" | "training_log", id: string) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => seedData(todayISO()));
  const [ready, setReady] = useState(false);
  const today = todayISO();

  useEffect(() => {
    setData(load());
    setReady(true);
  }, []);

  const commit = useCallback((next: AppData) => {
    setData(next);
    save(next);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => commit({ ...data, profile: { ...data.profile, ...patch } }),
    [data, commit]
  );

  const upsertNutrition = useCallback(
    (date: string, patch: Partial<Omit<NutritionLog, "id" | "data">>) => {
      const existing = data.nutrition_log.find((n) => n.data === date);
      let nutrition_log: NutritionLog[];
      if (existing) {
        nutrition_log = data.nutrition_log.map((n) =>
          n.data === date ? { ...n, ...patch } : n
        );
      } else {
        const fresh: NutritionLog = {
          id: genId(),
          data: date,
          proteina_g: 0,
          fibra_g: 0,
          liquidos_ml: 0,
          kcal: 0,
          ...patch,
        };
        nutrition_log = [...data.nutrition_log, fresh];
      }
      commit({ ...data, nutrition_log });
    },
    [data, commit]
  );

  const upsertSymptom = useCallback(
    (date: string, patch: Partial<Omit<SymptomLog, "id" | "data">>) => {
      const existing = data.symptom_log.find((s) => s.data === date);
      let symptom_log: SymptomLog[];
      if (existing) {
        symptom_log = data.symptom_log.map((s) => (s.data === date ? { ...s, ...patch } : s));
      } else {
        const fresh: SymptomLog = {
          id: genId(),
          data: date,
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
          ...patch,
        };
        symptom_log = [...data.symptom_log, fresh];
      }
      commit({ ...data, symptom_log });
    },
    [data, commit]
  );

  const addDose = useCallback(
    (entry: Omit<DoseLog, "id">) =>
      commit({ ...data, dose_log: [...data.dose_log, { ...entry, id: genId() }] }),
    [data, commit]
  );

  const addBody = useCallback(
    (entry: Omit<BodyLog, "id">) =>
      commit({ ...data, body_log: [...data.body_log, { ...entry, id: genId() }] }),
    [data, commit]
  );

  const addTraining = useCallback(
    (entry: Omit<TrainingLog, "id">) =>
      commit({ ...data, training_log: [...data.training_log, { ...entry, id: genId() }] }),
    [data, commit]
  );

  const remove = useCallback(
    (table: "dose_log" | "body_log" | "training_log", id: string) =>
      commit({ ...data, [table]: data[table].filter((r) => r.id !== id) }),
    [data, commit]
  );

  const reset = useCallback(() => commit(seedData(todayISO())), [commit]);

  const api = useMemo<StoreApi>(
    () => ({
      data,
      ready,
      today,
      updateProfile,
      upsertNutrition,
      upsertSymptom,
      addDose,
      addBody,
      addTraining,
      remove,
      reset,
    }),
    [
      data,
      ready,
      today,
      updateProfile,
      upsertNutrition,
      upsertSymptom,
      addDose,
      addBody,
      addTraining,
      remove,
      reset,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}
