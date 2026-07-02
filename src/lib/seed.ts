// Dados iniciais (§3, §8). Populados no primeiro run (modo local).
import { estimateTDEE } from "./calc";
import type { AppData, NutritionLog, Profile } from "./types";

export const MEAL_TEMPLATE = [
  { refeicao: "Café", exemplo: "3 ovos + 1 fatia pão integral + 1 fruta", proteina_g: 22 },
  { refeicao: "Lanche 1", exemplo: "Iogurte grego 200g (+whey se preciso)", proteina_g: 28 },
  {
    refeicao: "Almoço",
    exemplo: "150g frango/patinho/tilápia + arroz/batata-doce + feijão + legumes",
    proteina_g: 40,
  },
  { refeicao: "Pós-treino", exemplo: "1 scoop whey ou cottage", proteina_g: 25 },
  { refeicao: "Jantar", exemplo: "130g proteína magra + legumes + carbo moderado", proteina_g: 30 },
] as const;

export const SUBSTITUTIONS = {
  proteina: [
    "frango",
    "patinho",
    "coxão mole",
    "peixe branco",
    "ovos+claras",
    "tofu",
    "proteína de soja",
    "whey",
    "iogurte grego",
    "cottage",
  ],
  carbo: ["arroz", "batata-doce", "mandioca", "aveia"],
} as const;

export function defaultProfile(): Profile {
  // idade desconhecida → TDEE/kcal ficam null até input.
  const idade = null;
  const fator = 1.5; // fator de atividade default (faixa 1,4–1,6)
  const tdee = estimateTDEE(75.0, 173, idade, "M", fator); // null enquanto idade null
  return {
    altura_cm: 173,
    sexo: "M",
    idade,
    peso_inicial_kg: 75.0,
    gordura_pct_inicial: 25.1,
    proteina_g_alvo: 135,
    fibra_g_alvo: 30,
    liquidos_ml_alvo: 3300,
    kcal_alvo: null,
    tdee_kcal: tdee,
    deficit_max_kcal: 400,
    gordura_pct_alvo: null,
    fator_atividade: fator,
    esquema_titulacao_mg: [2.5, 5.0, 7.5, 10.0, 12.5, 15.0],
  };
}

// nutrition_log de exemplo: 1 dia somando ~135g proteína / ~2000 kcal.
function seedNutrition(todayISO: string): NutritionLog {
  return {
    id: "seed-nutrition-1",
    data: todayISO,
    proteina_g: 135,
    fibra_g: 28,
    liquidos_ml: 2600,
    kcal: 2000,
  };
}

export function seedData(todayISO: string): AppData {
  return {
    profile: defaultProfile(),
    dose_log: [], // vazio — usuário insere a 1ª aplicação
    symptom_log: [],
    nutrition_log: [seedNutrition(todayISO)],
    body_log: [
      {
        id: "seed-body-1",
        data: todayISO,
        peso_kg: 75.0,
        gordura_pct: 25.1,
      },
    ],
    training_log: [],
  };
}
