# Shaper Agent Skills

This repository contains agent skills designed to enable AI assistants (such as Claude, Codex, Gemini, etc.) to set up environment configurations and develop interactive dashboards with [Shaper](https://taleshape.com).

Shaper is a dashboarding tool where dashboards are defined as SQL files and run on DuckDB SQL, casting columns to custom types (`::TYPE`) to construct UI elements.

## Available Skills

This repository organizes the development workflow into two skills:

1. **[shaper-dashboard-development](file:///home/jorin/projects/taleshape/shaper-skills/shaper-dashboard-development/SKILL.md) (Main skill)**: Guides the agent through exploring schemas and existing dashboards, authoring files named `<Dashboard Name>.dashboard.sql` organized by folders, automatically generating IDs via the CLI, validating SQL queries, previewing dashboards in the browser, and following Git-based CI/CD deployment rules.
2. **[shaper-setup](file:///home/jorin/projects/taleshape/shaper-skills/shaper-setup/SKILL.md) (Sub-skill)**: Ensures the environment is compatible (macOS or Linux), verifies the Shaper CLI is installed, configures `shaper.json` with instance URL and local directory settings, safely pulls dashboards, handles browser authentication, and configures `.gitignore` to prevent authentication tokens from being committed.

---

## Available Commands Reference

AI agents and developers can utilize the following Shaper CLI commands within the workspace:

| Command | Description |
| :--- | :--- |
| `shaper --version` | Checks if the Shaper CLI is installed and gets its version. |
| `shaper pull --yes` | Pulls existing dashboards and tasks from the production system into the local directory. |
| `shaper schema` | Prints the current database schema to explore available tables and columns. |
| `shaper ids` | Scans all dashboard SQL files and injects unique `-- shaperid:<UUID>` header comments. |
| `shaper validate <path/to/file.dashboard.sql>` | Executes the dashboard SQL locally to check for errors. |
| `shaper preview <path/to/file.dashboard.sql>` | Compiles the dashboard and automatically opens a live preview in the browser. |

*Note: All commands accept a `--config-file <PATH>` flag to override the default `./shaper.json` location.*

