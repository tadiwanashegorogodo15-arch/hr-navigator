
-- ========== ENUMS ==========
create type public.app_role as enum ('admin','hr_manager','employee');
create type public.employment_type as enum ('full_time','part_time','contract','intern');
create type public.employment_status as enum ('active','on_leave','probation','terminated','archived');
create type public.leave_status as enum ('pending','approved','rejected','cancelled');
create type public.payroll_status as enum ('draft','approved','processed');
create type public.review_status as enum ('scheduled','in_progress','submitted','completed');
create type public.goal_status as enum ('not_started','in_progress','achieved','missed');

-- ========== ROLES ==========
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_hr(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','hr_manager'))
$$;

create policy "own roles or hr reads" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_hr(auth.uid()));

-- ========== SETTINGS ==========
create table public.company_settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default 'Acme Holdings',
  timezone text not null default 'Africa/Harare',
  currency text not null default 'USD',
  work_start time not null default '09:00',
  late_grace_minutes int not null default 15 check (late_grace_minutes between 0 and 240),
  standard_daily_minutes int not null default 480 check (standard_daily_minutes between 60 and 1440),
  break_minutes int not null default 60 check (break_minutes between 0 and 240),
  overtime_multiplier numeric(4,2) not null default 1.50 check (overtime_multiplier >= 1),
  working_days int[] not null default '{1,2,3,4,5}',
  monthly_working_days int not null default 22 check (monthly_working_days between 1 and 31),
  allow_public_signup boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.company_settings (id) values (1);
grant select on public.company_settings to authenticated;
grant all on public.company_settings to service_role;
alter table public.company_settings enable row level security;
create policy "all read settings" on public.company_settings for select to authenticated using (true);
create policy "admin update settings" on public.company_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
grant update on public.company_settings to authenticated;

-- ========== DEPARTMENTS / EMPLOYEES ==========
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 2 and 100),
  code text not null unique check (code ~ '^[A-Z0-9]{2,10}$'),
  description text check (length(description) <= 1000),
  budget numeric(14,2) not null default 0 check (budget >= 0),
  manager_id uuid,
  archived_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.employee_number_seq start 101;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  employee_number text not null unique default ('EMP' || nextval('public.employee_number_seq')),
  first_name text not null check (length(first_name) between 1 and 60),
  last_name text not null check (length(last_name) between 1 and 60),
  work_email text not null check (work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (length(phone) <= 30),
  address text check (length(address) <= 300),
  department_id uuid references public.departments(id) on delete restrict,
  designation text check (length(designation) <= 100),
  manager_id uuid references public.employees(id) on delete set null,
  employment_type public.employment_type not null default 'full_time',
  status public.employment_status not null default 'active',
  date_of_joining date not null default current_date,
  date_of_leaving date,
  date_of_birth date,
  monthly_salary numeric(14,2) not null default 0 check (monthly_salary >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  emergency_contact_name text check (length(emergency_contact_name) <= 100),
  emergency_contact_phone text check (length(emergency_contact_phone) <= 30),
  photo_url text,
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_of_leaving is null or date_of_leaving >= date_of_joining)
);
create unique index employees_email_uq on public.employees (lower(work_email));
create index employees_dept_idx on public.employees (department_id);
create index employees_status_idx on public.employees (status);
alter table public.departments add constraint departments_manager_fk foreign key (manager_id) references public.employees(id) on delete set null;

create table public.employment_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  change_type text not null,
  old_value jsonb, new_value jsonb,
  changed_by uuid,
  created_at timestamptz not null default now()
);

create or replace function public.current_employee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.employees where user_id = auth.uid()
$$;

grant select, insert, update, delete on public.departments, public.employees to authenticated;
grant all on public.departments, public.employees, public.employment_history to service_role;
grant select on public.employment_history to authenticated;
grant usage on sequence public.employee_number_seq to authenticated;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.employment_history enable row level security;

create policy "all read departments" on public.departments for select to authenticated using (true);
create policy "hr write departments" on public.departments for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "self or hr read employees" on public.employees for select to authenticated using (user_id = auth.uid() or public.is_hr(auth.uid()));
create policy "hr write employees" on public.employees for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "self or hr read history" on public.employment_history for select to authenticated using (public.is_hr(auth.uid()) or employee_id = public.current_employee_id());

-- Directory view (non-confidential fields) for all staff
create or replace function public.employee_directory()
returns table (id uuid, employee_number text, first_name text, last_name text, work_email text, designation text, department_id uuid, photo_url text)
language sql stable security definer set search_path = public as $$
  select id, employee_number, first_name, last_name, work_email, designation, department_id, photo_url
  from public.employees where archived_at is null and auth.uid() is not null
$$;

-- Employee self-update of permitted fields
create or replace function public.update_my_profile(_phone text, _address text, _ec_name text, _ec_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(_phone,'')) > 30 or length(coalesce(_address,'')) > 300 or length(coalesce(_ec_name,'')) > 100 or length(coalesce(_ec_phone,'')) > 30 then
    raise exception 'Value too long';
  end if;
  update public.employees set phone=_phone, address=_address, emergency_contact_name=_ec_name, emergency_contact_phone=_ec_phone, updated_at=now()
  where user_id = auth.uid();
  if not found then raise exception 'No employee record linked to your account'; end if;
end $$;

-- ========== ATTENDANCE ==========
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  work_date date not null,
  check_in timestamptz not null,
  check_out timestamptz,
  break_minutes int not null default 0 check (break_minutes >= 0),
  worked_minutes int not null default 0 check (worked_minutes >= 0),
  overtime_minutes int not null default 0 check (overtime_minutes >= 0),
  is_late boolean not null default false,
  status text not null default 'open' check (status in ('open','present','corrected')),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  notes text check (length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  check (check_out is null or check_out > check_in)
);
create unique index attendance_one_open on public.attendance_records (employee_id) where check_out is null;
create index attendance_date_idx on public.attendance_records (work_date);

