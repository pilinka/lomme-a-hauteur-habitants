-- À hauteur d'habitants V4 — Lot 2
-- Tests transactionnels rejouables. Toutes les données synthétiques sont annulées.

begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'LOT2 ASSERTION FAILED: %', message;
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_anonymous
) values
  ('30000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'lot2-a-admin@example.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('30000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'lot2-b-reader@example.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('30000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'lot2-inactive@example.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('30000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'lot2-multi@example.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('30000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'lot2-scoped@example.invalid', '', now(), '{}', '{}', now(), now(), false),
  ('30000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'lot2-dpo@example.invalid', '', now(), '{}', '{}', now(), now(), false);

insert into core.organizations (id, slug, name, status) values
  ('10000000-0000-4000-8000-000000000001', 'synthetic-a', 'Synthetic A', 'active'),
  ('10000000-0000-4000-8000-000000000002', 'synthetic-b', 'Synthetic B', 'active');

insert into core.territories (id, organization_id, slug, name, status) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a-one', 'A One', 'active'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'a-two', 'A Two', 'active'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'b-one', 'B One', 'active');

insert into core.memberships (id, organization_id, user_id, status, scope_mode) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'active', 'organization'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'active', 'organization'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'inactive', 'organization'),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'active', 'organization'),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', 'active', 'organization'),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 'active', 'territories'),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', 'active', 'organization');

insert into core.membership_roles (organization_id, membership_id, role_key) values
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'organization_admin'),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'reader'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'reader'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 'reader'),
  ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000005', 'reader'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', 'reader'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007', 'dpo_auditor');

insert into core.membership_territory_scopes (organization_id, membership_id, territory_id)
values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001');

insert into audit.events (organization_id, actor_id, action, target_type, outcome) values
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'synthetic.read', 'organization', 'allowed'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'synthetic.read', 'organization', 'allowed');

-- Configuration structurelle et absence d'exposition des référentiels.
select pg_temp.assert_true(
  (select bool_and(c.relrowsecurity)
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('core', 'reference', 'audit')
     and c.relkind = 'r'
     and c.relname in ('organizations', 'territories', 'memberships', 'membership_roles',
       'membership_territory_scopes', 'events', 'roles', 'permissions', 'role_permissions')),
  'RLS doit être activée sur toutes les tables du Lot 2'
);

select pg_temp.assert_true(
  (select count(*) = 0 from pg_policies
   where schemaname = 'reference'
     and tablename in ('roles', 'permissions', 'role_permissions')),
  'les référentiels ne doivent avoir aucune politique client'
);

select pg_temp.assert_true(
  not has_table_privilege('anon', 'reference.roles', 'SELECT')
  and not has_table_privilege('authenticated', 'reference.roles', 'SELECT')
  and not has_table_privilege('anon', 'reference.permissions', 'SELECT')
  and not has_table_privilege('authenticated', 'reference.permissions', 'SELECT')
  and not has_table_privilege('anon', 'reference.role_permissions', 'SELECT')
  and not has_table_privilege('authenticated', 'reference.role_permissions', 'SELECT'),
  'les privilèges client des référentiels doivent rester révoqués'
);

select pg_temp.assert_true(
  (select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'api' and c.relkind = 'v'
     and c.reloptions @> array['security_invoker=true']),
  'toutes les vues API doivent être security_invoker'
);

select pg_temp.assert_true(
  not has_schema_privilege('anon', 'core', 'USAGE')
  and not has_schema_privilege('anon', 'api', 'USAGE')
  and not has_schema_privilege('anon', 'reference', 'USAGE')
  and not has_schema_privilege('anon', 'audit', 'USAGE')
  and not has_schema_privilege('anon', 'public', 'USAGE')
  and not has_schema_privilege('authenticated', 'public', 'USAGE'),
  'anon ne doit utiliser aucun schéma du Lot 2'
);

select pg_temp.assert_true(
  (select 'pgrst.db_schemas=api' = any(coalesce(rolconfig, array[]::text[]))
   from pg_roles where rolname = 'authenticator'),
  'PostgREST doit exposer uniquement le schéma api'
);

select pg_temp.assert_true(
  not has_function_privilege('anon', 'private.has_permission(uuid,text,uuid)', 'EXECUTE'),
  'anon ne doit pas pouvoir exécuter has_permission'
);

select pg_temp.assert_true(
  (select prosecdef
     and prorettype = 'boolean'::regtype
     and proconfig @> array['search_path=pg_catalog, core, reference, auth']
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname = 'has_permission'),
  'has_permission doit rester SECURITY DEFINER booléenne avec search_path fermé'
);

select pg_temp.assert_true(
  (select bool_and(
     not has_function_privilege('anon', p.oid, 'EXECUTE')
     and not has_function_privilege('authenticated', p.oid, 'EXECUTE')
   )
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname <> 'has_permission'),
  'les fonctions de trigger privées ne doivent pas être exécutables par PUBLIC'
);

