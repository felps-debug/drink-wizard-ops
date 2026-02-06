-- Create assignments table
create table if not exists magodosdrinks_assignments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rate numeric not null default 0,
  status text check (status in ('pending', 'confirmed', 'declined')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table magodosdrinks_assignments enable row level security;

-- Policies
create policy "Admins can manage assignments"
  on magodosdrinks_assignments
  for all
  to authenticated
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.cargo = 'admin'
  ));

create policy "Staff can view their own assignments"
  on magodosdrinks_assignments
  for select
  to authenticated
  using (user_id = auth.uid());
