import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const fixtureRoot = join(repositoryRoot, 'tests', 'fixtures');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json']);
const findings = [];

function visitFixtures(directory) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      visitFixtures(absolutePath);
      continue;
    }
    if (!sourceExtensions.has(extname(entry))) continue;

    const content = readFileSync(absolutePath, 'utf8');
    const relativePath = relative(repositoryRoot, absolutePath);
    if (!/synthetic-demo/.test(content)) {
      findings.push(`${relativePath}: classification synthetic-demo absente`);
    }
    if (
      /(?:email|e-mail|telephone|phone|adresse|address|latitude|longitude|coordinates|coordonnées)/i.test(
        content,
      )
    ) {
      findings.push(`${relativePath}: champ potentiellement personnel ou géographique`);
    }
  }
}

function inspectBuild(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      inspectBuild(absolutePath);
      continue;
    }
    if (!sourceExtensions.has(extname(entry)) && extname(entry) !== '.css') continue;
    const content = readFileSync(absolutePath, 'utf8');
    if (/synthetic-demo|fixture-(?:contribution|publication)/.test(content)) {
      findings.push(
        `${relative(repositoryRoot, absolutePath)}: fixture de test embarquée dans dist`,
      );
    }
  }
}

if (!existsSync(fixtureRoot)) {
  findings.push('tests/fixtures: dossier attendu absent');
} else {
  visitFixtures(fixtureRoot);
}

inspectBuild(join(repositoryRoot, 'apps', 'public-web', 'dist'));
inspectBuild(join(repositoryRoot, 'apps', 'professional-console', 'dist'));

if (findings.length) {
  console.error(`Contrôle des fixtures en échec (${findings.length}) :`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Fixtures exclusivement synthétiques et absentes des bundles.');