create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance_records(id) on delete cascade,
  old_check_in timestamptz, old_check_out timestamptz,
  new_check_in timestamptz not null, new_check_out timestamptz,
  reason text not null check (length(reason) between 3 and 500),
  corrected_by uuid not null,
  created_at timestamptz not null default now()
);
grant select on public.attendance_records, public.attendance_corrections to authenticated;
grant all on public.attendance_records, public.attendance_corrections to service_role;
alter table public.attendance_records enable row level security;
alter table public.attendance_corrections enable row level security;
create policy "self or hr read attendance" on public.attendance_records for select to authenticated using (public.is_hr(auth.uid()) or employee_id = public.current_employee_id());
create policy "hr read corrections" on public.attendance_corrections for select to authenticated using (public.is_hr(auth.uid()) or exists (select 1 from public.attendance_records a where a.id = attendance_id and a.employee_id = public.current_employee_id()));

create or replace function public.compute_attendance(_in timestamptz, _out timestamptz, out worked int, out overtime int, out brk int)
language plpgsql stable security definer set search_path = public as $$
declare s public.company_settings; raw int;
begin
  select * into s from public.company_settings where id=1;
  raw := floor(extract(epoch from (_out - _in))/60);
  brk := case when raw > 360 then s.break_minutes else 0 end;
  worked := greatest(raw - brk, 0);
  overtime := greatest(worked - s.standard_daily_minutes, 0);
end $$;

create or replace function public.attendance_check_in(_lat numeric default null, _lng numeric default null)
returns public.attendance_records language plpgsql security definer set search_path = public as $$
declare emp uuid; s public.company_settings; local_now timestamp; rec public.attendance_records;
begin
  emp := public.current_employee_id();
  if emp is null then raise exception 'No employee record linked to your account'; end if;
  select * into s from public.company_settings where id=1;
  local_now := now() at time zone s.timezone;
  if exists (select 1 from public.attendance_records where employee_id=emp and check_out is null) then
    raise exception 'You are already checked in';
  end if;
  if exists (select 1 from public.attendance_records where employee_id=emp and work_date=local_now::date) then
    raise exception 'You already have an attendance record for today';
  end if;
  insert into public.attendance_records (employee_id, work_date, check_in, is_late, latitude, longitude)
  values (emp, local_now::date, now(), local_now::time > s.work_start + make_interval(mins => s.late_grace_minutes), _lat, _lng)
  returning * into rec;
  return rec;
end $$;

create or replace function public.attendance_check_out()
returns public.attendance_records language plpgsql security definer set search_path = public as $$
declare emp uuid; rec public.attendance_records; c record;
begin
  emp := public.current_employee_id();
  if emp is null then raise exception 'No employee record linked to your account'; end if;
  select * into rec from public.attendance_records where employee_id=emp and check_out is null for update;
  if not found then raise exception 'You are not checked in'; end if;
  select * into c from public.compute_attendance(rec.check_in, now());
  update public.attendance_records set check_out=now(), worked_minutes=c.worked, overtime_minutes=c.overtime, break_minutes=c.brk, status='present', updated_at=now()
  where id=rec.id returning * into rec;
  return rec;
end $$;

create or replace function public.correct_attendance(_id uuid, _in timestamptz, _out timestamptz, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare rec public.attendance_records; c record;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  if _out is not null and _out <= _in then raise exception 'Check-out must be after check-in'; end if;
  if length(coalesce(_reason,'')) < 3 then raise exception 'A reason is required'; end if;
  select * into rec from public.attendance_records where id=_id for update;
  if not found then raise exception 'Record not found'; end if;
  insert into public.attendance_corrections (attendance_id, old_check_in, old_check_out, new_check_in, new_check_out, reason, corrected_by)
  values (_id, rec.check_in, rec.check_out, _in, _out, _reason, auth.uid());
  if _out is null then
    update public.attendance_records set check_in=_in, check_out=null, status='open', updated_at=now() where id=_id;
  else
    select * into c from public.compute_attendance(_in, _out);
    update public.attendance_records set check_in=_in, check_out=_out, worked_minutes=c.worked, overtime_minutes=c.overtime, break_minutes=c.brk, status='corrected', updated_at=now() where id=_id;
  end if;
end $$;

-- ========== CALENDAR ==========
create table public.company_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 2 and 150),
  description text check (length(description) <= 1000),
  event_date date not null,
  end_date date,
  event_type text not null default 'event' check (event_type in ('event','holiday','meeting')),
  created_by uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= event_date)
);
create index events_date_idx on public.company_events (event_date);
grant select, insert, update, delete on public.company_events to authenticated;
grant all on public.company_events to service_role;
alter table public.company_events enable row level security;
create policy "all read events" on public.company_events for select to authenticated using (true);
create policy "hr write events" on public.company_events for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));

-- ========== LEAVE ==========
create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  annual_allowance numeric(5,1) not null default 0 check (annual_allowance >= 0),
  is_paid boolean not null default true,
  tracks_balance boolean not null default true,
  requires_document boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  year int not null,
  allocated numeric(5,1) not null default 0 check (allocated >= 0),
  used numeric(5,1) not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  half_day boolean not null default false,
  days numeric(5,1) not null check (days > 0),
  reason text not null check (length(reason) between 3 and 1000),
  document_path text,
  status public.leave_status not null default 'pending',
  reviewed_by uuid,
  reviewer_comment text check (length(reviewer_comment) <= 1000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (not half_day or start_date = end_date)
);
create index leave_req_emp_idx on public.leave_requests (employee_id, status);
create index leave_req_dates_idx on public.leave_requests (start_date, end_date);
create table public.leave_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references public.leave_requests(id) on delete cascade,
  action text not null check (action in ('approved','rejected','cancelled')),
  actor_id uuid not null,
  comment text,
  created_at timestamptz not null default now()
);
grant select on public.leave_types, public.leave_balances, public.leave_requests, public.leave_approvals to authenticated;
grant insert, update, delete on public.leave_types, public.leave_balances to authenticated;
grant all on public.leave_types, public.leave_balances, public.leave_requests, public.leave_approvals to service_role;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_approvals enable row level security;
create policy "all read leave types" on public.leave_types for select to authenticated using (true);
create policy "hr write leave types" on public.leave_types for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "self or hr read balances" on public.leave_balances for select to authenticated using (public.is_hr(auth.uid()) or employee_id = public.current_employee_id());
create policy "hr write balances" on public.leave_balances for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "self or hr read requests" on public.leave_requests for select to authenticated using (public.is_hr(auth.uid()) or employee_id = public.current_employee_id());
create policy "self or hr read approvals" on public.leave_approvals for select to authenticated using (public.is_hr(auth.uid()) or exists (select 1 from public.leave_requests r where r.id = leave_request_id and r.employee_id = public.current_employee_id()));

