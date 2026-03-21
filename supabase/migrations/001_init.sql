-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin can read all profiles (needed to list clients)
create policy "Admin can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  client_id uuid references public.profiles(id) on delete set null,
  total_price numeric not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'ready_for_review', 'complete')),
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Admin full access to projects"
  on public.projects for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Client reads own projects"
  on public.projects for select
  using (client_id = auth.uid());

-- ============================================================
-- PAGES
-- ============================================================
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  order_index integer not null default 0,
  template_type text not null default 'blank'
    check (template_type in ('cover', 'full_image', 'text_image', 'prompt_lines', 'blank')),
  content jsonb not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  rejection_notes text,
  reviewed_at timestamptz
);

alter table public.pages enable row level security;

create policy "Admin full access to pages"
  on public.pages for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Client reads pages of own projects"
  on public.pages for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = pages.project_id
        and projects.client_id = auth.uid()
    )
  );

-- ============================================================
-- SECTIONS
-- ============================================================
create table public.sections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  page_start integer not null,
  page_end integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  client_notes text,
  reviewed_at timestamptz
);

alter table public.sections enable row level security;

create policy "Admin full access to sections"
  on public.sections for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Client reads own project sections"
  on public.sections for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = sections.project_id
        and projects.client_id = auth.uid()
    )
  );

create policy "Client updates own project sections"
  on public.sections for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = sections.project_id
        and projects.client_id = auth.uid()
    )
  );

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone integer not null check (milestone in (25, 50, 75, 100)),
  stripe_invoice_id text,
  stripe_customer_id text,
  amount numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'paid')),
  created_at timestamptz default now(),
  unique (project_id, milestone)
);

alter table public.invoices enable row level security;

create policy "Admin full access to invoices"
  on public.invoices for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Client reads own project invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = invoices.project_id
        and projects.client_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET (run separately in Supabase dashboard or via CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('project-assets', 'project-assets', false);
--
-- create policy "Admin can upload assets"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'project-assets' and
--     exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
--   );
--
-- create policy "Admin can read assets"
--   on storage.objects for select
--   using (
--     bucket_id = 'project-assets' and
--     exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
--   );
--
-- create policy "Client can read assets for own projects"
--   on storage.objects for select
--   using (
--     bucket_id = 'project-assets' and
--     exists (
--       select 1 from public.projects
--       where projects.client_id = auth.uid()
--         and (storage.objects.name like projects.id::text || '/%')
--     )
--   );
