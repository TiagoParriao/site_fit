# Fit Trail

Site para contar calorias e peso com um grupo fechado de amigos. Cada pessoa cadastra seu peso, altura e meta de calorias diárias; conforme bate a meta do dia, o avatar dela avança numa trilha semanal, com medalha para quem completar primeiro.

Stack: React + Vite, Supabase (Postgres + Auth), hospedado no GitHub Pages.

## 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em [supabase.com](https://supabase.com).
2. Em **Authentication → Providers → Email**, desative "Confirm email" (assim a conta já entra logo após o cadastro; pode reativar depois se quiser mais segurança).
3. Em **Database → SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Isso cria as tabelas, as políticas de RLS e as funções de criar/entrar em grupo.
4. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env   # cole a URL e a anon key do Supabase
npm run dev
```

## 3. Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba o projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git add .
   git commit -m "primeira versão"
   git push -u origin main
   ```
2. No repositório, vá em **Settings → Pages** e mude "Source" para **GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions**, crie os secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Se o nome do repositório não for `site_fit`, edite `base` em [`vite.config.js`](vite.config.js) para `/SEU_REPO/`.
5. Todo push na branch `main` builda e publica automaticamente (veja [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). O site fica em `https://SEU_USUARIO.github.io/SEU_REPO/`.

## Como funciona a trilha semanal

- A semana vai de segunda a domingo.
- Um dia "conta" quando a soma das calorias registradas naquele dia é maior que zero e menor ou igual à meta diária da pessoa.
- A meta da semana (padrão: 5 dias) e as medalhas (🥇🥈🥉) são calculadas com base em quem bateu os dias primeiro, olhando as datas dentro da própria semana.
- Ver [`src/lib/weeklyProgress.js`](src/lib/weeklyProgress.js) e [`src/components/ProgressTrail.jsx`](src/components/ProgressTrail.jsx).

## Estrutura

```
src/
  lib/supabaseClient.js      # cliente do Supabase
  lib/weeklyProgress.js      # cálculo da trilha semanal
  context/AuthContext.jsx    # sessão, perfil, signup/login/logout
  routes/                    # páginas: Login, Signup, Dashboard, Weight, Calories, Group
  components/                # NavBar, ProtectedRoute, ProgressTrail, MedalBadge, gráficos, etc.
supabase/schema.sql           # schema completo do banco (rodar no Supabase)
```
