---
name: shaper-task-development
description: Create, schedule, update, and manage startup and background tasks using DuckDB SQL.
---

# Shaper Task Development Skill

Use this skill to design, implement, schedule, and maintain Shaper tasks. Unlike dashboards which are restricted to read-only SQL queries, tasks allow you to execute write operations and run SQL scripts automatically on a schedule or on system startup.

---

## Workflow

### 1. Prerequisite Check
- Ensure that the environment setup sub-skill (`shaper-setup`) has been successfully run, the configuration file `shaper.json` exists, and a valid `.shaper-auth` file is present.
- **Instance URL Overwriting**: All Shaper CLI commands accept an optional `--url <URL>` flag to overwrite the instance URL defined in `shaper.json`. If the user specifies that they want to overwrite or target a specific Shaper instance URL, adapt all commands below by passing `--url <URL>`.

### 2. Schema Exploration
- Before writing or updating a task, run the schema discovery command to understand the available tables, columns, and database objects:
  ```bash
  shaper schema
  # Or, if overwriting the instance URL:
  shaper schema --url <URL>
  # Or, if using a custom config file:
  shaper schema --config-file <PATH_TO_CONFIG>
  ```

### 3. Task File Creation & Naming
- **File Naming**: Task files must end with the suffix `.task.sql` (e.g., `sync_orders.task.sql`).
- **File Location**: Organize tasks within sub-folders. The folder hierarchy is preserved when synced to Shaper.
- **ID Generation (Mandatory)**: Immediately after creating the task file, run:
  ```bash
  shaper ids
  # Or, if overwriting the instance URL:
  shaper ids --url <URL>
  # Or, if using a custom config:
  shaper ids --config-file <PATH_TO_CONFIG>
  ```
  This command automatically inserts/updates a header comment in the format `-- shaperid:<UUID>` at the top of the file. **Do not write, edit, or copy this comment manually.**

### 4. Previews & Validation
> [!WARNING]
> Because tasks can perform modifications and write operations to the database, they cannot be previewed or validated via the CLI. The `shaper preview` and `shaper validate` commands **cannot** be used for tasks.

### 5. Verification & Testing
- To ensure task correctness before deploying:
  1. Review the SQL query structure and commands carefully.
  2. Ask the user to run the task manually via the Shaper UI using the **"Run"** button to check for execution errors.
  3. Commit and push the task file to Git to deploy it through the CI/CD pipeline.

---

## Task Types and Execution Modes

### Init Tasks (Startup Tasks)
Init tasks run automatically on system startup to configure the database environment, load extensions, attach databases, and build initial views.

#### Syntax
To make a task run on startup, the first statement must cast the string `'init'` to the `SCHEDULE` type:
```sql
SELECT 'init'::SCHEDULE;
```

#### Initialization Rules
- **Execution Order**: Multiple init-tasks run in alphabetical order. Top-level tasks run before tasks inside sub-folders.

---

### Scheduled Tasks (Background Cron Jobs)
Scheduled tasks run automatically in the background at specified intervals or timestamps.

#### Syntax
The first SQL statement of the task must define the schedule by returning a single value of the type `SCHEDULE` (cast from an `INTERVAL` or `TIMESTAMP`).

#### Examples
- **Every 5 minutes**:
  ```sql
  SELECT INTERVAL '5 minutes'::SCHEDULE;
  ```
- **Every day at 1:00 AM**:
  ```sql
  SELECT today() + INTERVAL '25h'::SCHEDULE;
  ```
- **Every week on Monday at 1:00 AM**:
  ```sql
  SELECT date_trunc('week', now()) + INTERVAL '7days 1h'::SCHEDULE;
  ```

### Non-Scheduled / Manual Tasks
- Skip the `::SCHEDULE` statement at the top. The task will only execute when triggered manually via the "Run" button in the Shaper UI.

---

## Common Use Cases & SQL Examples

### 1. Database Attachments (Postgres & DuckLake)
Use init tasks to attach external databases.
> [!IMPORTANT]
> To attach to a database, you must direct the user to first create a persistent secret manually by running `CREATE PERSISTENT SECRET` in the Shaper UI. Do not store sensitive database credentials directly in the `.task.sql` file.

#### Postgres Attachment Example
1. Ask the user to run the secret creation command in the UI:
   ```sql
   CREATE PERSISTENT SECRET pg_secret (
     TYPE POSTGRES,
     HOST 'localhost',
     PORT 5432,
     DATABASE 'my_postgres_db',
     USER 'postgres',
     PASSWORD 'my_secure_password'
   );
   ```
2. Write the initialization task file (e.g., `init_postgres.task.sql`):
   ```sql
   SELECT 'init'::SCHEDULE;

   -- Attach using the preconfigured secret
   ATTACH '' AS my_postgres (TYPE POSTGRES, SECRET pg_secret);
   ```

#### DuckLake Attachment Example
1. Ask the user to run the secret creation command in the UI:
   ```sql
   CREATE PERSISTENT SECRET dl_secret (
     TYPE DUCKLAKE,
     METADATA_PATH 'ducklake:postgres:dbname=my_lake_db host=127.0.0.1 user=postgres password=my_secure_password'
   );
   ```
2. Write the initialization task file (e.g., `init_ducklake.task.sql`):
   ```sql
   SELECT 'init'::SCHEDULE;

   -- Attach using the preconfigured secret
   ATTACH 'ducklake:dl_secret' AS my_ducklake;
   ```

---

### 2. Extension Installations
Use init tasks to install and load DuckDB extensions, including community-maintained extensions like `http_client`.

```sql
SELECT 'init'::SCHEDULE;

-- Install and load the HTTP client community extension
INSTALL http_client FROM community;
LOAD http_client;
```

---

### 3. Reusable Views with Comments
Use init tasks to create database views and add explanatory metadata comments for documentation and schema auto-discovery.

```sql
SELECT 'init'::SCHEDULE;

-- Create the view
CREATE OR REPLACE VIEW active_users AS
SELECT
  user_id,
  email,
  last_login
FROM my_postgres.users
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON VIEW active_users IS 'List of active users synchronized from Postgres';
COMMENT ON COLUMN active_users.user_id IS 'Primary key of the user';
COMMENT ON COLUMN active_users.email IS 'User primary email address';
```

---

### 4. Data Loading, Transformation, and Cleanup
Use scheduled tasks to load, transform, and clean up datasets.
> [!TIP]
> Avoid storing data in Shaper's internal DuckDB. Store and transform data directly in external storage systems, such as **DuckLake**.

```sql
SELECT INTERVAL '1 hour'::SCHEDULE;

-- Perform transformations on external system
INSERT INTO my_ducklake.sales_summaries
SELECT
  date_trunc('day', order_date) AS sales_date,
  sum(amount) AS daily_amount
FROM my_postgres.orders
WHERE order_date >= today() - INTERVAL '1 day'
GROUP BY sales_date;
```

---

### 5. Task Automation (Egress and Webhooks)
Use scheduled tasks to export files to S3, synchronize data to transactional databases, or call external API endpoints using the `http_client` extension.

```sql
-- Run every Monday at 1:00 AM
SELECT date_trunc('week', now()) + INTERVAL '7days 1h'::SCHEDULE;

-- 1. Automate backing up a table to S3
COPY (SELECT * FROM active_users) TO 's3://my-backups/users/active_users.csv' (FORMAT CSV, HEADER);

-- 2. Call external webhook notifying completion
SELECT http_post('https://api.example.com/v1/webhooks/sync-done', '{"event": "weekly_sync_completed"}');
```
