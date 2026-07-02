-- Modelo de dados (§4). Single-user; toda tabela filtrada por user_id.

create table if not exists profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  altura_cm numeric,
  sexo text check (sexo in ('M', 'F')),
  idade int,
  peso_inicial_kg numeric,
  gordura_pct_inicial numeric,
  proteina_g_alvo int,
  fibra_g_alvo int,
  liquidos_ml_alvo int,
  kcal_alvo int,
  tdee_kcal int,
  deficit_max_kcal int default 400,
  gordura_pct_alvo numeric,
  fator_atividade numeric default 1.5,
  esquema_titulacao_mg numeric[] default array[2.5, 5.0, 7.5, 10.0, 12.5, 15.0]
);

-- registro de dose semanal / titulação
create table if not exists dose_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  dose_mg numeric not null,
  local_aplicacao text,           -- rotação: abdome E/D, coxa E/D, braço E/D
  observacao text
);

-- efeitos colaterais (diário)
create table if not exists symptom_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  nausea int default 0 check (nausea between 0 and 3),
  vomito int default 0 check (vomito between 0 and 3),
  diarreia int default 0 check (diarreia between 0 and 3),
  constipacao int default 0 check (constipacao between 0 and 3),
  dispepsia int default 0 check (dispepsia between 0 and 3),
  saciedade_precoce int default 0 check (saciedade_precoce between 0 and 3),
  dor_abdominal int default 0 check (dor_abdominal between 0 and 3),
  ictericia boolean default false,
  observacao text,
  dias_desde_dose int,            -- calculado a partir do último dose_log
  unique (user_id, data)
);

-- nutrição diária
create table if not exists nutrition_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  proteina_g numeric default 0,
  fibra_g numeric default 0,
  liquidos_ml numeric default 0,
  kcal numeric default 0,
  unique (user_id, data)
);

-- peso e composição
create table if not exists body_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  peso_kg numeric,
  gordura_pct numeric
);

-- treino de força
create table if not exists training_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  tipo text,                      -- forca / corrida / outro
  duracao_min int,
  observacao text
);

create index if not exists dose_log_user_data_idx on dose_log (user_id, data);
create index if not exists symptom_log_user_data_idx on symptom_log (user_id, data);
create index if not exists nutrition_log_user_data_idx on nutrition_log (user_id, data);
create index if not exists body_log_user_data_idx on body_log (user_id, data);
create index if not exists training_log_user_data_idx on training_log (user_id, data);
