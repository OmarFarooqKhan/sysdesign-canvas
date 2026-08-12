// Bans the TypeScript `any` type (see CLAUDE.md).
//
// This is a text-based check, not a real parser: typescript-eslint doesn't
// support TypeScript 7 yet (its peer range caps at `<6.1.0`, which this repo's
// "latest packages" rule rules out), and TS 7's own public API dropped the
// classic createSourceFile/forEachChild surface needed to walk a real AST.
// Comments and string/template literals are stripped first so prose like
// "if any" or a URL doesn't trip it up, and `.any(` (e.g. `expect.any(...)`)
// is excluded so the type keyword isn't confused with that identifier.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));
const ANY_PATTERN = /(?<!\.)\bany\b(?!\s*\()/;

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

/** Blank out comments and string/template literals, preserving line breaks and offsets. */
function stripNonCode(text) {
  return text.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (m) => m.replace(/[^\n]/g, ' '),
  );
}

function findAnyLines(file) {
  const text = readFileSync(file, 'utf8');
  const lines = stripNonCode(text).split('\n');
  return lines.flatMap((line, i) => (ANY_PATTERN.test(line) ? [i + 1] : []));
}

const files = walkFiles(SRC_DIR);
let failed = false;
for (const file of files) {
  for (const line of findAnyLines(file)) {
    failed = true;
    console.error(`${file}:${line}: uses the \`any\` type`);
  }
}

if (failed) {
  console.error('\nThe `any` type is banned in this repo (see CLAUDE.md) — use a real type instead.');
  process.exit(1);
}
console.log(`check-no-any: clean (${files.length} files checked).`);