set local role anon;
do $$
begin
  begin
    perform count(*) from core.organizations;
    raise exception 'LOT2 ASSERTION FAILED: anon a lu core.organizations';
  exception
      when insufficient_privilege then null;
  end;

  begin
    insert into core.membership_roles (organization_id, membership_id, role_key)
    values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'organization_admin');
    raise exception 'LOT2 ASSERTION FAILED: anon s’est attribué un rôle';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into core.organizations (slug, name) values ('anon-org', 'Anon org');
    raise exception 'LOT2 ASSERTION FAILED: anon a créé une organisation';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Administrateur A : accès A, impossibilité de traverser vers B.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 1 from core.organizations), 'admin A doit voir une seule organisation');
select pg_temp.assert_true((select bool_and(id = '10000000-0000-4000-8000-000000000001') from api.my_organizations), 'admin A ne doit voir que A');
select pg_temp.assert_true((select count(*) = 2 from api.my_territories), 'admin A doit voir les deux territoires A');
select pg_temp.assert_true((select count(*) = 5 from api.my_memberships), 'admin A doit voir les memberships A uniquement');

insert into core.territories (organization_id, slug, name, status)
values ('10000000-0000-4000-8000-000000000001', 'a-created-by-admin', 'A Created', 'active');
select pg_temp.assert_true((select count(*) = 3 from api.my_territories), 'admin A doit pouvoir créer un territoire A');

do $$
begin
  begin
    insert into core.territories (organization_id, slug, name, status)
    values ('10000000-0000-4000-8000-000000000002', 'forbidden-from-a', 'Forbidden from A', 'active');
    raise exception 'LOT2 ASSERTION FAILED: admin A a créé un territoire B';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into core.membership_roles (organization_id, membership_id, role_key)
    values ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'organization_admin');
    raise exception 'LOT2 ASSERTION FAILED: admin A a attribué un rôle dans B';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into core.membership_roles (organization_id, membership_id, role_key)
    values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'reader');
    raise exception 'LOT2 ASSERTION FAILED: admin A a lié une membership B à A';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into core.membership_territory_scopes (organization_id, membership_id, territory_id)
    values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003');
    raise exception 'LOT2 ASSERTION FAILED: admin A a lié un territoire B à A';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into core.membership_roles (
      organization_id, membership_id, role_key, created_by
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000003',
      'agent',
      '30000000-0000-4000-8000-000000000002'
    );
    raise exception 'LOT2 ASSERTION FAILED: métadonnée d’attribution falsifiable';
  exception
      when insufficient_privilege then null;
  end;

  begin
    update core.memberships set scope_mode = 'organization'
    where id = '40000000-0000-4000-8000-000000000006';
    raise exception 'LOT2 ASSERTION FAILED: scope territorial perdu sans suppression explicite';
  exception
    when check_violation then null;
  end;

  begin
    execute $sql$update core.territories
      set organization_id = '10000000-0000-4000-8000-000000000002'
      where id = '20000000-0000-4000-8000-000000000001'$sql$;
    raise exception 'LOT2 ASSERTION FAILED: organization_id modifiable par authenticated';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
declare affected integer;
begin
  update core.organizations set name = 'Forbidden B update'
  where id = '10000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 0, 'admin A ne doit pas modifier B');

  update core.memberships set status = 'suspended'
  where id = '40000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 0, 'admin A ne doit pas modifier une membership B');
end;
$$;

do $$
begin
  begin
    execute $sql$insert into core.territories (id, organization_id, slug, name, status)
      values ('20000000-0000-4000-8000-000000000099',
      '10000000-0000-4000-8000-000000000001', 'chosen-id', 'Chosen id', 'active')$sql$;
    raise exception 'LOT2 ASSERTION FAILED: un client a choisi un id de territoire';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Lecteur B : B seulement.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 1 from api.my_organizations), 'lecteur B doit voir une seule organisation');
select pg_temp.assert_true((select bool_and(id = '10000000-0000-4000-8000-000000000002') from api.my_organizations), 'lecteur B ne doit voir que B');
select pg_temp.assert_true((select count(*) = 1 from api.my_territories), 'lecteur B ne doit voir que B One');
reset role;
select pg_temp.assert_true(
  not private.has_permission('10000000-0000-4000-8000-000000000002', 'organization.manage'),
  'un lecteur B ne doit pas recevoir organization.manage'
);

-- Membership inactif : aucun droit malgré un utilisateur Auth valide.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 0 from api.my_organizations), 'membership inactif ne doit rien voir');
select pg_temp.assert_true((select count(*) = 0 from api.my_territories), 'membership inactif ne doit voir aucun territoire');
do $$
begin
  begin
    insert into core.territories (organization_id, slug, name, status)
    values ('10000000-0000-4000-8000-000000000001', 'inactive-write', 'Inactive write', 'active');
    raise exception 'LOT2 ASSERTION FAILED: membership inactive autorisée en écriture';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Double appartenance explicite : A et B, sans élargissement implicite.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 2 from api.my_organizations), 'double appartenance doit exposer A et B');
