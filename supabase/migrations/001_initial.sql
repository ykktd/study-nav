-- subjects table
create table if not exists subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  professor   text,
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

-- Policies: authenticated users have full access
create policy "auth users can select subjects"
  on subjects for select to authenticated using (true);
create policy "auth users can insert subjects"
  on subjects for insert to authenticated with check (true);
create policy "auth users can update subjects"
  on subjects for update to authenticated using (true);
create policy "auth users can delete subjects"
  on subjects for delete to authenticated using (true);

create policy "auth users can select resources"
  on resources for select to authenticated using (true);
create policy "auth users can insert resources"
  on resources for insert to authenticated with check (true);
create policy "auth users can update resources"
  on resources for update to authenticated using (true);
create policy "auth users can delete resources"
  on resources for delete to authenticated using (true);
