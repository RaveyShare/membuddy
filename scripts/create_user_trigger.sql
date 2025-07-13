-- Creates a trigger function that inserts a new row into public.users
-- whenever a new user is created in auth.users.
create or replace function public.create_public_user_on_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Creates a trigger that fires the function on new user creation
create or replace trigger trigger_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_public_user_on_signup();
