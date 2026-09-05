import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const migrationRoot = join(root, 'supabase/migrations');
const testPath = join(root, 'supabase/tests/lot2_rls.sql');
const violations = [];

const migrationFiles = readdirSync(migrationRoot)
  .filter((file) => file.endsWith('.sql'))
  .sort();
if (migrationFiles.length < 6) violations.push('les migrations du Lot 2 sont incomplètes');
if (migrationFiles.some((file) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(file))) {
  violations.push('nom de migration non déterministe');
}

const migrations = migrationFiles
  .map((file) => readFileSync(join(migrationRoot, file), 'utf8'))
  .join('\n');

for (const forbidden of [
  /service_role/i,
  /insert\s+into\s+auth\.users/i,
  /\bLomme\b/i,
  /fuemwzrvmputgbaaondp/i,
  /create\s+table\s+(?:\w+\.)?(?:contributions|profiles)\b/i,
]) {
  if (forbidden.test(migrations))
    violations.push(`motif interdit dans les migrations : ${forbidden}`);
}

for (const table of [
  'core.organizations',
  'core.territories',
  'core.memberships',
  'core.membership_roles',
  'core.membership_territory_scopes',
  'reference.roles',
  'reference.permissions',
  'reference.role_permissions',
  'audit.events',
]) {
  const escaped = table.replace('.', '\\.');
  if (!new RegExp(`alter table ${escaped} enable row level security`, 'i').test(migrations)) {
    violations.push(`RLS absente pour ${table}`);
  }
}

for (const table of ['roles', 'permissions', 'role_permissions']) {
  if (new RegExp(`create policy[^;]+on reference\\.${table}`, 'i').test(migrations)) {
    violations.push(`politique client prématurée sur reference.${table}`);
  }
}

if (!/alter role authenticator set pgrst\.db_schemas = 'api'/i.test(migrations)) {
  violations.push('la Data API n’est pas limitée au schéma api');
}
if (/select\s+\*/i.test(migrations)) violations.push('SELECT * interdit dans une projection SQL');
if (!/p\.permission_key = p_permission_key/i.test(migrations)) {
  violations.push('la clé de permission demandée n’est pas vérifiée');
}

if (!existsSync(testPath)) {
  violations.push('suite RLS transactionnelle absente');
} else {
  const test = readFileSync(testPath, 'utf8');
  for (const marker of [
    'set local role anon',
    'membership inactif',
    'double appartenance',
    'rôle inter-tenant',
    'DPO A',
    'rollback;',
  ]) {
    if (!test.toLocaleLowerCase('fr').includes(marker.toLocaleLowerCase('fr'))) {
      violations.push(`cas RLS absent : ${marker}`);
    }
  }
}

if (violations.length) {
  console.error(`Contrôle des contrats de données en échec (${violations.length}) :`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `Contrôle des contrats de données réussi : ${migrationFiles.length} migrations et matrice RLS présentes.`,
);
