-- À hauteur d'habitants V4 — Lot 2
-- Durcissements finaux issus de la contre-revue indépendante.

drop view api.my_audit_events;

alter table audit.events drop column target_id;

create view api.my_audit_events
with (security_invoker = true)
as
select e.id, e.organization_id, e.actor_id, e.action, e.target_type,
  e.outcome, e.created_at
from audit.events e;

grant select on api.my_audit_events to authenticated;

drop policy territories_delete on core.territories;
revoke delete on core.territories from authenticated;

revoke insert on core.membership_roles from authenticated;
grant insert (organization_id, membership_id, role_key)
  on core.membership_roles to authenticated;

revoke insert on core.membership_territory_scopes from authenticated;
grant insert (organization_id, membership_id, territory_id)
  on core.membership_territory_scopes to authenticated;

alter function private.guard_scope_mode() security definer;
alter function private.guard_scope_membership() security definer;

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
  new.updated_by := coalesce(auth.uid(), old.updated_by);
  return new;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;

alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

grant execute on function private.has_permission(uuid, text, uuid) to authenticated;

comment on policy territories_insert on core.territories is
  'La création d’un nouveau périmètre relève de organization.manage; aucun territoire préexistant ne peut servir de scope.';