-- Working-day count: excludes non-working weekdays and company holidays
create or replace function public.count_leave_days(_start date, _end date, _half boolean default false)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare s public.company_settings; n numeric;
begin
  select * into s from public.company_settings where id=1;
  select count(*) into n from generate_series(_start, _end, interval '1 day') d
  where extract(isodow from d)::int = any(s.working_days)
    and not exists (select 1 from public.company_events e where e.event_type='holiday' and d::date between e.event_date and coalesce(e.end_date, e.event_date));
  if _half and n > 0 then n := 0.5; end if;
  return n;
end $$;

-- ========== NOTIFICATIONS / ANNOUNCEMENTS ==========
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  link text,
  category text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read_at);
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 150),
  body text not null check (length(body) between 3 and 5000),
  published_by uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.notifications, public.announcements to service_role;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "all read announcements" on public.announcements for select to authenticated using (true);
create policy "hr write announcements" on public.announcements for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));

create or replace function public.notify_employee(_emp uuid, _title text, _body text, _link text, _cat text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, link, category)
  select user_id, _title, _body, _link, _cat from public.employees where id=_emp and user_id is not null
$$;
revoke execute on function public.notify_employee(uuid,text,text,text,text) from public, anon, authenticated;

create or replace function public.on_announcement() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, title, body, link, category)
  select user_id, 'Announcement: ' || new.title, left(new.body, 200), '/notifications', 'announcement' from public.employees where user_id is not null and archived_at is null;
  return new;
end $$;
create trigger announcements_notify after insert on public.announcements for each row execute function public.on_announcement();

-- ========== LEAVE WORKFLOW FUNCTIONS ==========
create or replace function public.apply_leave(_type uuid, _start date, _end date, _half boolean, _reason text, _doc text default null)
returns public.leave_requests language plpgsql security definer set search_path = public as $$
declare emp uuid; lt public.leave_types; d numeric; bal public.leave_balances; pending numeric; rec public.leave_requests;
begin
  emp := public.current_employee_id();
  if emp is null then raise exception 'No employee record linked to your account'; end if;
  if _end < _start then raise exception 'End date must be on or after start date'; end if;
  if _half and _start <> _end then raise exception 'Half day leave must be a single day'; end if;
  if _start < current_date - 30 then raise exception 'Start date is too far in the past'; end if;
  if length(coalesce(_reason,'')) < 3 then raise exception 'Please provide a reason'; end if;
  select * into lt from public.leave_types where id=_type;
  if not found then raise exception 'Unknown leave type'; end if;
  if lt.requires_document and _doc is null and (_end - _start) >= 2 then raise exception 'A supporting document is required for % longer than 2 days', lt.name; end if;
  perform pg_advisory_xact_lock(hashtext(emp::text));
  if exists (select 1 from public.leave_requests where employee_id=emp and status in ('pending','approved') and daterange(start_date,end_date,'[]') && daterange(_start,_end,'[]')) then
    raise exception 'This request overlaps an existing pending or approved request';
  end if;
  d := public.count_leave_days(_start, _end, _half);
  if d <= 0 then raise exception 'The selected dates contain no working days'; end if;
  if lt.tracks_balance then
    select * into bal from public.leave_balances where employee_id=emp and leave_type_id=_type and year=extract(year from _start)::int;
    select coalesce(sum(days),0) into pending from public.leave_requests where employee_id=emp and leave_type_id=_type and status='pending' and extract(year from start_date)=extract(year from _start);
    if bal.id is null or (bal.allocated - bal.used - pending) < d then raise exception 'Insufficient leave balance'; end if;
  end if;
  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, half_day, days, reason, document_path)
  values (emp, _type, _start, _end, coalesce(_half,false), d, _reason, _doc) returning * into rec;
  insert into public.notifications (user_id, title, body, link, category)
  select ur.user_id, 'New leave request', (select first_name||' '||last_name from public.employees where id=emp) || ' requested ' || d || ' day(s) of ' || lt.name, '/leave', 'leave'
  from public.user_roles ur where ur.role in ('admin','hr_manager');
  return rec;
end $$;

create or replace function public.review_leave(_id uuid, _approve boolean, _comment text)
returns void language plpgsql security definer set search_path = public as $$
declare rec public.leave_requests; lt public.leave_types; upd int;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  select * into rec from public.leave_requests where id=_id for update;
  if not found then raise exception 'Request not found'; end if;
  if rec.status <> 'pending' then raise exception 'This request has already been %', rec.status; end if;
  if rec.employee_id = public.current_employee_id() then raise exception 'You cannot review your own leave request'; end if;
  select * into lt from public.leave_types where id=rec.leave_type_id;
  if _approve and lt.tracks_balance then
    update public.leave_balances set used = used + rec.days, updated_at=now()
    where employee_id=rec.employee_id and leave_type_id=rec.leave_type_id and year=extract(year from rec.start_date)::int and allocated - used >= rec.days;
    get diagnostics upd = row_count;
    if upd = 0 then raise exception 'Insufficient leave balance to approve'; end if;
  end if;
  update public.leave_requests set status = case when _approve then 'approved'::public.leave_status else 'rejected'::public.leave_status end,
    reviewed_by=auth.uid(), reviewer_comment=_comment, reviewed_at=now(), updated_at=now() where id=_id;
  insert into public.leave_approvals (leave_request_id, action, actor_id, comment) values (_id, case when _approve then 'approved' else 'rejected' end, auth.uid(), _comment);
  perform public.notify_employee(rec.employee_id, 'Leave ' || case when _approve then 'approved' else 'rejected' end,
    lt.name || ' ' || rec.start_date || ' to ' || rec.end_date || coalesce(' — ' || _comment, ''), '/leave', 'leave');
