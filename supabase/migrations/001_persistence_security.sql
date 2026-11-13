-- Execute only after backup, review and explicit authorization for the target environment.
-- No production credentials, demo passwords or automatic data import are included.
begin;
create table if not exists public.users (
  id varchar(50) primary key, nome varchar(100) not null,
  email varchar(100) unique not null, senha varchar(255) not null,
  role varchar(20) not null default 'funcionario', department varchar(50) default 'Geral',
  created_at timestamptz default now()
);
create table if not exists public.tickets (
  id varchar(50) primary key, user_id varchar(50) not null references public.users(id) on delete cascade,
  user_name varchar(100) not null, user_email varchar(100) not null,
  tipo varchar(30) not null, titulo varchar(150) not null, categoria varchar(50),
  local varchar(50), tiposervico varchar(50), descricao text not null,
  urgencia varchar(20) default 'media', anexo text, status varchar(30) default 'Recebido',
  created_at timestamptz default now()
);
create table if not exists public.sessions (
  token_hash text primary key, user_id varchar(50) not null references public.users(id) on delete cascade,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.request_limits (
  key text primary key, attempts integer not null, expires_at timestamptz not null
);
-- Preserve all existing IDs; new IDs remain short enough for the existing UI.
create sequence if not exists public.helpdesk_ticket_seq minvalue 10000 start 10000;
select setval('public.helpdesk_ticket_seq', greatest(
  (select last_value + case when is_called then 1 else 0 end from public.helpdesk_ticket_seq),
  coalesce((select max(substring(id from 4)::bigint) + 1 from public.tickets where id ~ '^TK-[0-9]{1,12}$'),10000)
), false);
alter table public.tickets alter column id set default ('TK-' || nextval('public.helpdesk_ticket_seq')::text);
grant usage,select on sequence public.helpdesk_ticket_seq to service_role;
create index if not exists tickets_user_date_idx on public.tickets(user_id, created_at desc);
create index if not exists tickets_status_date_idx on public.tickets(status, created_at desc);
create index if not exists sessions_expiry_idx on public.sessions(expires_at);
alter table public.users enable row level security;
alter table public.tickets enable row level security;
alter table public.sessions enable row level security;
alter table public.request_limits enable row level security;
-- Existing permissive policies cannot grant access after these privileges are revoked.
revoke all on public.users, public.tickets, public.sessions, public.request_limits from anon, authenticated;
grant select, insert, update, delete on public.users, public.tickets, public.sessions, public.request_limits to service_role;

create or replace function public.helpdesk_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if p_limit < 1 or p_seconds < 1 or length(p_key) <> 64 then raise exception 'Invalid rate limit'; end if;
  insert into public.request_limits as limits(key, attempts, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict(key) do update set
    attempts = case when limits.expires_at <= now() then 1 else limits.attempts + 1 end,
    expires_at = case when limits.expires_at <= now() then excluded.expires_at else limits.expires_at end
  returning attempts into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.helpdesk_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.helpdesk_rate_limit(text,integer,integer) to service_role;
create or replace function public.helpdesk_change_password(p_user_id varchar,p_current_hash text,p_new_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_new_hash !~ '^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$' then raise exception 'Invalid password hash'; end if;
  update public.users set senha=p_new_hash where id=p_user_id and senha=p_current_hash;
  if not found then return false; end if;
  delete from public.sessions where user_id=p_user_id;
  return true;
end;
$$;
revoke all on function public.helpdesk_change_password(varchar,text,text) from public,anon,authenticated;
grant execute on function public.helpdesk_change_password(varchar,text,text) to service_role;
commit;
