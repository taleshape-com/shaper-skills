# Shaper Agent Skills

This repository contains agent skills designed to enable AI assistants (such as Claude, Codex, Gemini, etc.) to set up environment configurations and develop interactive dashboards with [Shaper](https://taleshape.com).

Shaper is a dashboarding tool where dashboards are defined as SQL files and run on DuckDB SQL, casting columns to custom types (`::TYPE`) to construct UI elements.

## Install

Simply copy the skills into your repository at the following location depending on your agent:

| Agent       | Location          |
-----------------------------------
| Claude Code | `.claude/skills/` |
| Cursor      | `.agents/skills/` |
| Codex CLI   | `.agents/skills/` |
| Gemini CLI  | `.agents/skills/` |
| Antigravity | `.agents/skills/` |
| Open Code   | `.agents/skills/` |
| Qwen Code   | `.qwen/skills/`   |


## Available Skills

This repository organizes the development workflow into three skills:

1. **[shaper-dashboard-development](/shaper-dashboard-development/SKILL.md) (Main skill)**: Guides the agent through exploring schemas and existing dashboards, authoring files named `<Dashboard Name>.dashboard.sql` organized by folders, automatically generating IDs via the CLI, validating SQL queries, previewing dashboards in the browser, and following Git-based CI/CD deployment rules.
2. **[shaper-setup](/shaper-setup/SKILL.md) (Sub-skill)**: Ensures the environment is compatible (macOS or Linux), verifies the Shaper CLI is installed, configures `shaper.json` with instance URL and local directory settings, safely pulls dashboards, handles browser authentication, and configures `.gitignore` to prevent authentication tokens from being committed.
3. **[shaper-task-development](/shaper-task-development/SKILL.md) (Sub-skill)**: Guides the agent through creating and managing startup (`init`) and scheduled tasks (`*.task.sql`), installing community extensions (e.g. `http_client`), attaching to external databases (Postgres and DuckLake) via persistent secrets, creating commented views, and validating tasks manually via the Shaper UI.

---

## Available Commands Reference

AI agents and developers can utilize the following Shaper CLI commands within the workspace:

| Command | Description |
| :--- | :--- |
| `shaper --version` | Checks if the Shaper CLI is installed and gets its version. |
| `shaper pull --yes` | Pulls existing dashboards and tasks from the production system into the local directory. |
| `shaper schema` | Prints the current database schema to explore available tables and columns. |
| `shaper ids` | Scans all dashboard and task SQL files and injects unique `-- shaperid:<UUID>` header comments. |
| `shaper validate <path/to/file.dashboard.sql>` | Executes the dashboard SQL locally to check for errors. *(Note: Not supported for task files)* |
| `shaper preview <path/to/file.dashboard.sql>` | Compiles the dashboard and automatically opens a live preview in the browser. *(Note: Not supported for task files)* |

*Note: All commands accept a `--config-file <PATH>` flag to override the default `./shaper.json` location.*

