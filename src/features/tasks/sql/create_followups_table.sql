-- Create task_followups table
create table if not exists public.task_followups (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  report_date date default now() not null,
  content_progress text not null,
  content_issues text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.task_followups enable row level security;

-- Policies
create policy "Users can view followups on visible tasks"
  on public.task_followups for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_followups.task_id
    )
  );

create policy "Users can insert followups on visible tasks"
  on public.task_followups for insert
  with check (
    auth.uid() = user_id
  );

-- Realtime
alter publication supabase_realtime add table public.task_followups;
