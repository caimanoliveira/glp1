# Acompanhamento Tirzepatida

App pessoal (single-user) para acompanhar um ciclo de tirzepatida: dose/titulação,
efeitos colaterais GI, adesão a proteína/hidratação/fibra, peso e composição
corporal, e treino de força (preservação de massa magra).

> **Registros inseridos por você; não é orientação médica. Dose e sintomas devem
> ser acompanhados pelo prescritor.**

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript + Tailwind CSS — PWA mobile-first, instalável.
- **Persistência:** por padrão, `localStorage` do navegador (modo local, zero-config).
  Quando as variáveis do Supabase estão definidas, o app pode sincronizar via
  **Supabase** (Postgres + Auth + RLS). Ver [`supabase/migrations`](./supabase/migrations).
- **Offline-first:** service worker (`public/sw.js`) cacheia o app shell (fase 1 básica).

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
```

Outros scripts: `npm run build`, `npm run start`, `npm run typecheck`,
`npm run lint`, `npm run test`.

Ao abrir pela primeira vez, o app popula os dados de seed (§3/§8 do prompt):
perfil inicial, 1 dia de nutrição de exemplo (~135 g proteína / ~2000 kcal) e a
1ª medição corporal. O `dose_log` começa vazio.

### Supabase (opcional)

1. Crie um projeto no Supabase e rode as migrações em ordem:
   `supabase/migrations/0001_schema.sql`, `0002_rls.sql` e (após o 1º login)
   `0003_seed.sql`.
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL`
   e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. RLS: todas as tabelas têm a policy `owner_all` filtrando por `user_id = auth.uid()`.

## Deploy (Cloudflare)

O app é exportado como site estático (`output: "export"` → `./out`) e servido no
**Cloudflare Workers (static assets)** — config em [`wrangler.toml`](./wrangler.toml).

**Automático (CI):** `.github/workflows/deploy.yml` faz build + deploy a cada push
no `main`. Defina dois secrets no repositório (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — token com permissão *Workers Scripts: Edit*.
- `CLOUDFLARE_ACCOUNT_ID` — ID da sua conta Cloudflare.

**Manual (local):**

```bash
npm run deploy      # roda build e `wrangler deploy` (requer `wrangler login`)
```

Sem env vars o app funciona em modo local (localStorage). Para sincronizar via
Supabase em produção, adicione `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` como variáveis de build no Cloudflare.

## Telas

| Tela | O que faz |
| --- | --- |
| **Hoje** | Progresso do dia (proteína/líquidos/fibra/kcal), adicionar do template, registro manual, resumo de dose e sintomas. |
| **Dose** | Próxima aplicação (últ. + 7 dias), dose atual, rotação de local sugerida, histórico, aviso na janela pós-aumento de dose. |
| **Sintomas** | Sliders 0–3 por sintoma + icterícia; gráfico intensidade × dias desde a dose. |
| **Corpo** | Peso e % gordura; deriva massa magra e sinaliza queda de massa magra mesmo com peso caindo. |
| **Treino** | Log de sessões; contador de sessões de força na semana (meta 2–4). |
| **Config** | Metas, idade (recalcula TDEE), fator de atividade, trava anti-déficit, esquema de titulação. |

## Regras de cálculo (`src/lib/calc.ts`, testadas em `calc.test.ts`)

- **Proteína-alvo:** `peso × [1,6–2,0] g/kg` (faixa exibida, alvo operacional destacado).
- **TDEE (Mifflin-St Jeor, homem):** `10×peso + 6,25×altura − 5×idade + 5`, × fator
  de atividade (1,4–1,6). **Bloqueado enquanto a idade for desconhecida.**
- **Trava anti-déficit:** `kcal_alvo` nunca abaixo de `TDEE − 400`.
- **Massa magra:** `peso × (1 − %gordura/100)`; sinaliza queda entre dois registros.
- **Adesão proteica:** % de dias com `proteina_g ≥ min`.

## Alertas de segurança (§7)

- 🚨 **Bandeira vermelha:** dor abdominal grave + náusea/vômito (possível pancreatite);
  vômito/diarreia grave persistente (desidratação/rim); icterícia.
- ⚠️ Constipação ≥ 2 por ≥ 2 dias → reforço de fibra + líquidos.
- ⚠️ Sintomas GI ativos com líquidos abaixo do alvo → reforço de hidratação.

## Não-objetivos

Sem recomendação/titulação automática de dose, sem diagnóstico clínico (além do
gatilho de bandeira vermelha), sem multiusuário/social, sem integração com farmácia.

## Limitações embutidas

- **Idade desconhecida** → TDEE e meta calórica ficam indisponíveis até ser
  informada. (confiança: n/a até input)
- **Dose de proteína:** a faixa 1,2–1,6 g/kg (até ~2,0 com treino de força) vem de
  diretrizes (OMA/AACE) e estudos de perda de peso em outras populações; **não há
  RCT definindo a dose ideal em usuários de GLP-1**. (confiança: moderada)
- **IMC 25,1** está abaixo do limiar padrão de indicação da tirzepatida para
  controle de peso (≥30, ou ≥27 c/ comorbidade). O app não valida indicação;
  apenas registra. (confiança: alta, fonte reguladora)
