-- RLS (§2): toda tabela filtrada por user_id = auth.uid().
-- App single-user: cada linha pertence ao dono autenticado.

alter table profile enable row level security;
alter table dose_log enable row level security;
alter table symptom_log enable row level security;
alter table nutrition_log enable row level security;
alter table body_log enable row level security;
alter table training_log enable row level security;

-- Uma policy "owner" por tabela cobre select/insert/update/delete.
do $$
declare
  t text;
begin
  foreach t in array array['profile', 'dose_log', 'symptom_log', 'nutrition_log', 'body_log', 'training_log']
  loop
    execute format('drop policy if exists owner_all on %I;', t);
    execute format(
      'create policy owner_all on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;
