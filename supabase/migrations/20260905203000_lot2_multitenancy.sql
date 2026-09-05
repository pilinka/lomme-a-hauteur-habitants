-- À hauteur d'habitants V4 — Lot 2
-- Socle multi-collectivité uniquement.
-- Aucun seed territorial, compte professionnel ou contenu V3.

create extension if not exists pgcrypto;

create schema if not exists core;
create schema if not exists private;
create schema if not exists reference;
create schema if not exists audit;
create schema if not exists api;

revoke all on schema core, private, reference, audit, api from public;
grant usage on schema core to authenticated;
grant usage on schema api to authenticated;

create type core.organization_status as enum ('active', 'suspended', 'archived');
create type core.territory_status as enum ('active', 'archived');
create type core.membership_status as enum ('active', 'inactive', 'suspended', 'archived');
create type core.membership_scope_mode as enum ('organization', 'territories');
create type reference.permission_scope_level as enum ('organization', 'territory');

create table core.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status core.organization_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index organizations_slug_lower_uq on core.organizations (lower(slug));

create table core.territories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  slug text not null,
  name text not null,
  status core.territory_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  constraint territories_org_id_uq unique (organization_id, id),
  constraint territories_name_not_blank check (btrim(name) <> ''),
  constraint territories_org_fk foreign key (organization_id)
    references core.organizations (id) on update restrict on delete restrict
);

create unique index territories_org_slug_lower_uq
  on core.territories (organization_id, lower(slug));

create table core.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  status core.membership_status not null default 'active',
  scope_mode core.membership_scope_mode not null default 'organization',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  constraint memberships_org_id_uq unique (organization_id, id),
  constraint memberships_one_user_per_org unique (organization_id, user_id),
  constraint memberships_org_fk foreign key (organization_id)
    references core.organizations (id) on update restrict on delete restrict,
  constraint memberships_user_fk foreign key (user_id)
    references auth.users (id) on update restrict on delete cascade
);

create index memberships_user_active_idx on core.memberships (user_id, organization_id)
  where status = 'active';

create table reference.roles (
  role_key text primary key,
  display_name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint roles_key_format check (role_key ~ '^[a-z][a-z0-9_]*$')
);

