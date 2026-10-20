-- Community reporting, member blocking, and database-level block enforcement.

create table public.member_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index member_blocks_blocked_id_idx on public.member_blocks (blocked_id);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('item', 'need', 'service', 'profile', 'conversation', 'message')),
  target_id text not null check (length(target_id) between 1 and 80),
  target_label text not null check (length(target_label) between 1 and 160),
  target_excerpt text check (target_excerpt is null or length(target_excerpt) <= 400),
  reason text not null check (reason in ('spam', 'scam', 'harassment', 'inappropriate', 'unsafe', 'other')),
  details text not null default '' check (length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create index community_reports_status_created_idx on public.community_reports (status, created_at desc);
create index community_reports_reported_user_idx on public.community_reports (reported_user_id, created_at desc);
create unique index community_reports_one_active_target_idx
  on public.community_reports (reporter_id, target_type, target_id)
  where status in ('open', 'reviewing');

create or replace function public.get_my_blocked_members()
returns table (
  blocked_id uuid,
  full_name text,
  city text,
  avatar_url text,
  blocked_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.city, p.avatar_url, b.created_at
  from public.member_blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;

create or replace function public.users_are_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;
  if (select auth.uid()) not in (p_user_a, p_user_b) and not public.is_admin() then
    raise exception 'You can only check your own block relationships' using errcode = '42501';
  end if;
  return p_user_a is not null and p_user_b is not null and exists (
    select 1 from public.member_blocks b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
end;
$$;

create or replace function public.submit_community_report(
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_details text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter_id uuid := (select auth.uid());
  v_reported_user_id uuid;
  v_target_label text;
  v_target_excerpt text;
  v_details text := coalesce(p_details, '');
  v_target_uuid uuid;
  v_conversation public.conversations%rowtype;
  v_message_sender uuid;
  v_message text;
  v_report_count integer;
begin
  if v_reporter_id is null then
    raise exception 'Sign in to submit a report' using errcode = '42501';
  end if;

  if p_target_type is null or p_target_type not in ('item', 'need', 'service', 'profile', 'conversation', 'message') then
    raise exception 'Unsupported report target';
  end if;
  if p_reason is null or p_reason not in ('spam', 'scam', 'harassment', 'inappropriate', 'unsafe', 'other') then
    raise exception 'Choose a valid report reason';
  end if;
  if p_target_id is null or length(p_target_id) not between 1 and 80 then
    raise exception 'Report target is invalid';
  end if;
  if length(v_details) > 1000 then
    raise exception 'Report details must be 1000 characters or fewer';
  end if;

  if p_target_type in ('item', 'need') then
    if p_target_id !~ '^[0-9]{1,18}$' then
      raise exception 'Report target is invalid';
    end if;
    if p_target_type = 'item' then
      select owner_id, title into v_reported_user_id, v_target_label
      from public.items where id = p_target_id::bigint;
    else
      select user_id, title into v_reported_user_id, v_target_label
      from public.needs where id = p_target_id::bigint;
    end if;
    if not found then
      raise exception 'This community post could not be found';
    end if;
  elsif p_target_type = 'service' then
    if p_target_id !~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$' then
      raise exception 'Report target is invalid';
    end if;
    v_target_uuid := p_target_id::uuid;
    select provider_id, title into v_reported_user_id, v_target_label
    from public.services where id = v_target_uuid;
    if not found then
      raise exception 'This service could not be found';
    end if;
  elsif p_target_type = 'profile' then
    if p_target_id !~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$' then
      raise exception 'Report target is invalid';
    end if;
    v_reported_user_id := p_target_id::uuid;
    select coalesce(nullif(trim(full_name), ''), 'Community member')
      into v_target_label from public.profiles where id = v_reported_user_id;
    if not found then
      raise exception 'This member could not be found';
    end if;
  elsif p_target_type = 'conversation' then
    if p_target_id !~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$' then
      raise exception 'Report target is invalid';
    end if;
    v_target_uuid := p_target_id::uuid;
    select * into v_conversation from public.conversations c
    where c.id = v_target_uuid
      and v_reporter_id in (c.owner_id, c.interested_user_id);
    if not found then
      raise exception 'Conversation not found or you are not a participant' using errcode = '42501';
    end if;
    v_reported_user_id := case
      when v_conversation.owner_id = v_reporter_id then v_conversation.interested_user_id
      else v_conversation.owner_id end;
    v_target_label := 'Community conversation';
    if v_conversation.item_id is not null then
      select 'Chat about ' || title into v_target_label from public.items where id = v_conversation.item_id;
    elsif v_conversation.need_id is not null then
      select 'Chat about ' || title into v_target_label from public.needs where id = v_conversation.need_id;
    elsif v_conversation.service_id is not null then
      select 'Chat about ' || title into v_target_label from public.services where id = v_conversation.service_id;
    end if;
  elsif p_target_type = 'message' then
    if p_target_id !~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$' then
      raise exception 'Report target is invalid';
    end if;
    v_target_uuid := p_target_id::uuid;
    select m.sender_id, m.message into v_message_sender, v_message
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = v_target_uuid
      and v_reporter_id in (c.owner_id, c.interested_user_id);
    if not found then
      raise exception 'Message not found or you are not a participant' using errcode = '42501';
    end if;
    v_reported_user_id := v_message_sender;
    v_target_label := 'Message in community conversation';
    v_target_excerpt := left(v_message, 400);
  end if;

  if v_reported_user_id is null or v_reported_user_id = v_reporter_id then
    raise exception 'You cannot report your own content';
  end if;

  select count(*) into v_report_count from public.community_reports
  where reporter_id = v_reporter_id and created_at > now() - interval '24 hours';
  if v_report_count >= 10 then
    raise exception 'Daily report limit reached. Try again later';
  end if;

  insert into public.community_reports (
    reporter_id, reported_user_id, target_type, target_id, target_label,
    target_excerpt, reason, details
  ) values (
    v_reporter_id, v_reported_user_id, p_target_type, p_target_id,
    coalesce(nullif(trim(v_target_label), ''), 'Community content'),
    v_target_excerpt, p_reason, trim(v_details)
  ) returning id into v_target_uuid;

  return v_target_uuid;
end;
$$;

create or replace function public.start_handover(p_item_id bigint, p_receiver_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_giver_id uuid := (select auth.uid());
  v_handover_id uuid;
begin
  if v_giver_id is null or p_receiver_id = v_giver_id then
    raise exception 'Invalid handover participants';
  end if;
  if public.users_are_blocked(v_giver_id, p_receiver_id) then
    raise exception 'A handover cannot start between blocked members';
  end if;
  if not exists (select 1 from public.items where id = p_item_id and owner_id = v_giver_id) then
    raise exception 'You do not own this item' using errcode = '42501';
  end if;
  if not (
    exists (select 1 from public.interests where item_id = p_item_id and interested_user_id = p_receiver_id)
    or exists (select 1 from public.conversations where item_id = p_item_id and interested_user_id = p_receiver_id)
  ) then
    raise exception 'The receiver has not expressed interest';
  end if;
  insert into public.item_handovers (item_id, giver_id, receiver_id)
  values (p_item_id, v_giver_id, p_receiver_id)
  returning id into v_handover_id;
  return v_handover_id;
end;
$$;

create or replace function public.respond_handover(p_handover_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handover public.item_handovers%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to respond to a handover' using errcode = '42501';
  end if;
  select * into v_handover from public.item_handovers
  where id = p_handover_id for update;
  if not found or v_handover.receiver_id <> (select auth.uid()) then
    raise exception 'Handover not found or access denied' using errcode = '42501';
  end if;
  if v_handover.status <> 'pending' then
    raise exception 'This handover has already been answered';
  end if;
  if p_accept and public.users_are_blocked(v_handover.giver_id, v_handover.receiver_id) then
    raise exception 'A blocked handover cannot be confirmed';
  end if;
  update public.item_handovers
  set status = case when p_accept then 'confirmed' else 'declined' end,
      confirmed_at = case when p_accept then now() else null end
  where id = p_handover_id;
  if p_accept then
    update public.profiles set points = points + 10 where id = v_handover.giver_id;
    update public.profiles set points = points + 2 where id = v_handover.receiver_id;
  end if;
end;
$$;

alter table public.member_blocks enable row level security;
alter table public.community_reports enable row level security;

create policy "members read blocks they created" on public.member_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "members block other accounts" on public.member_blocks
  for insert to authenticated with check (
    blocker_id = (select auth.uid()) and blocker_id <> blocked_id
  );
create policy "members unblock accounts" on public.member_blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "reporters and admins read community reports" on public.community_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or public.is_admin());
create policy "admins update report status" on public.community_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "authenticated users read items" on public.items;
create policy "authenticated users read items" on public.items
  for select to authenticated using (
    owner_id = (select auth.uid()) or public.is_admin()
    or not public.users_are_blocked((select auth.uid()), owner_id)
  );

drop policy "authenticated users read needs" on public.needs;
create policy "authenticated users read needs" on public.needs
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_admin()
    or not public.users_are_blocked((select auth.uid()), user_id)
  );

drop policy "authenticated users read active services" on public.services;
create policy "authenticated users read active services" on public.services
  for select to authenticated using (
    is_active and (
      provider_id = (select auth.uid()) or public.is_admin()
      or not public.users_are_blocked((select auth.uid()), provider_id)
    )
    or provider_id = (select auth.uid()) or public.is_admin()
  );

create policy "blocked members cannot start conversations" on public.conversations
  as restrictive for insert to authenticated
  with check (not public.users_are_blocked(owner_id, interested_user_id));

create policy "blocked members cannot send messages" on public.messages
  as restrictive for insert to authenticated
  with check (
    not exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.users_are_blocked(c.owner_id, c.interested_user_id)
    )
  );

create policy "blocked members cannot express item interest" on public.interests
  as restrictive for insert to authenticated
  with check (
    not exists (
      select 1 from public.items i
      where i.id = item_id
        and public.users_are_blocked(i.owner_id, interested_user_id)
    )
  );

create policy "blocked members cannot offer help" on public.need_interests
  as restrictive for insert to authenticated
  with check (
    not exists (
      select 1 from public.needs n
      where n.id = need_id
        and public.users_are_blocked(n.user_id, interested_user_id)
    )
  );

create or replace view public.profiles_public with (security_invoker = false) as
  select id, full_name, city, locality, avatar_url, bio, points, last_seen
  from public.profiles p
  where public.is_admin()
     or not public.users_are_blocked((select auth.uid()), p.id);

grant select, insert, delete on public.member_blocks to authenticated;
grant select on public.community_reports to authenticated;
grant update (status, reviewed_by, reviewed_at) on public.community_reports to authenticated;
grant execute on function public.get_my_blocked_members() to authenticated;
grant execute on function public.users_are_blocked(uuid, uuid) to authenticated;
grant execute on function public.submit_community_report(text, text, text, text) to authenticated;

revoke all on function public.get_my_blocked_members() from public, anon;
revoke all on function public.users_are_blocked(uuid, uuid) from public, anon;
revoke all on function public.submit_community_report(text, text, text, text) from public, anon;
