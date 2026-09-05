drop policy territories_insert on core.territories;

create policy territories_insert on core.territories
for insert to authenticated
with check (private.has_permission(organization_id, 'organization.manage'));
