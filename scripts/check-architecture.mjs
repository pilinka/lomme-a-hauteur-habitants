import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const productionRoots = ['apps', 'packages'];
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);
const violations = [];

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const relativePath = relative(repositoryRoot, absolutePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (entry !== 'dist' && entry !== 'node_modules') visit(absolutePath);
      continue;
    }

    if (!sourceExtensions.has(extname(entry)) || /\.(test|spec)\.[^.]+$/.test(entry)) continue;
    const content = readFileSync(absolutePath, 'utf8');

    if (/@supabase\//.test(content))
      violations.push(`${relativePath}: dépendance Supabase interdite au Lot 1`);
    if (/fuemwzrvmputgbaaondp/.test(content))
      violations.push(`${relativePath}: référence au projet V3`);
    if (/tests\/fixtures|tests\\fixtures/.test(content))
      violations.push(`${relativePath}: fixture importée en production`);
    if (relativePath.startsWith('apps/public-web/') && /professional-console/.test(content)) {
      violations.push(`${relativePath}: import ou référence croisée vers la console`);
    }
    if (relativePath.startsWith('apps/professional-console/') && /public-web/.test(content)) {
      violations.push(`${relativePath}: import ou référence croisée vers l’application publique`);
    }
    if (relativePath.startsWith('apps/public-web/') && /professional-console/.test(content)) {
      violations.push(`${relativePath}: import de la console depuis l’application publique`);
    }
    if (relativePath.startsWith('apps/professional-console/') && /public-web/.test(content)) {
      violations.push(`${relativePath}: import de l’application publique depuis la console`);
    }
    if (relativePath.startsWith('packages/domain/') && /\breact(?:-dom)?\b/.test(content)) {
      violations.push(`${relativePath}: React interdit dans le domaine pur`);
    }
    if (relativePath.startsWith('packages/') && /\bLomme\b/i.test(content)) {
      violations.push(`${relativePath}: territoire particulier dans un package partagé`);
    }
  }
}

function inspectTests(directory) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      if (entry === 'dist' || entry === 'node_modules') continue;
      inspectTests(absolutePath);
      continue;
    }
    if (!sourceExtensions.has(extname(entry))) continue;
    const content = readFileSync(absolutePath, 'utf8');
    if (/\b(?:describe|it|test)\.(?:only|skip)\s*\(/.test(content)) {
      violations.push(`${relative(repositoryRoot, absolutePath)}: test .only/.skip interdit`);
    }
  }
}

for (const root of productionRoots) visit(join(repositoryRoot, root));
for (const root of ['apps', 'packages', 'tests']) inspectTests(join(repositoryRoot, root));

for (const manifest of [
  'package.json',
  'apps/public-web/package.json',
  'apps/professional-console/package.json',
  'packages/domain/package.json',
  'packages/ui/package.json',
]) {
  const content = readFileSync(join(repositoryRoot, manifest), 'utf8');
  if (/supabase|VITE_SUPABASE|service_role/i.test(content)) {
    violations.push(`${manifest}: dépendance ou configuration Supabase interdite au Lot 1`);
  }
}

for (const buildDirectory of ['apps/public-web/dist', 'apps/professional-console/dist']) {
  if (!existsSync(join(repositoryRoot, buildDirectory))) continue;
  visit(join(repositoryRoot, buildDirectory));
}

for (const forbiddenPath of [
  'supabase',
  'migrations',
  'packages/database-types',
  'packages/tenant-config',
  'packages/application',
  'packages/data-access',
]) {
  if (existsSync(join(repositoryRoot, forbiddenPath))) {
    violations.push(`${forbiddenPath}: couche anticipée avant le Lot 2`);
  }
}

if (violations.length) {
  console.error(`Contrôle d’architecture en échec (${violations.length}) :`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Contrôle d’architecture réussi : frontières du Lot 1 respectées.');
