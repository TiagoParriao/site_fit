-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (Database > SQL Editor).

-- ============ TABELAS ============

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  data_nascimento date not null,
  altura_cm numeric not null,
  meta_kcal_diaria integer not null default 2000,
  avatar_key text not null default 'avatar-1',
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  peso_kg numeric not null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  peso_meta_kg numeric not null,
  data_alvo date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.calorie_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kcal integer not null,
  descricao text,
  data date not null default current_date,
  hora time not null default current_time,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  minutos integer not null,
  kcal_gasta integer not null,
  descricao text,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.main_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null,
  dias_totais integer not null,
  data_inicio date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  invite_code text not null unique,
  kcal_titulo text not null default 'Histórico de calorias',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups add column if not exists kcal_titulo text not null default 'Histórico de calorias';

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists weight_logs_user_data_idx on public.weight_logs (user_id, data);
create index if not exists calorie_logs_user_data_idx on public.calorie_logs (user_id, data);
create index if not exists exercise_logs_user_data_idx on public.exercise_logs (user_id, data);
create index if not exists main_goals_user_idx on public.main_goals (user_id);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- ============ HELPER: usuários que compartilham grupo ============

create or replace function public.shares_group_with(target_user uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = target_user
  );
$$;

-- ============ RLS ============

alter table public.profiles enable row level security;
alter table public.weight_logs enable row level security;
alter table public.weight_goals enable row level security;
alter table public.calorie_logs enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.main_goals enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- profiles: dono edita o próprio; dono e membros do mesmo grupo podem ver
create policy "profiles_select_self_or_group" on public.profiles
  for select using (id = auth.uid() or public.shares_group_with(id));

create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- weight_logs
create policy "weight_logs_select_self_or_group" on public.weight_logs
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "weight_logs_insert_self" on public.weight_logs
  for insert with check (user_id = auth.uid());

create policy "weight_logs_update_self" on public.weight_logs
  for update using (user_id = auth.uid());

create policy "weight_logs_delete_self" on public.weight_logs
  for delete using (user_id = auth.uid());

-- weight_goals
create policy "weight_goals_select_self_or_group" on public.weight_goals
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "weight_goals_insert_self" on public.weight_goals
  for insert with check (user_id = auth.uid());

create policy "weight_goals_update_self" on public.weight_goals
  for update using (user_id = auth.uid());

create policy "weight_goals_delete_self" on public.weight_goals
  for delete using (user_id = auth.uid());

-- calorie_logs
create policy "calorie_logs_select_self_or_group" on public.calorie_logs
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "calorie_logs_insert_self" on public.calorie_logs
  for insert with check (user_id = auth.uid());

create policy "calorie_logs_update_self" on public.calorie_logs
  for update using (user_id = auth.uid());

create policy "calorie_logs_delete_self" on public.calorie_logs
  for delete using (user_id = auth.uid());

-- exercise_logs
create policy "exercise_logs_select_self_or_group" on public.exercise_logs
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "exercise_logs_insert_self" on public.exercise_logs
  for insert with check (user_id = auth.uid());

create policy "exercise_logs_update_self" on public.exercise_logs
  for update using (user_id = auth.uid());

create policy "exercise_logs_delete_self" on public.exercise_logs
  for delete using (user_id = auth.uid());

-- main_goals
create policy "main_goals_select_self_or_group" on public.main_goals
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "main_goals_insert_self" on public.main_goals
  for insert with check (user_id = auth.uid());

create policy "main_goals_update_self" on public.main_goals
  for update using (user_id = auth.uid());

create policy "main_goals_delete_self" on public.main_goals
  for delete using (user_id = auth.uid());

-- groups: apenas membros podem ver o grupo (criação e entrada acontecem via RPCs abaixo)
create policy "groups_select_member" on public.groups
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );

-- qualquer membro do grupo pode editar (usado para o título do painel de kcal)
create policy "groups_update_member" on public.groups
  for update using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );

-- group_members: membros veem outros membros dos grupos que participam
create policy "group_members_select_same_group" on public.group_members
  for select using (public.shares_group_with(user_id) or user_id = auth.uid());

create policy "group_members_delete_self" on public.group_members
  for delete using (user_id = auth.uid());

-- ============ RPCs: criar e entrar em grupo ============
-- Criação/entrada em grupo é feita via função (security definer) porque a linha em
-- "groups" só fica visível para quem já é membro, e o próprio insert de "group_members"
-- precisa acontecer atomicamente junto com a criação/verificação do grupo.

create or replace function public.create_group(p_nome text)
returns public.groups
language plpgsql
security definer
as $$
declare
  v_code text;
  v_group public.groups;
begin
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.groups (nome, invite_code, created_by)
  values (p_nome, v_code, auth.uid())
  returning * into v_group;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, auth.uid());

  return v_group;
end;
$$;

create or replace function public.join_group_by_code(p_invite_code text)
returns public.groups
language plpgsql
security definer
as $$
declare
  v_group public.groups;
begin
  select * into v_group from public.groups where invite_code = upper(p_invite_code);

  if v_group.id is null then
    raise exception 'Código de convite inválido';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, auth.uid())
  on conflict do nothing;

  return v_group;
end;
$$;

-- ============ MIGRAÇÃO: desafio de grupo, medidas corporais, cor personalizada ============
-- Rode este bloco inteiro no SQL Editor do Supabase (idempotente, pode rodar de novo sem problema).

-- cor personalizada por pessoa (hex, ex: #ff6b6b); se nula, usa a cor automática por hash do id
alter table public.profiles add column if not exists cor text;

-- desafio agora é do grupo (não mais individual): tem data de início e fim explícitas
alter table public.main_goals add column if not exists group_id uuid references public.groups (id) on delete cascade;
alter table public.main_goals add column if not exists data_fim date;
alter table public.main_goals alter column dias_totais drop not null;

create index if not exists main_goals_group_idx on public.main_goals (group_id);

create or replace function public.is_group_member(target_group uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group and gm.user_id = auth.uid()
  );
$$;

drop policy if exists "main_goals_select_self_or_group" on public.main_goals;
drop policy if exists "main_goals_insert_self" on public.main_goals;
drop policy if exists "main_goals_update_self" on public.main_goals;
drop policy if exists "main_goals_delete_self" on public.main_goals;
drop policy if exists "main_goals_select_group_member" on public.main_goals;
drop policy if exists "main_goals_insert_group_member" on public.main_goals;

create policy "main_goals_select_group_member" on public.main_goals
  for select using (public.is_group_member(group_id));

create policy "main_goals_insert_group_member" on public.main_goals
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

-- medidas corporais: nome livre + valor em cm, um registro por (pessoa, medida, data)
create table if not exists public.measurement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  valor_cm numeric not null,
  data date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, nome, data)
);

create index if not exists measurement_logs_user_idx on public.measurement_logs (user_id, nome, data);

alter table public.measurement_logs enable row level security;

drop policy if exists "measurement_logs_select_self_or_group" on public.measurement_logs;
drop policy if exists "measurement_logs_insert_self" on public.measurement_logs;
drop policy if exists "measurement_logs_update_self" on public.measurement_logs;
drop policy if exists "measurement_logs_delete_self" on public.measurement_logs;

create policy "measurement_logs_select_self_or_group" on public.measurement_logs
  for select using (user_id = auth.uid() or public.shares_group_with(user_id));

create policy "measurement_logs_insert_self" on public.measurement_logs
  for insert with check (user_id = auth.uid());

create policy "measurement_logs_update_self" on public.measurement_logs
  for update using (user_id = auth.uid());

create policy "measurement_logs_delete_self" on public.measurement_logs
  for delete using (user_id = auth.uid());

-- ============ MIGRAÇÃO: tipo de refeição em calorie_logs ============
-- Usado para calcular a média de kcal consumidas por tipo de refeição
-- (café da manhã, almoço, lanche, janta, ceia, outro).

alter table public.calorie_logs add column if not exists tipo_refeicao text;
