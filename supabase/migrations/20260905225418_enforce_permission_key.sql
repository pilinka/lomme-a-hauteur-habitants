-- À hauteur d'habitants V4 — Lot 2
-- Une autorisation doit correspondre à la permission explicitement demandée.

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
     and p.permission_key = p_permission_key
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