select pg_temp.assert_true((select count(*) = 4 from api.my_territories), 'double appartenance doit exposer les quatre territoires de la transaction');
reset role;

-- Portée territoriale : A One seulement, sans organisation ni A Two/B One.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 0 from api.my_organizations), 'portée territoriale ne doit pas devenir une portée organisation');
select pg_temp.assert_true((select count(*) = 1 from api.my_territories), 'portée territoriale doit exposer un seul territoire');
select pg_temp.assert_true((select bool_and(id = '20000000-0000-4000-8000-000000000001') from api.my_territories), 'A One doit être le seul territoire visible');
reset role;

-- DPO A : audit A uniquement, sans droit de gestion.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 1 from api.my_audit_events), 'DPO A doit voir un événement A');
select pg_temp.assert_true((select bool_and(organization_id = '10000000-0000-4000-8000-000000000001') from api.my_audit_events), 'DPO A ne doit pas voir l’audit B');
do $$
declare affected integer;
begin
  update core.organizations set name = 'Forbidden DPO update'
  where id = '10000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 0, 'DPO ne doit pas gérer l’organisation');
end;
$$;
reset role;

-- Contraintes composites et immutabilité, testées comme propriétaire.
do $$
begin
  begin
    insert into core.membership_roles (organization_id, membership_id, role_key)
    values ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'reader');
    raise exception 'LOT2 ASSERTION FAILED: rôle inter-tenant accepté';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into core.membership_territory_scopes (organization_id, membership_id, territory_id)
    values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003');
    raise exception 'LOT2 ASSERTION FAILED: territoire inter-tenant accepté';
  exception
    when foreign_key_violation then null;
  end;

  begin
    update core.territories
    set organization_id = '10000000-0000-4000-8000-000000000002'
    where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'LOT2 ASSERTION FAILED: organization_id territoire modifiable';
  exception
      when check_violation then null;
  end;

  begin
    update core.memberships
    set organization_id = '10000000-0000-4000-8000-000000000002'
    where id = '40000000-0000-4000-8000-000000000001';
    raise exception 'LOT2 ASSERTION FAILED: organization_id membership modifiable';
  exception
    when check_violation then null;
  end;

  begin
    update core.membership_roles
    set organization_id = '10000000-0000-4000-8000-000000000002'
    where membership_id = '40000000-0000-4000-8000-000000000001';
    raise exception 'LOT2 ASSERTION FAILED: organization_id rôle modifiable';
  exception
    when check_violation then null;
  end;

  begin
    update core.membership_territory_scopes
    set organization_id = '10000000-0000-4000-8000-000000000002'
    where membership_id = '40000000-0000-4000-8000-000000000006';
    raise exception 'LOT2 ASSERTION FAILED: organization_id scope modifiable';
  exception
    when check_violation then null;
  end;

  begin
    update audit.events
    set organization_id = '10000000-0000-4000-8000-000000000002'
    where organization_id = '10000000-0000-4000-8000-000000000001';
    raise exception 'LOT2 ASSERTION FAILED: organization_id audit modifiable';
  exception
    when check_violation then null;
  end;
end;
$$;

select pg_temp.assert_true(
  not has_column_privilege('authenticated', 'core.organizations', 'id', 'UPDATE')
  and not has_column_privilege('authenticated', 'core.territories', 'id', 'INSERT')
  and not has_column_privilege('authenticated', 'core.territories', 'organization_id', 'UPDATE')
  and not has_table_privilege('authenticated', 'core.territories', 'DELETE')
  and not has_column_privilege('authenticated', 'core.membership_roles', 'created_by', 'INSERT')
  and not has_column_privilege('authenticated', 'core.membership_territory_scopes', 'created_at', 'INSERT'),
  'les colonnes d’identité et de tenant doivent rester hors privilèges client'
);

select pg_temp.assert_true(
  (select count(*) = 7 from reference.roles)
  and (select count(*) = 7 from reference.permissions)
  and (select count(*) = 19 from reference.role_permissions),
  'les référentiels minimaux doivent être complets'
);

select pg_temp.assert_true(
  (select count(*) = 0 from core.organizations where name ilike '%lomme%' or slug ilike '%lomme%')
  and (select count(*) = 0 from core.territories where name ilike '%lomme%' or slug ilike '%lomme%'),
  'aucune donnée réelle de Lomme ne doit être présente'
);

select 'PASS' as lot2_rls,
  6 as synthetic_auth_users,
  2 as synthetic_organizations,
  'ROLLBACK_REQUIRED' as persistence;

rollback;
