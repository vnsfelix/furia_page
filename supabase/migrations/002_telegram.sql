-- Local preparation only. Apply after 001 and explicit authorization.
begin;
alter table public.tickets add column if not exists origem text not null default 'web';
create table if not exists public.telegram_link_tokens (
  token_hash text primary key, bot_key text not null,
  user_id varchar(50) not null references public.users(id) on delete cascade,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.telegram_links (
  bot_key text not null, telegram_user_id bigint not null,
  user_id varchar(50) not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(bot_key,telegram_user_id), unique(bot_key,user_id)
);
create table if not exists public.telegram_sessions (
  bot_key text not null, chat_id bigint not null, version integer not null default 0,
  last_message_id bigint not null default 0, state jsonb not null default '{"stage":"idle","draft":{}}',
  expires_at timestamptz not null default now(), primary key(bot_key,chat_id)
);
create table if not exists public.telegram_updates (
  bot_key text not null, update_id bigint not null,
  created_at timestamptz not null default now(), primary key(bot_key,update_id)
);
create table if not exists public.telegram_outbox (
  id bigint generated always as identity primary key, bot_key text not null, chat_id bigint not null,
  reply text not null, attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
  lease_until timestamptz, lease_token uuid, delivered_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists telegram_outbox_pending_idx on public.telegram_outbox(next_attempt_at) where delivered_at is null;
alter table public.telegram_link_tokens enable row level security;
alter table public.telegram_links enable row level security;
alter table public.telegram_sessions enable row level security;
alter table public.telegram_updates enable row level security;
alter table public.telegram_outbox enable row level security;
revoke all on public.telegram_link_tokens,public.telegram_links,public.telegram_sessions,public.telegram_updates,public.telegram_outbox from anon,authenticated;
grant select,insert,update,delete on public.telegram_link_tokens,public.telegram_links,public.telegram_sessions,public.telegram_updates,public.telegram_outbox to service_role;
grant usage,select on sequence public.telegram_outbox_id_seq to service_role;

create or replace function public.helpdesk_process_telegram(p_event jsonb)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  bot text := p_event->>'bot'; chat bigint := (p_event->>'chatId')::bigint;
  sender bigint := (p_event->>'senderId')::bigint; upd bigint := (p_event->>'updateId')::bigint;
  msg bigint := (p_event->>'messageId')::bigint; current_state public.telegram_sessions%rowtype;
  actor public.users%rowtype; linked_user varchar(50); token_user varchar(50);
  reply_text text := p_event->>'reply'; next_state jsonb := p_event->'next'; t jsonb := p_event->'ticket';
  protocol text;
begin
  if chat <> sender or chat <= 0 or length(bot) not between 1 and 100 or length(reply_text) > 4096 then raise exception 'Invalid Telegram event'; end if;
  insert into public.telegram_sessions(bot_key,chat_id) values(bot,chat) on conflict do nothing;
  select * into current_state from public.telegram_sessions where bot_key=bot and chat_id=chat for update;
  if exists(select 1 from public.telegram_updates where bot_key=bot and update_id=upd) then return 'duplicate'; end if;
  if msg <= current_state.last_message_id then
    insert into public.telegram_updates(bot_key,update_id) values(bot,upd); return 'ignored';
  end if;
  if current_state.version <> (p_event->>'expectedVersion')::integer then return 'retry'; end if;
  if not public.helpdesk_rate_limit(p_event->>'rateKey',60,60) then
    insert into public.telegram_updates(bot_key,update_id) values(bot,upd);
    -- Discard abusive traffic without changing the draft or creating unlimited replies.
    return 'limited';
  end if;
  if p_event->>'linkHash' is not null then
    select user_id into token_user from public.telegram_link_tokens
      where token_hash=p_event->>'linkHash' and bot_key=bot and expires_at>now() for update;
    if token_user is null then reply_text := 'Vínculo inválido ou expirado. Gere um novo na página Minha Conta.';
    else
      -- Serialize claims for the same internal account, even across different chats.
      perform 1 from public.users where id=token_user for update;
      if exists(select 1 from public.telegram_links where bot_key=bot and ((user_id=token_user and telegram_user_id<>sender) or (telegram_user_id=sender and user_id<>token_user))) then
        reply_text := 'Já existe outro vínculo. Desvincule primeiro na página Minha Conta.';
      else
        insert into public.telegram_links(bot_key,telegram_user_id,user_id) values(bot,sender,token_user) on conflict do nothing;
        delete from public.telegram_link_tokens where user_id=token_user and bot_key=bot;
      end if;
    end if;
    next_state := '{"stage":"idle","draft":{}}';
  else
    select user_id into linked_user from public.telegram_links where bot_key=bot and telegram_user_id=sender;
    if linked_user is null then
      reply_text := 'Vincule sua conta em Minha Conta no site antes de usar /chamado.';
      next_state := '{"stage":"idle","draft":{}}';
    elsif t is not null and t <> 'null'::jsonb then
      if current_state.state->>'stage' <> 'confirmar' or current_state.expires_at <= now() then return 'retry'; end if;
      select * into actor from public.users where id=linked_user for key share;
      if not found then raise exception 'Account unavailable'; end if;
      insert into public.tickets(user_id,user_name,user_email,tipo,titulo,categoria,local,tiposervico,descricao,urgencia,status,origem)
      values(actor.id,actor.nome,actor.email,t->>'tipo',t->>'titulo',t->>'categoria',t->>'local',t->>'tiposervico',t->>'descricao',t->>'urgencia','Recebido','telegram') returning id into protocol;
      reply_text := 'Chamado ' || protocol || ' aberto com status Recebido. Ele aparecerá no site.';
    end if;
  end if;
  update public.telegram_sessions set version=version+1,last_message_id=msg,state=next_state,expires_at=now()+interval '30 minutes' where bot_key=bot and chat_id=chat;
  insert into public.telegram_updates(bot_key,update_id) values(bot,upd);
  insert into public.telegram_outbox(bot_key,chat_id,reply) values(bot,chat,reply_text);
  return 'processed';
end;
$$;

create or replace function public.helpdesk_claim_telegram_outbox(p_limit integer,p_bot text)
returns setof public.telegram_outbox language sql security invoker set search_path = '' as $$
  update public.telegram_outbox o set lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid(),attempts=attempts+1
  where o.id in (
    select q.id from public.telegram_outbox q where q.bot_key=p_bot and q.delivered_at is null and q.next_attempt_at<=now()
      and (q.lease_until is null or q.lease_until<now())
      and not exists(select 1 from public.telegram_outbox earlier where earlier.bot_key=q.bot_key and earlier.chat_id=q.chat_id and earlier.id<q.id and earlier.delivered_at is null)
    order by q.id limit least(greatest(p_limit,1),10) for update skip locked
  ) returning o.*;
$$;
create or replace function public.helpdesk_finish_telegram_outbox(p_id bigint,p_lease uuid,p_success boolean)
returns void language sql security invoker set search_path = '' as $$
  update public.telegram_outbox set delivered_at=case when p_success then now() else null end,
    lease_until=null,lease_token=null,next_attempt_at=now()+make_interval(secs=>least(3600,power(2,least(attempts,10))::integer*10))
  where id=p_id and lease_token=p_lease and delivered_at is null;
$$;
create or replace function public.helpdesk_unlink_telegram(p_user_id varchar)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.users where id=p_user_id for update;
  -- Do not lock chat sessions after the account row (webhook locks them in reverse
  -- order). Unlinked drafts are unusable; /start resets the draft on a new link.
  delete from public.telegram_links where user_id=p_user_id;
  delete from public.telegram_link_tokens where user_id=p_user_id;
end;
$$;
revoke all on function public.helpdesk_process_telegram(jsonb),public.helpdesk_claim_telegram_outbox(integer,text),public.helpdesk_finish_telegram_outbox(bigint,uuid,boolean),public.helpdesk_unlink_telegram(varchar) from public,anon,authenticated;
grant execute on function public.helpdesk_process_telegram(jsonb),public.helpdesk_claim_telegram_outbox(integer,text),public.helpdesk_finish_telegram_outbox(bigint,uuid,boolean),public.helpdesk_unlink_telegram(varchar) to service_role;
commit;
