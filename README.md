# Shaper Agent Skills

This repository contains agent skills designed to enable AI assistants (such as Claude, Codex, Gemini, etc.) to set up environment configurations and develop interactive dashboards with [Shaper](https://taleshape.com).

Shaper is a dashboarding tool where dashboards are defined as SQL files and run on DuckDB SQL, casting columns to custom types (`::TYPE`) to construct UI elements.

## Install

You can install Shaper skills automatically using the **Claude Code Plugin**, the **`npx skills`** CLI (supporting Cursor, Codex, Gemini, Antigravity, OpenCode, and others), or manually.

### Option 1: Claude Code Plugin (Recommended for Claude Code)

Add this repository as a marketplace and install the full plugin suite or only the specific skill you need:

#### Inside a Claude Code session:
```text
# 1. Register the marketplace (run once)
/plugin marketplace add taleshape-com/shaper-skills

# 2. Install all skills:
/plugin install shaper@shaper-skills

# OR install only a single skill:
/plugin install shaper-dashboard-development@shaper-skills
/plugin install shaper-setup@shaper-skills
/plugin install shaper-task-development@shaper-skills
```

#### From your terminal:
```sh
claude plugin marketplace add taleshape-com/shaper-skills

# Install all skills:
claude plugin install shaper@shaper-skills

# OR install only a single skill:
claude plugin install shaper-dashboard-development@shaper-skills
```

#### Team / Repository configuration:
To automatically enable skills for everyone working in a repository, configure `.claude/settings.json`.

**To install only one specific skill (e.g. dashboard development):**
```json
{
  "extraKnownMarketplaces": {
    "shaper-skills": {
      "source": {
        "source": "github",
        "repo": "taleshape-com/shaper-skills"
      }
    }
  },
  "enabledPlugins": {
    "shaper-dashboard-development@shaper-skills": true
  }
}
```

*(To install all three skills instead, set `"shaper@shaper-skills": true` in `enabledPlugins`.)*

---

### Option 2: `npx skills` (Recommended for Other Agents)

Use the open agent skills CLI ([skills.sh](https://skills.sh)) to automatically discover and install Shaper skills into your project or globally across your machine:

```sh
# Install all skills into your project (auto-detects installed agents)
npx skills add taleshape-com/shaper-skills

# OR install only a single skill (e.g. dashboard development)
npx skills add taleshape-com/shaper-skills --skill shaper-dashboard-development

# Install globally across all projects
npx skills add taleshape-com/shaper-skills -g

# Target specific agents (e.g. Cursor, Codex, Claude Code)
npx skills add taleshape-com/shaper-skills -a cursor -a codex
```

Supported agents include **Cursor**, **Codex CLI**, **Gemini CLI**, **Antigravity**, **OpenCode**, **Claude Code**, **Windsurf**, **GitHub Copilot**, and **Qwen Code**.

Alternatively, you can run the direct installer:
```sh
npx github:taleshape-com/shaper-skills
```

---

### Option 3: Manual Installation (Fallback)

If you prefer to install without package managers, copy the skills directly into your repository at the appropriate location for your agent:

```sh
mkdir -p .agents/skills
git clone git@github.com:taleshape-com/shaper-skills.git /tmp/shaper-skills
cp -r /tmp/shaper-skills/shaper-* .agents/skills/
rm -rf /tmp/shaper-skills
```

| Agent       | Target Location   |
|-------------|-------------------|
| Claude Code | `.claude/skills/` |
| Cursor      | `.agents/skills/` |
| Codex CLI   | `.agents/skills/` |
| Gemini CLI  | `.agents/skills/` |
| Antigravity | `.agents/skills/` |
| OpenCode    | `.agents/skills/` |
| Qwen Code   | `.qwen/skills/`   |


## Available Skills

This repository organizes the development workflow into three skills:

1. **[shaper-dashboard-development](/shaper-dashboard-development/SKILL.md) (Main skill)**: Guides the agent through exploring schemas and existing dashboards, authoring files named `<Dashboard Name>.dashboard.sql` organized by folders, automatically generating IDs via the CLI, validating SQL queries, previewing dashboards in the browser, and following Git-based CI/CD deployment rules.
2. **[shaper-setup](/shaper-setup/SKILL.md) (Sub-skill)**: Ensures the environment is compatible (macOS or Linux), verifies the Shaper CLI is installed, configures `shaper.json` with instance URL and local directory settings, authenticates via `shaper login`, safely pulls dashboards, and configures `.gitignore` to prevent authentication tokens from being committed.
3. **[shaper-task-development](/shaper-task-development/SKILL.md) (Sub-skill)**: Guides the agent through creating and managing startup (`init`) and scheduled tasks (`*.task.sql`), installing community extensions (e.g. `http_client`), attaching to external databases (Postgres and DuckLake) via persistent secrets, creating commented views, and validating tasks manually via the Shaper UI.

---

## Available Commands Reference

AI agents and developers can utilize the following Shaper CLI commands within the workspace:

| Command | Description |
| :--- | :--- |
| `shaper --version` | Checks if the Shaper CLI is installed and gets its version. |
| `shaper login` | Prompts the user to open a URL and confirm authentication in the browser. *(Requires user action)* |
| `shaper pull --yes` | Pulls existing dashboards and tasks from the production system into the local directory. |
| `shaper schema` | Prints the current database schema to explore available tables and columns. |
| `shaper ids` | Scans all dashboard and task SQL files and injects unique `-- shaperid:<UUID>` header comments. |
| `shaper validate <path/to/file.dashboard.sql>` | Executes the dashboard SQL locally to check for errors. *(Note: Not supported for task files)* |
| `shaper preview <path/to/file.dashboard.sql>` | Compiles the dashboard and automatically opens a live preview in the browser. *(Note: Not supported for task files)* |

*Note: Shaper CLI commands do not automatically log in the user. Call `shaper login` before calling other CLI commands. If commands fail to authenticate, execute `shaper login` to prompt the user for authentication. All commands accept a `--config-file <PATH>` flag to override the default `./shaper.json` location, as well as a `--url <URL>` flag to overwrite the instance URL defined in the configuration file.*

