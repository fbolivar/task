-- Create task_comments table
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text default 'comment' check (type in ('comment', 'system'))
);

-- Enable RLS
alter table public.task_comments enable row level security;

-- Policies
create policy "Users can view comments on visible tasks"
  on public.task_comments for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_comments.task_id
      -- Add detailed task visibility logic here if needed, 
      -- for now usually if they can see the task, they can see comments
    )
  );

create policy "Users can insert comments on visible tasks"
  on public.task_comments for insert
  with check (
    auth.uid() = user_id
  );

-- Optional: Realtime
alter publication supabase_realtime add table public.task_comments;
