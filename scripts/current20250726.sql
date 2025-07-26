create table public.memory_aids (
  id uuid not null default extensions.uuid_generate_v4 (),
  memory_item_id uuid null,
  user_id uuid null,
  mind_map_data jsonb null,
  mnemonics_data jsonb null,
  sensory_associations_data jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint memory_aids_pkey primary key (id),
  constraint memory_aids_memory_item_id_fkey foreign KEY (memory_item_id) references memory_items (id) on delete CASCADE,
  constraint memory_aids_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_memory_aids_user_id on public.memory_aids using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_memory_aids_memory_item_id on public.memory_aids using btree (memory_item_id) TABLESPACE pg_default;

create trigger update_memory_aids_updated_at BEFORE
update on memory_aids for EACH row
execute FUNCTION update_updated_at_column ();


create table public.memory_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  title character varying(500) not null,
  content text not null,
  category character varying(100) null default '其他'::character varying,
  tags jsonb null default '[]'::jsonb,
  type character varying(50) null default 'general'::character varying,
  difficulty character varying(20) null default 'medium'::character varying,
  starred boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  mastery integer not null default 0,
  review_count integer not null default 0,
  review_date timestamp without time zone null default now(),
  next_review_date timestamp without time zone null default now(),
  constraint memory_items_pkey primary key (id),
  constraint memory_items_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_memory_items_user_id on public.memory_items using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_memory_items_category on public.memory_items using btree (category) TABLESPACE pg_default;

create index IF not exists idx_memory_items_starred on public.memory_items using btree (starred) TABLESPACE pg_default;

create index IF not exists idx_memory_items_created_at on public.memory_items using btree (created_at) TABLESPACE pg_default;

create trigger update_memory_items_updated_at BEFORE
update on memory_items for EACH row
execute FUNCTION update_updated_at_column ();

create table public.review_schedules (
  id uuid not null default gen_random_uuid (),
  memory_item_id uuid not null,
  user_id uuid not null,
  review_date timestamp with time zone not null,
  completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint review_schedules_pkey primary key (id),
  constraint review_schedules_memory_item_id_fkey foreign KEY (memory_item_id) references memory_items (id) on delete CASCADE,
  constraint review_schedules_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_review_schedules_user_id on public.review_schedules using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_review_schedules_memory_item_id on public.review_schedules using btree (memory_item_id) TABLESPACE pg_default;


create table public.review_schedules (
  id uuid not null default gen_random_uuid (),
  memory_item_id uuid not null,
  user_id uuid not null,
  review_date timestamp with time zone not null,
  completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint review_schedules_pkey primary key (id),
  constraint review_schedules_memory_item_id_fkey foreign KEY (memory_item_id) references memory_items (id) on delete CASCADE,
  constraint review_schedules_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_review_schedules_user_id on public.review_schedules using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_review_schedules_memory_item_id on public.review_schedules using btree (memory_item_id) TABLESPACE pg_default;

create table public.shares (
  id character varying(255) not null,
  memory_item_id uuid not null,
  user_id uuid not null,
  share_type character varying(50) not null,
  content_id character varying(255) null,
  share_content jsonb not null,
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint shares_pkey primary key (id),
  constraint shares_memory_item_id_fkey foreign KEY (memory_item_id) references memory_items (id) on delete CASCADE,
  constraint shares_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_shares_user_id on public.shares using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_shares_memory_item_id on public.shares using btree (memory_item_id) TABLESPACE pg_default;

create index IF not exists idx_shares_created_at on public.shares using btree (created_at) TABLESPACE pg_default;