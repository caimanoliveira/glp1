-- Seed (§8). Executar UMA vez após o primeiro login, com o usuário autenticado.
-- Popula profile + 1 dia de nutrição + 1 medição corporal. dose_log fica vazio.
--
-- Uso: rode com o usuário logado (auth.uid() resolvido), ou substitua
-- auth.uid() pelo UUID do usuário ao rodar via SQL editor do Supabase.

insert into profile (
  user_id, altura_cm, sexo, idade, peso_inicial_kg, gordura_pct_inicial,
  proteina_g_alvo, fibra_g_alvo, liquidos_ml_alvo, kcal_alvo, tdee_kcal,
  deficit_max_kcal, gordura_pct_alvo, fator_atividade, esquema_titulacao_mg
)
values (
  auth.uid(), 173, 'M', null, 75.0, 25.1,
  135, 30, 3300, null, null,       -- idade null → kcal_alvo/tdee null até input
  400, null, 1.5, array[2.5, 5.0, 7.5, 10.0, 12.5, 15.0]
)
on conflict (user_id) do nothing;

insert into nutrition_log (user_id, data, proteina_g, fibra_g, liquidos_ml, kcal)
values (auth.uid(), current_date, 135, 28, 2600, 2000)
on conflict (user_id, data) do nothing;

insert into body_log (user_id, data, peso_kg, gordura_pct)
values (auth.uid(), current_date, 75.0, 25.1);
