-- À hauteur d'habitants V4 — Lot 2
-- Durcissement issu des contrôles de clôture.

create index membership_roles_role_key_idx
  on core.membership_roles (role_key);

create index membership_territory_scopes_territory_idx
  on core.membership_territory_scopes (organization_id, territory_id);

create index role_permissions_permission_key_idx
  on reference.role_permissions (permission_key);

create trigger audit_events_guard_org before update on audit.events
for each row execute function private.guard_organization_id_immutable();

grant usage on schema audit to authenticated;
grant select on audit.events to authenticated;

create view api.my_audit_events
with (security_invoker = true)
as
select e.id, e.organization_id, e.actor_id, e.action, e.target_type,
  e.target_id, e.outcome, e.created_at
from audit.events e;

grant select on api.my_audit_events to authenticated;
