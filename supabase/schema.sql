-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  headline text,
  bio text,
  location text,
  avatar_url text,
  cover_url text,
  website text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- WORK EXPERIENCE
-- ============================================================
create table public.work_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  company text not null,
  title text not null,
  location text,
  start_date date not null,
  end_date date,
  current boolean default false,
  description text,
  created_at timestamptz default now() not null
);

alter table public.work_experience enable row level security;

create policy "Work experience is viewable by everyone" on public.work_experience
  for select using (true);

create policy "Users can manage their own work experience" on public.work_experience
  for all using (auth.uid() = profile_id);

-- ============================================================
-- SKILLS
-- ============================================================
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  unique(profile_id, name)
);

alter table public.skills enable row level security;

create policy "Skills are viewable by everyone" on public.skills
  for select using (true);

create policy "Users can manage their own skills" on public.skills
  for all using (auth.uid() = profile_id);

-- ============================================================
-- CONNECTIONS
-- ============================================================
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending' not null,
  created_at timestamptz default now() not null,
  unique(requester_id, receiver_id),
  check (requester_id <> receiver_id)
);

alter table public.connections enable row level security;

create policy "Users can view connections they are part of" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can send connection requests" on public.connections
  for insert with check (auth.uid() = requester_id);

create policy "Receivers can update connection status" on public.connections
  for update using (auth.uid() = receiver_id);

create policy "Users can delete their own connection requests" on public.connections
  for delete using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- ============================================================
-- POSTS
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Users can create posts" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own posts" on public.posts
  for update using (auth.uid() = author_id);

create policy "Users can delete their own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- ============================================================
-- POST LIKES
-- ============================================================
create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone" on public.post_likes
  for select using (true);

create policy "Users can manage their own likes" on public.post_likes
  for all using (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Users can create comments" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  location text,
  description text,
  type text check (type in ('full-time', 'part-time', 'contract', 'internship', 'remote')) not null,
  salary_range text,
  created_at timestamptz default now() not null
);

alter table public.jobs enable row level security;

create policy "Jobs are viewable by everyone" on public.jobs
  for select using (true);

create policy "Users can post jobs" on public.jobs
  for insert with check (auth.uid() = poster_id);

create policy "Users can manage their own job posts" on public.jobs
  for all using (auth.uid() = poster_id);

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  cover_letter text,
  created_at timestamptz default now() not null,
  unique(job_id, applicant_id)
);

alter table public.job_applications enable row level security;

create policy "Applicants can view their own applications" on public.job_applications
  for select using (auth.uid() = applicant_id);

create policy "Job posters can view applications for their jobs" on public.job_applications
  for select using (
    exists (select 1 from public.jobs where id = job_id and poster_id = auth.uid())
  );

create policy "Users can apply to jobs" on public.job_applications
  for insert with check (auth.uid() = applicant_id);

create policy "Applicants can delete their own applications" on public.job_applications
  for delete using (auth.uid() = applicant_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null
);

alter table public.conversations enable row level security;

create policy "Users can create conversations" on public.conversations
  for insert with check (true);

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  primary key (conversation_id, profile_id)
);

alter table public.conversation_participants enable row level security;

-- Add conversations select policy after conversation_participants exists
create policy "Users can view their conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id and profile_id = auth.uid()
    )
  );

create policy "Participants can view conversation participants" on public.conversation_participants
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );

create policy "Users can add participants" on public.conversation_participants
  for insert with check (true);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Participants can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and profile_id = auth.uid()
    )
  );

create policy "Participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and profile_id = auth.uid()
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
