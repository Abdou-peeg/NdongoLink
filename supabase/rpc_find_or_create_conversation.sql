-- Fonction utilitaire pour trouver ou créer une conversation entre deux utilisateurs
-- À exécuter dans Supabase Studio > SQL Editor

create or replace function public.find_or_create_conversation(other_user_id uuid)
returns public.conversations
language plpgsql
security definer set search_path = public
as $$
declare
  conv_id uuid;
  existing_conv public.conversations;
begin
  -- Cherche une conversation existante entre les deux
  select c.* into existing_conv
  from public.conversations c
  where exists (
    select 1 from public.conversation_participants cp1
    where cp1.conversation_id = c.id and cp1.user_id = auth.uid()
  ) and exists (
    select 1 from public.conversation_participants cp2
    where cp2.conversation_id = c.id and cp2.user_id = other_user_id
  )
  limit 1;

  if found then
    return existing_conv;
  end if;

  -- Sinon crée une nouvelle conversation
  insert into public.conversations default values
  returning * into existing_conv;

  insert into public.conversation_participants (conversation_id, user_id)
  values (existing_conv.id, auth.uid()), (existing_conv.id, other_user_id);

  return existing_conv;
end;
$$;

grant execute on function public.find_or_create_conversation(uuid) to authenticated;
