-- Todos 应用数据库 schema
-- 在 Supabase Dashboard > SQL Editor 中执行本文件即可初始化表结构。
-- ============================================================

-- 待办事项表
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  completed   boolean not null default false,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 自动更新触发器
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_todos_updated_at on public.todos;
create trigger trg_todos_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();

-- 启用行级安全
alter table public.todos enable row level security;

-- 演示用宽松策略：允许匿名读写。
-- 生产环境应改为基于 auth.uid() 的策略，例如：
--   create policy "todos belong to user" on public.todos
--     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "todos public access" on public.todos;
create policy "todos public access" on public.todos
  for all using (true) with check (true);

-- 启用 realtime（可选，便于后续做实时同步）
alter table public.todos replica identity full;
