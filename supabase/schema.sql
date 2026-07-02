-- =====================================================================
-- NdongoLink - Schéma de base de données Supabase
-- À exécuter dans Supabase Studio > SQL Editor
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- Table: profiles
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  first_name text,
  last_name text,
  avatar_url text,
  cover_url text,
  headline text,
  bio text,
  university text,
  field_of_study text,
  degree_level text,
  graduation_year int,
  location text,
  phone text,
  website text,
  linkedin_url text,
  twitter_url text,
  github_url text,
  skills text[] default '{}',
  interests text[] default '{}',
  is_looking_for_internship boolean default false,
  is_open_to_work boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_full_name on public.profiles (full_name);
create index if not exists idx_profiles_university on public.profiles (university);
create index if not exists idx_profiles_field_of_study on public.profiles (field_of_study);
create index if not exists idx_profiles_skills on public.profiles using gin (skills);

-- =====================================================================
-- Table: experiences
-- =====================================================================
create table if not exists public.experiences (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  organization text not null,
  type text default 'internship',
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  location text,
  created_at timestamptz not null default now()
);

create index if not exists idx_experiences_profile on public.experiences (profile_id);

-- =====================================================================
-- Table: connections
-- =====================================================================
create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists idx_connections_requester on public.connections (requester_id, status);
create index if not exists idx_connections_addressee on public.connections (addressee_id, status);

-- =====================================================================
-- Table: posts
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_url text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_author on public.posts (author_id);
create index if not exists idx_posts_created on public.posts (created_at desc);

-- =====================================================================
-- Table: post_likes
-- =====================================================================
create table if not exists public.post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists idx_post_likes_post on public.post_likes (post_id);
create index if not exists idx_post_likes_user on public.post_likes (user_id);

-- =====================================================================
-- Table: comments
-- =====================================================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_post on public.comments (post_id, created_at);

-- =====================================================================
-- Tables: conversations & messages
-- =====================================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create index if not exists idx_conv_participants_user on public.conversation_participants (user_id);
create index if not exists idx_conv_participants_conv on public.conversation_participants (conversation_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conv on public.messages (conversation_id, created_at);

-- =====================================================================
-- Table: notifications
-- =====================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  entity_id uuid,
  content text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);

-- =====================================================================
-- Table: endorsements (compétences)
-- =====================================================================
create table if not exists public.endorsements (
  id uuid primary key default uuid_generate_v4(),
  skill text not null,
  endorsed_id uuid not null references public.profiles(id) on delete cascade,
  endorser_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(skill, endorsed_id, endorser_id),
  check (endorsed_id <> endorser_id)
);

create index if not exists idx_endorsements_endorsed on public.endorsements (endorsed_id);

-- =====================================================================
-- Triggers: updated_at & auto-create profile on signup
-- =====================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_connections_updated on public.connections;
create trigger trg_connections_updated before update on public.connections
  for each row execute function public.handle_updated_at();

-- Auto-création de profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Trigger: compteurs de likes et commentaires
-- =====================================================================
create or replace function public.handle_post_likes_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes_count on public.post_likes;
create trigger trg_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.handle_post_likes_count();

create or replace function public.handle_comments_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comments_count on public.comments;
create trigger trg_comments_count
  after insert or delete on public.comments
  for each row execute function public.handle_comments_count();

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.connections enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.endorsements enable row level security;

-- Profiles: tout le monde peut lire, seul le propriétaire peut modifier
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Experiences: public en lecture, propriétaire écrit
create policy "Experiences are viewable by everyone" on public.experiences
  for select using (true);
create policy "Users can manage own experiences" on public.experiences
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Connections: visible par les deux parties
create policy "Users can view own connections" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can create connections" on public.connections
  for insert with check (auth.uid() = requester_id);
create policy "Users can update own connections" on public.connections
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can delete own connections" on public.connections
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Posts: public en lecture, auteur écrit
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);
create policy "Users can create own posts" on public.posts
  for insert with check (auth.uid() = author_id);
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- Post likes: lecture publique, écriture par utilisateur connecté
create policy "Post likes are viewable by everyone" on public.post_likes
  for select using (true);
create policy "Users can like posts" on public.post_likes
  for insert with check (auth.uid() = user_id);
create policy "Users can unlike own likes" on public.post_likes
  for delete using (auth.uid() = user_id);

-- Comments: lecture publique, écriture par auteur
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);
create policy "Users can create comments" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "Users can delete own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- Conversations: visibles par participants
create policy "Users can view own conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
    )
  );
create policy "Users can create conversations" on public.conversations
  for insert with check (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
    )
  );

-- Conversation participants
create policy "Users can view own conv participants" on public.conversation_participants
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "Users can add self to conversations" on public.conversation_participants
  for insert with check (user_id = auth.uid());

-- Messages: visibles par participants de la conversation
create policy "Users can view messages in own conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "Users can send messages in own conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "Users can update messages in own conversations" on public.messages
  for update using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

-- Notifications: visibles par le destinataire uniquement
create policy "Users can view own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications
  for update using (user_id = auth.uid());
create policy "Users can insert own notifications" on public.notifications
  for insert with check (true);
create policy "System can insert notifications" on public.notifications
  for insert with check (true);

-- Endorsements: lecture publique, écriture par utilisateur connecté
create policy "Endorsements are viewable by everyone" on public.endorsements
  for select using (true);
create policy "Users can create endorsements" on public.endorsements
  for insert with check (auth.uid() = endorser_id);
create policy "Users can delete own endorsements" on public.endorsements
  for delete using (auth.uid() = endorser_id);

-- =====================================================================
-- Realtime: activer pour les tables temps réel
-- =====================================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.connections;

-- =====================================================================
-- Storage bucket pour les avatars et images de posts
-- =====================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posts', 'posts', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
  on conflict (id) do nothing;

-- Storage policies
create policy "Public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Authenticated upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users update own avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);
create policy "Users delete own avatar" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Public read posts images" on storage.objects for select
  using (bucket_id = 'posts');
create policy "Authenticated upload posts images" on storage.objects for insert
  with check (bucket_id = 'posts' and auth.role() = 'authenticated');
create policy "Users update own posts images" on storage.objects for update
  using (bucket_id = 'posts' and auth.uid() = owner);
create policy "Users delete own posts images" on storage.objects for delete
  using (bucket_id = 'posts' and auth.uid() = owner);

create policy "Public read covers" on storage.objects for select
  using (bucket_id = 'covers');
create policy "Authenticated upload covers" on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "Users update own cover" on storage.objects for update
  using (bucket_id = 'covers' and auth.uid() = owner);
create policy "Users delete own cover" on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid() = owner);
