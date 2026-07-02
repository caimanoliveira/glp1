// Domain types. Field names mirror the Postgres schema in /supabase/migrations.

export type Sexo = "M" | "F";

export interface Profile {
  altura_cm: number;
  sexo: Sexo;
  idade: number | null; // DESCONHECIDO até o usuário informar; bloqueia TDEE
  peso_inicial_kg: number;
  gordura_pct_inicial: number;
  proteina_g_alvo: number;
  fibra_g_alvo: number;
  liquidos_ml_alvo: number;
  kcal_alvo: number | null; // null quando idade desconhecida
  tdee_kcal: number | null; // null quando idade desconhecida
  deficit_max_kcal: number;
  gordura_pct_alvo: number | null;
  fator_atividade: number; // 1.4–1.6 (Mifflin-St Jeor)
  esquema_titulacao_mg: number[];
}

export interface DoseLog {
  id: string;
  data: string; // ISO date (YYYY-MM-DD)
  dose_mg: number;
  local_aplicacao: string | null;
  observacao: string | null;
}

export interface SymptomLog {
  id: string;
  data: string;
  nausea: number; // 0–3
  vomito: number;
  diarreia: number;
  constipacao: number;
  dispepsia: number;
  saciedade_precoce: number;
  dor_abdominal: number;
  ictericia: boolean; // bandeira vermelha adicional
  observacao: string | null;
  dias_desde_dose: number | null; // derivado do último dose_log
}

export interface NutritionLog {
  id: string;
  data: string;
  proteina_g: number;
  fibra_g: number;
  liquidos_ml: number;
  kcal: number;
}

export interface BodyLog {
  id: string;
  data: string;
  peso_kg: number;
  gordura_pct: number | null;
}

export type TrainingType = "forca" | "corrida" | "outro";

export interface TrainingLog {
  id: string;
  data: string;
  tipo: TrainingType;
  duracao_min: number;
  observacao: string | null;
}

export interface AppData {
  profile: Profile;
  dose_log: DoseLog[];
  symptom_log: SymptomLog[];
  nutrition_log: NutritionLog[];
  body_log: BodyLog[];
  training_log: TrainingLog[];
}

// Aplicação: locais de rotação sugeridos para injeção subcutânea.
export const INJECTION_SITES = [
  "Abdome E",
  "Abdome D",
  "Coxa E",
  "Coxa D",
  "Braço E",
  "Braço D",
] as const;

export const SYMPTOM_KEYS = [
  "nausea",
  "vomito",
  "diarreia",
  "constipacao",
  "dispepsia",
  "saciedade_precoce",
  "dor_abdominal",
] as const;

export type SymptomKey = (typeof SYMPTOM_KEYS)[number];

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  nausea: "Náusea",
  vomito: "Vômito",
  diarreia: "Diarreia",
  constipacao: "Constipação",
  dispepsia: "Dispepsia",
  saciedade_precoce: "Saciedade precoce",
  dor_abdominal: "Dor abdominal",
};

export const INTENSITY_LABELS = ["Ausente", "Leve", "Moderado", "Grave"] as const;