end $$;

create or replace function public.cancel_leave(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare rec public.leave_requests;
begin
  select * into rec from public.leave_requests where id=_id for update;
  if not found or rec.employee_id is distinct from public.current_employee_id() then raise exception 'Request not found'; end if;
  if rec.status <> 'pending' then raise exception 'Only pending requests can be cancelled'; end if;
  update public.leave_requests set status='cancelled', updated_at=now() where id=_id;
  insert into public.leave_approvals (leave_request_id, action, actor_id) values (_id,'cancelled',auth.uid());
end $$;

-- ========== PAYROLL ==========
create table public.payroll_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rule_type text not null check (rule_type in ('allowance_percent','allowance_fixed','tax_percent','pension_percent','deduction_fixed')),
  rate numeric(12,4) not null check (rate >= 0),
  jurisdiction text not null default 'DEMO',
  effective_from date not null,
  effective_to date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);
create table public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  period_start date not null,
  period_end date not null,
  pay_date date not null,
  status public.payroll_status not null default 'draft',
  approved_by uuid, approved_at timestamptz,
  processed_by uuid, processed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (period_start, period_end)
);
create table public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  currency text not null,
  basic_salary numeric(14,2) not null default 0,
  allowances numeric(14,2) not null default 0,
  bonuses numeric(14,2) not null default 0,
  overtime_pay numeric(14,2) not null default 0,
  gross_pay numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  other_deductions numeric(14,2) not null default 0,
  net_pay numeric(14,2) not null default 0,
  overtime_minutes int not null default 0,
  unpaid_leave_days numeric(5,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, employee_id)
);
create table public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.payroll_records(id) on delete cascade,
  kind text not null check (kind in ('earning','deduction')),
  label text not null,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
grant select on public.payroll_rules, public.payroll_periods, public.payroll_records, public.payroll_items to authenticated;
grant insert, update, delete on public.payroll_rules, public.payroll_periods to authenticated;
grant all on public.payroll_rules, public.payroll_periods, public.payroll_records, public.payroll_items to service_role;
alter table public.payroll_rules enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_records enable row level security;
alter table public.payroll_items enable row level security;
create policy "hr read rules" on public.payroll_rules for select to authenticated using (public.is_hr(auth.uid()));
create policy "admin write rules" on public.payroll_rules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "hr read periods or own processed" on public.payroll_periods for select to authenticated using (public.is_hr(auth.uid()) or (status='processed' and exists (select 1 from public.payroll_records r where r.period_id=id and r.employee_id=public.current_employee_id())));
create policy "hr insert periods" on public.payroll_periods for insert to authenticated with check (public.is_hr(auth.uid()) and status='draft');
create policy "hr delete draft periods" on public.payroll_periods for delete to authenticated using (public.is_hr(auth.uid()) and status='draft');
create policy "hr read records or own processed" on public.payroll_records for select to authenticated using (public.is_hr(auth.uid()) or (employee_id=public.current_employee_id() and exists (select 1 from public.payroll_periods p where p.id=period_id and p.status='processed')));
create policy "items follow records" on public.payroll_items for select to authenticated using (exists (select 1 from public.payroll_records r where r.id=record_id));

-- Prevent edits of processed payroll
create or replace function public.guard_payroll_period() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op='DELETE' then
    if old.status <> 'draft' then raise exception 'Only draft payroll periods can be deleted'; end if;
    return old;
  end if;
  if old.status='processed' then raise exception 'Processed payroll is immutable'; end if;
  return new;
end $$;
create trigger payroll_periods_guard before update or delete on public.payroll_periods for each row execute function public.guard_payroll_period();

create or replace function public.generate_payroll(_period uuid)
returns int language plpgsql security definer set search_path = public as $$
declare p public.payroll_periods; s public.company_settings; e record; rid uuid; r record;
  basic numeric; allow numeric; ot_min int; ot_pay numeric; unpaid numeric; unpaid_ded numeric; gross numeric; tax numeric; ded numeric; hourly numeric; cnt int := 0;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  select * into p from public.payroll_periods where id=_period for update;
  if not found then raise exception 'Period not found'; end if;
  if p.status <> 'draft' then raise exception 'Only draft payroll can be (re)generated'; end if;
  select * into s from public.company_settings where id=1;
  delete from public.payroll_records where period_id=_period;
  for e in select * from public.employees where archived_at is null and status <> 'terminated' and date_of_joining <= p.period_end and monthly_salary > 0 loop
    basic := e.monthly_salary;
    hourly := basic / (s.monthly_working_days * s.standard_daily_minutes / 60.0);
    select coalesce(sum(overtime_minutes),0) into ot_min from public.attendance_records where employee_id=e.id and work_date between p.period_start and p.period_end;
    ot_pay := round(hourly * (ot_min/60.0) * s.overtime_multiplier, 2);
    select coalesce(sum(public.count_leave_days(greatest(lr.start_date,p.period_start), least(lr.end_date,p.period_end), lr.half_day)),0) into unpaid
      from public.leave_requests lr join public.leave_types lt on lt.id=lr.leave_type_id
      where lr.employee_id=e.id and lr.status='approved' and not lt.is_paid and lr.start_date <= p.period_end and lr.end_date >= p.period_start;
    unpaid_ded := round(basic / s.monthly_working_days * unpaid, 2);
    insert into public.payroll_records (period_id, employee_id, currency, basic_salary, overtime_minutes, unpaid_leave_days)
      values (_period, e.id, e.currency, basic, ot_min, unpaid) returning id into rid;
    allow := 0;
    for r in select * from public.payroll_rules where is_active and rule_type in ('allowance_percent','allowance_fixed') and effective_from <= p.period_end and (effective_to is null or effective_to >= p.period_end) loop
      insert into public.payroll_items (record_id, kind, label, amount) values (rid,'earning', r.name, round(case when r.rule_type='allowance_percent' then basic*r.rate/100 else r.rate end, 2));
      allow := allow + round(case when r.rule_type='allowance_percent' then basic*r.rate/100 else r.rate end, 2);
    end loop;
    if ot_pay > 0 then insert into public.payroll_items (record_id, kind, label, amount) values (rid,'earning','Overtime ('||round(ot_min/60.0,1)||' h)', ot_pay); end if;
    gross := basic + allow + ot_pay;
    tax := 0; ded := 0;
    for r in select * from public.payroll_rules where is_active and rule_type in ('tax_percent','pension_percent','deduction_fixed') and effective_from <= p.period_end and (effective_to is null or effective_to >= p.period_end) loop
      if r.rule_type='tax_percent' then
        tax := tax + round(gross*r.rate/100, 2);
        insert into public.payroll_items (record_id, kind, label, amount) values (rid,'deduction', r.name, round(gross*r.rate/100, 2));
      elsif r.rule_type='pension_percent' then
        ded := ded + round(basic*r.rate/100, 2);
        insert into public.payroll_items (record_id, kind, label, amount) values (rid,'deduction', r.name, round(basic*r.rate/100, 2));
      else
        ded := ded + r.rate;
        insert into public.payroll_items (record_id, kind, label, amount) values (rid,'deduction', r.name, r.rate);
      end if;
    end loop;
    if unpaid_ded > 0 then
      ded := ded + unpaid_ded;
      insert into public.payroll_items (record_id, kind, label, amount) values (rid,'deduction','Unpaid leave ('||unpaid||' d)', unpaid_ded);
    end if;
    update public.payroll_records set allowances=allow, overtime_pay=ot_pay, gross_pay=gross, tax=tax, other_deductions=ded, net_pay=greatest(gross - tax - ded,0) where id=rid;
    cnt := cnt + 1;
  end loop;
  update public.payroll_periods set updated_at=now() where id=_period;
  return cnt;
