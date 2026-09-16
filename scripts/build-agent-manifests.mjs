// Generates public/.well-known/agent-skills/index.json from the SKILL.md files
// under public/.well-known/agent-skills/<name>/SKILL.md.
//
// Runs as an npm `prebuild` step (see package.json) so it executes before every
// `astro build`, including on Cloudflare Pages. The Agent Skills Discovery RFC
// (v0.2.0) requires a SHA-256 digest of each skill artifact in the index --
// hand-typing that digest would silently go stale the moment a SKILL.md is
// edited, breaking integrity verification for every agent that checks it. This
// script always derives it fresh from the file on disk.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '..', 'public', '.well-known', 'agent-skills');
const outFile = join(skillsDir, 'index.json');
const SCHEMA_URI = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const PUBLIC_URL_BASE = '/.well-known/agent-skills';
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function parseFrontmatter(content, skillName) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${skillName}: SKILL.md has no YAML frontmatter`);
  const nameMatch = match[1].match(/^name:\s*(.+)$/m);
  const descMatch = match[1].match(/^description:\s*(.+)$/m);
  if (!descMatch) throw new Error(`${skillName}: SKILL.md frontmatter has no description field`);
  return {
    frontmatterName: nameMatch ? nameMatch[1].trim() : null,
    description: descMatch[1].trim(),
  };
}

const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const skills = skillDirs.map((name) => {
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`Invalid skill name "${name}": must be lowercase alphanumeric and hyphens, no leading/trailing/double hyphens`);
  }
  const skillPath = join(skillsDir, name, 'SKILL.md');
  if (!existsSync(skillPath)) throw new Error(`${name}: missing SKILL.md at ${skillPath}`);

  const raw = readFileSync(skillPath); // Buffer -- digest the raw bytes on disk
  const { frontmatterName, description } = parseFrontmatter(raw.toString('utf8'), name);

  if (frontmatterName && frontmatterName !== name) {
    throw new Error(`${name}: directory name does not match frontmatter name "${frontmatterName}"`);
  }
  if (description.length > 1024) {
    throw new Error(`${name}: description exceeds 1024 characters (Agent Skills spec limit)`);
  }

  const digest = 'sha256:' + createHash('sha256').update(raw).digest('hex');

  return {
    name,
    type: 'skill-md',
    description,
    url: `${PUBLIC_URL_BASE}/${name}/SKILL.md`,
    digest,
  };
});

const index = { $schema: SCHEMA_URI, skills };
writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n');

console.log(`[build-agent-manifests] wrote ${outFile} with ${skills.length} skill(s):`);
for (const s of skills) console.log(`  - ${s.name} -> ${s.digest}`);
