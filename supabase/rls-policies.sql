-- 为已有的 public.todo 表(id/title/description/created_at)开放 RLS 策略。
-- 在 Supabase Dashboard > SQL Editor 中执行本文件后,匿名即可读写。
-- ============================================================

-- 确保行级安全已启用
alter table public.todo enable row level security;

-- 删除可能存在的旧策略,再创建仅认证用户可用的策略
drop policy if exists "todo public read" on public.todo;
drop policy if exists "todo public insert" on public.todo;
drop policy if exists "todo public update" on public.todo;
drop policy if exists "todo public delete" on public.todo;

create policy "todo auth read"   on public.todo for select using (auth.role() = 'authenticated');
create policy "todo auth insert" on public.todo for insert with check (auth.role() = 'authenticated');
create policy "todo auth update" on public.todo for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "todo auth delete" on public.todo for delete using (auth.role() = 'authenticated');