end $$;

create or replace function public.set_payroll_bonus(_record uuid, _bonus numeric)
returns void language plpgsql security definer set search_path = public as $$
declare rec public.payroll_records; st public.payroll_status; delta numeric;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  if _bonus < 0 or _bonus > 1000000 then raise exception 'Invalid bonus amount'; end if;
  select * into rec from public.payroll_records where id=_record for update;
  select status into st from public.payroll_periods where id=rec.period_id;
  if st <> 'draft' then raise exception 'Bonuses can only be changed on draft payroll'; end if;
  _bonus := round(_bonus, 2);
  delete from public.payroll_items where record_id=_record and label='Bonus';
  if _bonus > 0 then insert into public.payroll_items (record_id, kind, label, amount) values (_record,'earning','Bonus',_bonus); end if;
  update public.payroll_records set bonuses=_bonus, gross_pay=basic_salary+allowances+overtime_pay+_bonus,
    net_pay=greatest(basic_salary+allowances+overtime_pay+_bonus - tax - other_deductions, 0), updated_at=now() where id=_record;
end $$;

create or replace function public.advance_payroll(_period uuid)
returns public.payroll_status language plpgsql security definer set search_path = public as $$
declare p public.payroll_periods; n int;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  select * into p from public.payroll_periods where id=_period for update;
  if not found then raise exception 'Period not found'; end if;
  select count(*) into n from public.payroll_records where period_id=_period;
  if n = 0 then raise exception 'Generate payroll before approving'; end if;
  if p.status='draft' then
    update public.payroll_periods set status='approved', approved_by=auth.uid(), approved_at=now(), updated_at=now() where id=_period;
    return 'approved';
  elsif p.status='approved' then
    if p.approved_by = auth.uid() and not public.has_role(auth.uid(),'admin') then raise exception 'A different user (or an admin) must process payroll you approved'; end if;
    update public.payroll_periods set status='processed', processed_by=auth.uid(), processed_at=now(), updated_at=now() where id=_period;
    insert into public.notifications (user_id, title, body, link, category)
      select e.user_id, 'Payslip available', p.name || ' payroll has been processed', '/payroll', 'payroll'
      from public.payroll_records r join public.employees e on e.id=r.employee_id where r.period_id=_period and e.user_id is not null;
    return 'processed';
  else
    raise exception 'Payroll already processed';
  end if;
end $$;

-- ========== PERFORMANCE ==========
create table public.performance_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  period_start date not null,
  period_end date not null,
  rating_scale int not null default 5 check (rating_scale between 3 and 10),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create table public.performance_reviews (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.performance_cycles(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  reviewer_id uuid references public.employees(id) on delete set null,
  due_date date not null,
  status public.review_status not null default 'scheduled',
  rating int check (rating >= 1),
  manager_feedback text check (length(manager_feedback) <= 5000),
  employee_comment text check (length(employee_comment) <= 5000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, employee_id)
);
create table public.performance_goals (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  review_id uuid references public.performance_reviews(id) on delete set null,
  title text not null check (length(title) between 3 and 200),
  measure text check (length(measure) <= 500),
  target_value numeric(12,2),
  current_value numeric(12,2) not null default 0,
  due_date date,
  status public.goal_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.performance_cycles, public.performance_reviews, public.performance_goals to authenticated;
grant insert, update, delete on public.performance_cycles, public.performance_reviews, public.performance_goals to authenticated;
grant all on public.performance_cycles, public.performance_reviews, public.performance_goals to service_role;
alter table public.performance_cycles enable row level security;
alter table public.performance_reviews enable row level security;
alter table public.performance_goals enable row level security;
create policy "all read cycles" on public.performance_cycles for select to authenticated using (true);
create policy "hr write cycles" on public.performance_cycles for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "read reviews" on public.performance_reviews for select to authenticated using (public.is_hr(auth.uid()) or employee_id=public.current_employee_id() or reviewer_id=public.current_employee_id());
create policy "hr write reviews" on public.performance_reviews for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));
create policy "read goals" on public.performance_goals for select to authenticated using (public.is_hr(auth.uid()) or employee_id=public.current_employee_id());
create policy "hr write goals" on public.performance_goals for all to authenticated using (public.is_hr(auth.uid())) with check (public.is_hr(auth.uid()));

