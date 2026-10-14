#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO = 'taleshape-com/shaper-skills';
const SKILLS = [
  {
    name: 'shaper-dashboard-development',
    description: 'Build, validate, preview, and organize Shaper dashboards using DuckDB SQL'
  },
  {
    name: 'shaper-setup',
    description: 'Ensure Shaper CLI is installed, configure shaper.json, authenticate, and safely pull remote resources'
  },
  {
    name: 'shaper-task-development',
    description: 'Create, schedule, update, and manage startup and background tasks using DuckDB SQL'
  }
];

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  npx shaper-skills [options]
  npx skills add ${REPO} [options]

Install Shaper agent skills for Claude Code, Cursor, Codex, Gemini, Antigravity, OpenCode, and others.

Options:
  -g, --global           Install skills globally across all projects
  -a, --agent <agents>   Specify agent(s) to install to (e.g. cursor, claude-code, codex)
  -s, --skill <skills>   Specify specific skill(s) to install
  -l, --list             List available skills
  -y, --yes              Skip confirmation prompts
  --copy                 Copy files instead of symlinking

Available skills:
${SKILLS.map(s => `  • ${s.name}: ${s.description}`).join('\n')}

Claude Code Plugin:
  Inside Claude Code:  /plugin marketplace add ${REPO}
                       /plugin install shaper@shaper-skills
  From terminal CLI:   claude plugin marketplace add ${REPO}
                       claude plugin install shaper@shaper-skills
`);
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  console.log('Available Shaper Skills:');
  for (const skill of SKILLS) {
    console.log(`  • ${skill.name}`);
    console.log(`    ${skill.description}\n`);
  }
  process.exit(0);
}

// Delegate to the standard open agent skills CLI (skills.sh / vercel-labs/skills)
console.log(`Installing Shaper skills via 'npx skills add ${REPO}'...\n`);
const result = spawnSync('npx', ['skills', 'add', REPO, ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0) {
  // If delegating to remote repository failed (e.g. offline, local development clone), offer local copy fallback
  const localSkillsDir = path.resolve(__dirname, '..');
  const hasLocalSkills = SKILLS.every(s => fs.existsSync(path.join(localSkillsDir, s.name, 'SKILL.md')));

  if (hasLocalSkills) {
    console.log('\nRemote install failed, falling back to local package skills...');
    const fallback = spawnSync('npx', ['skills', 'add', localSkillsDir, ...args], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    process.exit(fallback.status ?? 1);
  }
}

process.exit(result.status ?? 0);
