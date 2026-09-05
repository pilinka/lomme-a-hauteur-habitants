import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const scanHistory = process.argv.includes('--history');
const textExtensions = new Set([
  '',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mjs',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\b/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i,
  /(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*=\s*[^\s"']{8,}/i,
  /VITE_[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*\s*=\s*[^\s"']+/i,
];
const findings = [];

function runGit(args) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function shouldScan(path) {
  return (
    textExtensions.has(extname(path).toLowerCase()) &&
    !path.startsWith('node_modules/') &&
    !path.startsWith('coverage/') &&
    !path.startsWith('coverage-qa/')
  );
}

function inspect(label, content) {
  if (content.length > 2_000_000) return;
  if (patterns.some((pattern) => pattern.test(content))) findings.push(label);
}

const currentPaths = runGit(['ls-files', '--cached', '--others', '--exclude-standard'])
  .split('\n')
  .filter(Boolean);

for (const path of currentPaths) {
  if (!shouldScan(path)) continue;
  try {
    inspect(path, readFileSync(resolve(repositoryRoot, path), 'utf8'));
  } catch {
    // Un fichier transitoire disparu entre l'inventaire et la lecture est ignoré.
  }
}

if (scanHistory) {
  const objects = runGit(['rev-list', '--objects', '--all']).split('\n').filter(Boolean);
  const seen = new Set();
  for (const line of objects) {
    const separator = line.indexOf(' ');
    if (separator < 0) continue;
    const sha = line.slice(0, separator);
    const path = line.slice(separator + 1);
    if (!path || seen.has(sha) || !shouldScan(path)) continue;
    seen.add(sha);
    try {
      inspect(`historique:${path}@${sha.slice(0, 12)}`, runGit(['cat-file', '-p', sha]));
    } catch {
      // Les objets non blobs et illisibles ne sont pas des sources textuelles à contrôler.
    }
  }
}

if (findings.length) {
  console.error('Secrets potentiels détectés. Les valeurs ne sont volontairement pas affichées :');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

if (scanHistory) {
  const commitCount = runGit(['rev-list', '--count', '--all']).trim();
  const shallow = runGit(['rev-parse', '--is-shallow-repository']).trim() === 'true';
  console.log(
    `Aucun secret détecté dans l’arbre courant et l’historique Git disponible (${commitCount} commit${commitCount === '1' ? '' : 's'}${shallow ? ', clone local superficiel' : ''}).`,
  );
} else {
  console.log('Aucun secret détecté dans l’arbre courant.');
}