create or replace function public.comment_on_review(_id uuid, _comment text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(_comment,'')) > 5000 then raise exception 'Comment too long'; end if;
  update public.performance_reviews set employee_comment=_comment, updated_at=now() where id=_id and employee_id=public.current_employee_id() and status <> 'completed';
  if not found then raise exception 'Review not found or already completed'; end if;
end $$;
create or replace function public.update_goal_progress(_id uuid, _value numeric, _status public.goal_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.performance_goals set current_value=_value, status=_status, updated_at=now() where id=_id and (employee_id=public.current_employee_id() or public.is_hr(auth.uid()));
  if not found then raise exception 'Goal not found'; end if;
end $$;
create or replace function public.validate_review() returns trigger language plpgsql set search_path = public as $$
declare scale int;
begin
  select rating_scale into scale from public.performance_cycles where id=new.cycle_id;
  if new.rating is not null and new.rating > scale then raise exception 'Rating must be between 1 and %', scale; end if;
  if new.status='completed' and new.rating is null then raise exception 'A completed review needs a rating'; end if;
  if new.status='completed' and old.status is distinct from 'completed' then new.completed_at := now(); end if;
  return new;
end $$;
create trigger reviews_validate before insert or update on public.performance_reviews for each row execute function public.validate_review();

-- ========== DOCUMENTS ==========
create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  category text not null check (category in ('contract','id','certificate','payslip','policy','other')),
  file_name text not null check (length(file_name) <= 200),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.employee_documents to authenticated;
grant all on public.employee_documents to service_role;
alter table public.employee_documents enable row level security;
create policy "read documents" on public.employee_documents for select to authenticated using (public.is_hr(auth.uid()) or employee_id=public.current_employee_id());
create policy "hr insert documents" on public.employee_documents for insert to authenticated with check (public.is_hr(auth.uid()) and mime_type in ('application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
create policy "hr delete documents" on public.employee_documents for delete to authenticated using (public.is_hr(auth.uid()));

-- ========== AUDIT ==========
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs (created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
declare rid text; d jsonb;
begin
  if tg_op='DELETE' then rid := old.id::text; d := to_jsonb(old);
  elsif tg_op='INSERT' then rid := new.id::text; d := to_jsonb(new);
  else rid := new.id::text; d := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)); end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, details) values (auth.uid(), lower(tg_op), tg_table_name, rid, d);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['employees','departments','attendance_corrections','leave_requests','payroll_periods','payroll_rules','performance_reviews','employee_documents','user_roles','company_settings','announcements'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

create or replace function public.log_audit(_action text, _entity text, _entity_id text, _details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, details) select auth.uid(), _action, _entity, _entity_id, _details where auth.uid() is not null
$$;

-- updated_at triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;
create trigger t_emp before update on public.employees for each row execute function public.touch_updated_at();
create trigger t_dept before update on public.departments for each row execute function public.touch_updated_at();

-- employment history on key changes
create or replace function public.employment_history_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.department_id is distinct from old.department_id or new.designation is distinct from old.designation or new.status is distinct from old.status or new.monthly_salary is distinct from old.monthly_salary then
    insert into public.employment_history (employee_id, change_type, old_value, new_value, changed_by)
    values (new.id, 'update', jsonb_build_object('department_id',old.department_id,'designation',old.designation,'status',old.status,'monthly_salary',old.monthly_salary),
      jsonb_build_object('department_id',new.department_id,'designation',new.designation,'status',new.status,'monthly_salary',new.monthly_salary), auth.uid());
  end if;
  return new;
end $$;
create trigger emp_history after update on public.employees for each row execute function public.employment_history_trigger();

-- ========== SIGNUP BOOTSTRAP ==========
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare emp uuid; lt record;
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'employee');
  end if;
  update public.employees set user_id=new.id where lower(work_email)=lower(new.email) and user_id is null returning id into emp;
  if emp is null then
    insert into public.employees (user_id, first_name, last_name, work_email, status)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'first_name',''),'New'), coalesce(nullif(new.raw_user_meta_data->>'last_name',''),'User'), new.email, 'probation')
    returning id into emp;
  end if;
  for lt in select id, annual_allowance from public.leave_types where tracks_balance loop
    insert into public.leave_balances (employee_id, leave_type_id, year, allocated) values (emp, lt.id, extract(year from now())::int, lt.annual_allowance) on conflict do nothing;
  end loop;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Admin role management
