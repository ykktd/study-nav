-- subjects table
create table if not exists subjects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  day_period  text,
  exam_date   date,
  term        text not null,
  is_archived boolean not null default false,
  pinned      boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- resources table
create table if not exists resources (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  category    text not null check (category in ('past_exam', 'lecture', 'other')),
  name        text not null,
  url         text not null,
  done        boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS: enable row level security
alter table subjects enable row level security;
alter table resources enable row level security;

-- Policies: users can only access their own subjects
create policy "users can select own subjects"
  on subjects for select to authenticated using (auth.uid() = user_id);
create policy "users can insert own subjects"
  on subjects for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own subjects"
  on subjects for update to authenticated using (auth.uid() = user_id);
create policy "users can delete own subjects"
  on subjects for delete to authenticated using (auth.uid() = user_id);

-- Policies: users can only access resources belonging to their own subjects
create policy "users can select own resources"
  on resources for select to authenticated
  using (exists (select 1 from subjects where subjects.id = resources.subject_id and subjects.user_id = auth.uid()));
create policy "users can insert own resources"
  on resources for insert to authenticated
  with check (exists (select 1 from subjects where subjects.id = resources.subject_id and subjects.user_id = auth.uid()));
create policy "users can update own resources"
  on resources for update to authenticated
  using (exists (select 1 from subjects where subjects.id = resources.subject_id and subjects.user_id = auth.uid()));
create policy "users can delete own resources"
  on resources for delete to authenticated
  using (exists (select 1 from subjects where subjects.id = resources.subject_id and subjects.user_id = auth.uid()));
