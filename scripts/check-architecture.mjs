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

    if (/@supabase\//.test(content) && !relativePath.startsWith('packages/data-access/')) {
      violations.push(`${relativePath}: client Supabase autorisé uniquement dans data-access`);
    }
    if (/(?:https?:\/\/[^\s"']+\.supabase\.(?:co|in)|VITE_SUPABASE_)/i.test(content)) {
      violations.push(`${relativePath}: configuration Supabase codée dans le runtime`);
    }
    if (/service_role/i.test(content))
      violations.push(`${relativePath}: service_role interdite dans le runtime`);
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
    if (
      relativePath.startsWith('packages/application/') &&
      /@ahh\/(?:data-access|database-types)|@supabase\//.test(content)
    ) {
      violations.push(`${relativePath}: le cas d’usage dépend d’un transport ou de la base`);
    }
    if (relativePath.startsWith('packages/data-access/') && /@ahh\/(?:ui)|apps\//.test(content)) {
      violations.push(`${relativePath}: data-access dépend de la présentation`);
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
  'packages/application/package.json',
  'packages/data-access/package.json',
  'packages/database-types/package.json',
]) {
  const content = readFileSync(join(repositoryRoot, manifest), 'utf8');
  if (/VITE_SUPABASE|service_role/i.test(content)) {
    violations.push(`${manifest}: secret ou configuration d’environnement interdite`);
  }
}

for (const buildDirectory of ['apps/public-web/dist', 'apps/professional-console/dist']) {
  if (!existsSync(join(repositoryRoot, buildDirectory))) continue;
  visit(join(repositoryRoot, buildDirectory));
}

for (const requiredPath of [
  'supabase',
  'packages/database-types',
  'packages/application',
  'packages/data-access',
]) {
  if (!existsSync(join(repositoryRoot, requiredPath))) {
    violations.push(`${requiredPath}: fondation attendue du Lot 2 absente`);
  }
}

if (violations.length) {
  console.error(`Contrôle d’architecture en échec (${violations.length}) :`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Contrôle d’architecture réussi : frontières du Lot 2 respectées.');