create or replace function public.set_user_role(_user uuid, _role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  if _user = auth.uid() and _role <> 'admin' then raise exception 'You cannot remove your own admin role'; end if;
  delete from public.user_roles where user_id=_user;
  insert into public.user_roles (user_id, role) values (_user, _role);
end $$;

-- ========== DASHBOARD AGGREGATES ==========
create or replace function public.hr_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.company_settings; today date; res jsonb;
begin
  if not public.is_hr(auth.uid()) then raise exception 'Not authorized'; end if;
  select * into s from public.company_settings where id=1;
  today := (now() at time zone s.timezone)::date;
  select jsonb_build_object(
    'total_employees', (select count(*) from public.employees where archived_at is null),
    'active_employees', (select count(*) from public.employees where archived_at is null and status in ('active','probation')),
    'present_today', (select count(*) from public.attendance_records where work_date=today),
    'on_leave_today', (select count(*) from public.leave_requests where status='approved' and today between start_date and end_date),
    'pending_leave', (select count(*) from public.leave_requests where status='pending'),
    'departments', coalesce((select jsonb_agg(jsonb_build_object('name', d.name, 'count', (select count(*) from public.employees e where e.department_id=d.id and e.archived_at is null)) order by d.name) from public.departments d where d.archived_at is null), '[]'),
    'attendance_trend', coalesce((select jsonb_agg(jsonb_build_object('date', g::date, 'present', (select count(*) from public.attendance_records a where a.work_date=g::date), 'late', (select count(*) from public.attendance_records a where a.work_date=g::date and a.is_late)) order by g) from generate_series(today-13, today, interval '1 day') g), '[]'),
    'leave_by_type', coalesce((select jsonb_agg(jsonb_build_object('name', lt.name, 'days', coalesce((select sum(days) from public.leave_requests r where r.leave_type_id=lt.id and r.status='approved' and extract(year from r.start_date)=extract(year from today)),0))) from public.leave_types lt), '[]'),
    'payroll_totals', coalesce((select jsonb_agg(x order by x->>'start') from (select jsonb_build_object('name', p.name, 'start', p.period_start, 'gross', sum(r.gross_pay), 'net', sum(r.net_pay)) x from public.payroll_periods p join public.payroll_records r on r.period_id=p.id where p.status='processed' group by p.id order by p.period_start desc limit 6) q), '[]'),
    'upcoming_birthdays', coalesce((select jsonb_agg(jsonb_build_object('name', first_name||' '||last_name, 'date', to_char(date_of_birth,'Mon DD'))) from public.employees where archived_at is null and date_of_birth is not null and (make_date(extract(year from today)::int, extract(month from date_of_birth)::int, least(extract(day from date_of_birth)::int,28)) between today and today+30)), '[]'),
    'upcoming_reviews', (select count(*) from public.performance_reviews where status <> 'completed' and due_date between today and today+30)
  ) into res;
  return res;
end $$;

-- ========== DAILY REMINDER JOB ==========
create or replace function public.run_daily_reminders()
returns void language plpgsql security definer set search_path = public as $$
declare s public.company_settings; yday date;
begin
  select * into s from public.company_settings where id=1;
  yday := (now() at time zone s.timezone)::date - 1;
  if extract(isodow from yday)::int = any(s.working_days) and not exists (select 1 from public.company_events where event_type='holiday' and yday between event_date and coalesce(end_date,event_date)) then
    insert into public.notifications (user_id, title, body, link, category)
    select e.user_id, 'Missing attendance', 'No attendance was recorded for ' || yday, '/attendance', 'attendance'
    from public.employees e where e.user_id is not null and e.archived_at is null and e.status in ('active','probation')
      and not exists (select 1 from public.attendance_records a where a.employee_id=e.id and a.work_date=yday)
      and not exists (select 1 from public.leave_requests l where l.employee_id=e.id and l.status='approved' and yday between l.start_date and l.end_date);
  end if;
  insert into public.notifications (user_id, title, body, link, category)
  select e.user_id, 'Performance review due soon', 'Your review is due on ' || r.due_date, '/performance', 'performance'
  from public.performance_reviews r join public.employees e on e.id=r.employee_id
  where e.user_id is not null and r.status <> 'completed' and r.due_date = (now() at time zone s.timezone)::date + 7;
  insert into public.notifications (user_id, title, body, link, category)
  select e.user_id, 'Upcoming: ' || ev.title, ev.event_type || ' on ' || ev.event_date, '/calendar', 'event'
  from public.company_events ev cross join public.employees e
  where e.user_id is not null and e.archived_at is null and ev.event_date = (now() at time zone s.timezone)::date + 3;
end $$;
revoke execute on function public.run_daily_reminders() from public, anon, authenticated;

-- ========== STORAGE POLICIES (bucket created separately) ==========
create policy "hr upload docs" on storage.objects for insert to authenticated with check (bucket_id='employee-documents' and public.is_hr(auth.uid()));
create policy "employee upload leave docs" on storage.objects for insert to authenticated with check (bucket_id='employee-documents' and (storage.foldername(name))[1]='leave' and (storage.foldername(name))[2]=public.current_employee_id()::text);
create policy "read own or hr docs" on storage.objects for select to authenticated using (bucket_id='employee-documents' and (public.is_hr(auth.uid()) or (storage.foldername(name))[2]=public.current_employee_id()::text));
create policy "hr delete docs" on storage.objects for delete to authenticated using (bucket_id='employee-documents' and public.is_hr(auth.uid()));

-- ========== DEMO SEED (all rows flagged is_demo) ==========
insert into public.leave_types (code, name, annual_allowance, is_paid, tracks_balance, requires_document) values
 ('CL','Casual Leave',10,true,true,false),('SL','Sick Leave',12,true,true,true),('PL','Paid Leave',18,true,true,false),('UL','Unpaid Leave',0,false,false,false);

insert into public.payroll_rules (name, rule_type, rate, jurisdiction, effective_from, notes) values
 ('Housing allowance (demo)','allowance_percent',10,'DEMO','2024-01-01','Demo rule: 10% of basic'),
 ('Transport allowance (demo)','allowance_fixed',50,'DEMO','2024-01-01','Demo rule: fixed amount'),
 ('Income tax (demo flat)','tax_percent',20,'DEMO','2024-01-01','Demo flat rate — replace with real jurisdiction rules'),
 ('Pension (demo)','pension_percent',4.5,'DEMO','2024-01-01','Demo employee pension contribution');

insert into public.departments (name, code, description, budget, is_demo) values
 ('Engineering','ENG','Product and platform engineering (demo)',450000,true),
 ('Human Resources','HR','People operations (demo)',120000,true),
 ('Finance','FIN','Accounting and payroll (demo)',150000,true),
 ('Sales','SAL','Revenue and partnerships (demo)',220000,true),
 ('Operations','OPS','Facilities and logistics (demo)',180000,true);

insert into public.employees (first_name,last_name,work_email,phone,department_id,designation,employment_type,status,date_of_joining,date_of_birth,monthly_salary,currency,is_demo)
select v.fn, v.ln, v.em, v.ph, (select id from public.departments where code=v.dc), v.ds, v.et::public.employment_type, v.st::public.employment_status, v.dj::date, v.db::date, v.sal, 'USD', true
from (values
 ('Tendai','Moyo','tendai.moyo@demo.ems','+263 77 100 0001','ENG','Engineering Manager','full_time','active','2020-03-02','1986-10-20',5200),
 ('Rudo','Ncube','rudo.ncube@demo.ems','+263 77 100 0002','ENG','Senior Developer','full_time','active','2021-06-14','1990-10-25',4100),
 ('Farai','Dube','farai.dube@demo.ems','+263 77 100 0003','ENG','Developer','full_time','active','2022-09-01','1995-02-11',3200),
 ('Chipo','Sibanda','chipo.sibanda@demo.ems','+263 77 100 0004','ENG','QA Engineer','contract','active','2023-01-09','1993-07-30',2800),
 ('Nyasha','Banda','nyasha.banda@demo.ems','+263 77 100 0005','HR','HR Manager','full_time','active','2019-11-18','1984-11-02',4300),
 ('Tatenda','Phiri','tatenda.phiri@demo.ems','+263 77 100 0006','HR','HR Officer','full_time','active','2022-04-04','1996-05-17',2500),
 ('Kudzai','Mutasa','kudzai.mutasa@demo.ems','+263 77 100 0007','FIN','Finance Lead','full_time','active','2020-08-10','1988-01-23',4600),
 ('Tafadzwa','Chirwa','tafadzwa.chirwa@demo.ems','+263 77 100 0008','FIN','Payroll Accountant','full_time','active','2021-02-22','1991-10-28',3000),
 ('Simba','Gumbo','simba.gumbo@demo.ems','+263 77 100 0009','SAL','Sales Director','full_time','active','2018-05-07','1982-03-14',5000),
 ('Rumbi','Zhou','rumbi.zhou@demo.ems','+263 77 100 0010','SAL','Account Executive','full_time','active','2023-03-13','1997-09-09',2700),
 ('Takudzwa','Mlambo','takudzwa.mlambo@demo.ems','+263 77 100 0011','SAL','Sales Intern','intern','probation','2026-07-01','2002-12-01',900),
 ('Munya','Chikore','munya.chikore@demo.ems','+263 77 100 0012','OPS','Operations Manager','full_time','active','2019-09-16','1985-06-06',4000),
 ('Vimbai','Marange','vimbai.marange@demo.ems','+263 77 100 0013','OPS','Logistics Coordinator','part_time','active','2024-02-05','1994-04-19',1800),
 ('Tinashe','Murwira','tinashe.murwira@demo.ems','+263 77 100 0014','ENG','DevOps Engineer','full_time','on_leave','2022-11-28','1992-08-08',3600)
) as v(fn,ln,em,ph,dc,ds,et,st,dj,db,sal);

update public.employees e set manager_id = m.id from public.employees m where m.work_email='tendai.moyo@demo.ems' and e.work_email in ('rudo.ncube@demo.ems','farai.dube@demo.ems','chipo.sibanda@demo.ems','tinashe.murwira@demo.ems');
update public.employees e set manager_id = m.id from public.employees m where m.work_email='simba.gumbo@demo.ems' and e.work_email in ('rumbi.zhou@demo.ems','takudzwa.mlambo@demo.ems');
update public.departments d set manager_id = e.id from public.employees e where (d.code,e.work_email) in (('ENG','tendai.moyo@demo.ems'),('HR','nyasha.banda@demo.ems'),('FIN','kudzai.mutasa@demo.ems'),('SAL','simba.gumbo@demo.ems'),('OPS','munya.chikore@demo.ems'));

insert into public.leave_balances (employee_id, leave_type_id, year, allocated, used)
select e.id, lt.id, 2026, lt.annual_allowance, 0 from public.employees e cross join public.leave_types lt where lt.tracks_balance;

-- demo attendance for last 14 days on weekdays
insert into public.attendance_records (employee_id, work_date, check_in, check_out, break_minutes, worked_minutes, overtime_minutes, is_late, status)
select e.id, d::date,
  (d::date + time '08:30' + ((abs(hashtext(e.id::text||d::text)) % 60) || ' minutes')::interval) at time zone 'Africa/Harare',
  (d::date + time '17:30' + ((abs(hashtext(d::text||e.id::text)) % 90) || ' minutes')::interval) at time zone 'Africa/Harare',
  60, 0, 0, (abs(hashtext(e.id::text||d::text)) % 60) > 45, 'present'
from public.employees e cross join generate_series(current_date-14, current_date-1, interval '1 day') d
where extract(isodow from d) < 6 and abs(hashtext(e.id::text||d::text||'x')) % 10 > 0;
update public.attendance_records set worked_minutes = floor(extract(epoch from (check_out-check_in))/60) - 60,
  overtime_minutes = greatest(floor(extract(epoch from (check_out-check_in))/60) - 60 - 480, 0);

insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, status)
select e.id, lt.id, current_date + 7, current_date + 8, 2, 'Family event (demo)', 'pending' from public.employees e, public.leave_types lt where e.work_email='farai.dube@demo.ems' and lt.code='CL';
insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, status)
select e.id, lt.id, current_date + 14, current_date + 18, 5, 'Annual vacation (demo)', 'pending' from public.employees e, public.leave_types lt where e.work_email='rumbi.zhou@demo.ems' and lt.code='PL';

