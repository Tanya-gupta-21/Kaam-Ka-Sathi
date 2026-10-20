-- Allow one conversation to connect a specific available item with a specific need.
-- The older constraint allowed exactly one of item_id/need_id/service_id, which
-- prevented the Smart Matches screen from opening a chat.
alter table public.conversations
  drop constraint if exists conversations_check1;
alter table public.conversations
  drop constraint if exists conversations_listing_target_check;
alter table public.conversations
  add constraint conversations_listing_target_check check (
    (service_id is not null and item_id is null and need_id is null)
    or (service_id is null and (item_id is not null or need_id is not null))
  );

drop index if exists public.conversations_item_interest_unique;
drop index if exists public.conversations_need_interest_unique;
create unique index conversations_item_interest_unique
  on public.conversations (item_id, interested_user_id)
  where item_id is not null and need_id is null;
create unique index conversations_need_interest_unique
  on public.conversations (need_id, interested_user_id)
  where need_id is not null and item_id is null;
create unique index if not exists conversations_match_pair_unique
  on public.conversations (item_id, need_id, interested_user_id)
  where item_id is not null and need_id is not null;

drop policy if exists "interested user creates conversations" on public.conversations;
create policy "interested user creates conversations" on public.conversations
  for insert to authenticated with check (
    (
      interested_user_id = (select auth.uid())
      or (item_id is not null and need_id is not null and owner_id = (select auth.uid()))
    ) and (
      (
        service_id is null
        and (item_id is not null or need_id is not null)
        and (item_id is null or exists (
          select 1 from public.items i
          where i.id = conversations.item_id and i.owner_id = conversations.owner_id
        ))
        and (need_id is null or exists (
          select 1 from public.needs n
          where n.id = conversations.need_id
            and (
              n.user_id = conversations.owner_id
              or (conversations.item_id is not null and n.user_id = conversations.interested_user_id)
            )
        ))
      )
      or (
        item_id is null and need_id is null
        and exists (
          select 1 from public.services s
          where s.id = conversations.service_id
            and s.provider_id = conversations.owner_id
            and s.is_active
        )
      )
    )
  );