create table reference.permissions (
  permission_key text primary key,
  display_name text not null,
  scope_level reference.permission_scope_level not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint permissions_key_format check (permission_key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$')
);

create table reference.role_permissions (
  role_key text not null references reference.roles (role_key) on update restrict on delete restrict,
  permission_key text not null references reference.permissions (permission_key) on update restrict on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  primary key (role_key, permission_key)
);

create table core.membership_roles (
  organization_id uuid not null,
  membership_id uuid not null,
  role_key text not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  primary key (organization_id, membership_id, role_key),
  constraint membership_roles_membership_fk foreign key (organization_id, membership_id)
    references core.memberships (organization_id, id) on update restrict on delete cascade,
  constraint membership_roles_role_fk foreign key (role_key)
    references reference.roles (role_key) on update restrict on delete restrict
);

create index membership_roles_lookup_idx on core.membership_roles (organization_id, membership_id);

create table core.membership_territory_scopes (
  organization_id uuid not null,
  membership_id uuid not null,
  territory_id uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  primary key (organization_id, membership_id, territory_id),
  constraint scopes_membership_fk foreign key (organization_id, membership_id)
    references core.memberships (organization_id, id) on update restrict on delete cascade,
  constraint scopes_territory_fk foreign key (organization_id, territory_id)
    references core.territories (organization_id, id) on update restrict on delete restrict
);

create index scopes_lookup_idx on core.membership_territory_scopes
  (organization_id, membership_id, territory_id);

create table audit.events (
  id bigint generated always as identity primary key,
  organization_id uuid not null,
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid,
  outcome text not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint audit_action_not_blank check (btrim(action) <> ''),
  constraint audit_target_type_not_blank check (btrim(target_type) <> ''),
  constraint audit_outcome_not_blank check (btrim(outcome) <> ''),
  constraint audit_org_fk foreign key (organization_id)
    references core.organizations (id) on update restrict on delete restrict
);

create index audit_events_org_created_idx on audit.events (organization_id, created_at desc);

insert into reference.roles (role_key, display_name, description) values
  ('reader', 'Lecteur', 'Lecture des ressources autorisées'),
  ('agent', 'Agent', 'Travail courant sur les ressources autorisées'),
  ('moderator', 'Modérateur', 'Préparation de modération future'),
  ('data_referent', 'Référent données', 'Qualité des données future'),
  ('publisher', 'Publicateur', 'Publication future'),
  ('organization_admin', 'Administrateur d’organisation', 'Administration limitée au tenant'),
  ('dpo_auditor', 'DPO / auditeur', 'Lecture d’audit limitée au tenant')
on conflict (role_key) do nothing;

insert into reference.permissions (permission_key, display_name, scope_level) values
  ('organization.read', 'Lire l’organisation', 'organization'),
  ('organization.manage', 'Gérer l’organisation', 'organization'),
  ('territory.read', 'Lire les territoires', 'territory'),
  ('territory.manage', 'Gérer les territoires', 'territory'),
  ('membership.read', 'Lire les memberships', 'organization'),
  ('membership.manage', 'Gérer les memberships', 'organization'),
  ('audit.read', 'Lire les journaux nécessaires', 'organization')
on conflict (permission_key) do nothing;

insert into reference.role_permissions (role_key, permission_key) values
  ('reader', 'organization.read'),
  ('reader', 'territory.read'),
  ('agent', 'organization.read'),
  ('agent', 'territory.read'),
  ('moderator', 'organization.read'),
  ('moderator', 'territory.read'),
  ('data_referent', 'organization.read'),
  ('data_referent', 'territory.read'),
  ('publisher', 'organization.read'),
  ('publisher', 'territory.read'),
  ('organization_admin', 'organization.read'),
  ('organization_admin', 'organization.manage'),
  ('organization_admin', 'territory.read'),
  ('organization_admin', 'territory.manage'),
  ('organization_admin', 'membership.read'),
  ('organization_admin', 'membership.manage'),
  ('dpo_auditor', 'organization.read'),
  ('dpo_auditor', 'territory.read'),
  ('dpo_auditor', 'audit.read')
on conflict (role_key, permission_key) do nothing;

create or replace function private.guard_id_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'id is immutable' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function private.guard_organization_id_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function private.touch_audit_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, auth
as $$
begin
  if new.created_at is distinct from old.created_at
     or new.created_by is distinct from old.created_by then
    raise exception 'creation audit fields are immutable' using errcode = 'check_violation';
  end if;
  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function private.guard_scope_mode()
returns trigger
language plpgsql
set search_path = pg_catalog, core
as $$
begin
  if new.scope_mode = 'organization'
     and exists (
       select 1 from core.membership_territory_scopes s
       where s.organization_id = new.organization_id
         and s.membership_id = new.id
     ) then
    raise exception 'organization scope cannot retain territory scopes' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function private.guard_scope_membership()
returns trigger
language plpgsql
set search_path = pg_catalog, core
as $$
begin
  if not exists (
    select 1 from core.memberships m
    where m.organization_id = new.organization_id
      and m.id = new.membership_id
      and m.scope_mode = 'territories'
  ) then
    raise exception 'territory scope requires territories membership mode' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger organizations_guard_id before update on core.organizations
for each row execute function private.guard_id_immutable();
create trigger territories_guard_id before update on core.territories
for each row execute function private.guard_id_immutable();
create trigger memberships_guard_id before update on core.memberships
for each row execute function private.guard_id_immutable();
create trigger territories_guard_org before update on core.territories
for each row execute function private.guard_organization_id_immutable();
create trigger memberships_guard_org before update on core.memberships
for each row execute function private.guard_organization_id_immutable();
create trigger membership_roles_guard_org before update on core.membership_roles
for each row execute function private.guard_organization_id_immutable();
create trigger scopes_guard_org before update on core.membership_territory_scopes
for each row execute function private.guard_organization_id_immutable();
create trigger organizations_audit before update on core.organizations
for each row execute function private.touch_audit_columns();
create trigger territories_audit before update on core.territories
for each row execute function private.touch_audit_columns();
create trigger memberships_audit before update on core.memberships
for each row execute function private.touch_audit_columns();
create trigger membership_roles_audit before update on core.membership_roles
for each row execute function private.touch_audit_columns();
create trigger scopes_audit before update on core.membership_territory_scopes
for each row execute function private.touch_audit_columns();
create trigger memberships_scope_mode_guard before insert or update on core.memberships
for each row execute function private.guard_scope_mode();
create trigger scopes_membership_guard before insert or update on core.membership_territory_scopes
for each row execute function private.guard_scope_membership();

create or replace function private.has_permission(
  p_organization_id uuid,
  p_permission_key text,
  p_territory_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core, reference, auth
as $$
  select exists (
    select 1
    from core.memberships m
    join core.membership_roles mr
      on mr.organization_id = m.organization_id
     and mr.membership_id = m.id
    join reference.roles r
      on r.role_key = mr.role_key
     and r.is_active
    join reference.role_permissions rp
      on rp.role_key = r.role_key
    join reference.permissions p
      on p.permission_key = rp.permission_key
     and p.is_active
    join core.organizations o
      on o.id = m.organization_id
     and o.status = 'active'
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        (
          p.scope_level = 'organization'
          and p_territory_id is null
          and m.scope_mode = 'organization'
        )
        or
        (
          p.scope_level = 'territory'
          and p_territory_id is not null
          and (
            m.scope_mode = 'organization'
            or exists (
              select 1
              from core.membership_territory_scopes s
              where s.organization_id = m.organization_id
                and s.membership_id = m.id
                and s.territory_id = p_territory_id
            )
          )
          and exists (
            select 1
            from core.territories t
            where t.organization_id = p_organization_id
              and t.id = p_territory_id
          )
        )
      )
  );
$$;

revoke all on function private.has_permission(uuid, text, uuid) from public;
grant execute on function private.has_permission(uuid, text, uuid) to authenticated;

alter table core.organizations enable row level security;
alter table core.organizations force row level security;
alter table core.territories enable row level security;
alter table core.territories force row level security;
alter table core.memberships enable row level security;
alter table core.memberships force row level security;
alter table core.membership_roles enable row level security;
alter table core.membership_roles force row level security;
alter table core.membership_territory_scopes enable row level security;
alter table core.membership_territory_scopes force row level security;
alter table audit.events enable row level security;
alter table audit.events force row level security;

create policy organizations_read on core.organizations
for select to authenticated
using (private.has_permission(id, 'organization.read'));

create policy organizations_update on core.organizations
for update to authenticated
using (private.has_permission(id, 'organization.manage'))
with check (private.has_permission(id, 'organization.manage'));

create policy territories_read on core.territories
for select to authenticated
using (private.has_permission(organization_id, 'territory.read', id));

create policy territories_insert on core.territories
for insert to authenticated
with check (private.has_permission(organization_id, 'territory.manage', id));

create policy territories_update on core.territories
for update to authenticated
using (private.has_permission(organization_id, 'territory.manage', id))
with check (private.has_permission(organization_id, 'territory.manage', id));

create policy territories_delete on core.territories
for delete to authenticated
using (private.has_permission(organization_id, 'territory.manage', id));

create policy memberships_read on core.memberships
for select to authenticated
using (private.has_permission(organization_id, 'membership.read'));

create policy memberships_update on core.memberships
for update to authenticated
using (private.has_permission(organization_id, 'membership.manage'))
with check (private.has_permission(organization_id, 'membership.manage'));

create policy membership_roles_read on core.membership_roles
for select to authenticated
using (private.has_permission(organization_id, 'membership.read'));

create policy membership_roles_insert on core.membership_roles
for insert to authenticated
with check (private.has_permission(organization_id, 'membership.manage'));

create policy membership_roles_delete on core.membership_roles
for delete to authenticated
using (private.has_permission(organization_id, 'membership.manage'));

create policy scopes_read on core.membership_territory_scopes
for select to authenticated
using (private.has_permission(organization_id, 'membership.read'));

create policy scopes_insert on core.membership_territory_scopes
for insert to authenticated
with check (private.has_permission(organization_id, 'membership.manage'));

create policy scopes_delete on core.membership_territory_scopes
for delete to authenticated
using (private.has_permission(organization_id, 'membership.manage'));

create policy audit_read on audit.events
for select to authenticated
using (private.has_permission(organization_id, 'audit.read'));

revoke all on all tables in schema core from public, anon, authenticated;
revoke all on all tables in schema reference from public, anon, authenticated;
revoke all on all tables in schema audit from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

grant select on core.organizations, core.territories, core.memberships,
  core.membership_roles, core.membership_territory_scopes to authenticated;
grant update (name, status) on core.organizations to authenticated;
grant insert (organization_id, slug, name, status)
  on core.territories to authenticated;
grant update (slug, name, status) on core.territories to authenticated;
grant delete on core.territories to authenticated;
grant update (status, scope_mode) on core.memberships to authenticated;
grant insert, delete on core.membership_roles to authenticated;
grant insert, delete on core.membership_territory_scopes to authenticated;

create view api.my_organizations
with (security_invoker = true)
as
select o.id, o.slug, o.name, o.status, o.created_at, o.updated_at
from core.organizations o;

create view api.my_territories
with (security_invoker = true)
as
select t.id, t.organization_id, t.slug, t.name, t.status, t.created_at, t.updated_at
from core.territories t;

create view api.my_memberships
with (security_invoker = true)
as
select m.id, m.organization_id, m.user_id, m.status, m.scope_mode, m.created_at, m.updated_at
from core.memberships m;

grant select on api.my_organizations, api.my_territories, api.my_memberships
  to authenticated;

comment on schema api is 'Seules projections explicitement exposables par la Data API V4.';
comment on schema core is 'Données métier tenantées internes; ne pas exposer directement.';
comment on schema private is 'Fonctions internes d’autorisation; non exposé.';
comment on schema audit is 'Journal minimisé et tenanté; non exposé directement.';
comment on schema reference is 'Référentiels contrôlés; non exposé directement.';