insert into public.company_events (title, description, event_date, event_type, is_demo) values
 ('Quarterly town hall','All-hands company update (demo)', current_date + 5, 'meeting', true),
 ('Team building day','Offsite activities (demo)', current_date + 20, 'event', true),
 ('Christmas Day','Public holiday', '2026-12-25','holiday', true),
 ('Boxing Day','Public holiday', '2026-12-26','holiday', true),
 ('Unity Day','Public holiday', '2026-12-22','holiday', true);

insert into public.announcements (title, body, is_demo) values
 ('Welcome to the new EMS','This is a demonstration announcement. All records marked "Demo" are sample data created by the seed.', true);

insert into public.performance_cycles (name, period_start, period_end, rating_scale, is_demo) values ('2026 H2 Review (demo)','2026-07-01','2026-12-31',5,true);
insert into public.performance_reviews (cycle_id, employee_id, reviewer_id, due_date, status)
select c.id, e.id, e.manager_id, current_date + 21, 'scheduled' from public.performance_cycles c, public.employees e where e.manager_id is not null;
insert into public.performance_goals (employee_id, title, measure, target_value, current_value, due_date, status)
select e.id, 'Ship quarterly objectives (demo)', 'Objectives delivered', 4, 2, '2026-12-15', 'in_progress' from public.employees e where e.department_id = (select id from public.departments where code='ENG');
