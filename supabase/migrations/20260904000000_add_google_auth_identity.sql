alter table public.users add column if not exists auth_user_id uuid unique;
