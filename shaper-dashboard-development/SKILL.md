---
name: shaper-dashboard-development
description: Build, validate, preview, and organize Shaper dashboards using DuckDB SQL and Shaper-specific types.
---

# Shaper Dashboard Development Skill

Use this skill to design, implement, validate, and preview Shaper dashboards. Shaper dashboards are defined as SQL files and run on DuckDB SQL, using custom type casting (`::TYPE`) to construct interactive UI elements.

## Workflow

### 1. Prerequisite Check
- Ensure that the environment setup sub-skill (`shaper-setup`) has been successfully run, the configuration file `shaper.json` exists, and a valid `.shaper-auth` file is present.

### 2. Context Gathering
- **Schema Discovery**: Run the command `shaper schema` (or `shaper schema --config-file ...`) to inspect the database schema, tables, and column structures available to query.
- **Style Alignment**: Search the workspace for any existing `*.dashboard.sql` files. Inspect them to understand existing dashboard patterns, styles, common metrics, and tables.

### 3. Creating a Dashboard
- **File Naming**: Create a file named `<Dashboard Name>.dashboard.sql` (e.g., `Active Users.dashboard.sql`).
- **File Organization**: Dashboard files can be organized into sub-folders. The folder hierarchy is preserved when synced to the production system.
- **ID Generation (Mandatory)**: Immediately after creating the dashboard file (even if it is empty or has a simple skeleton), run:
  ```bash
  shaper ids
  # Or, if using a custom config:
  shaper ids --config-file <PATH_TO_CONFIG>
  ```
  This command inserts/updates a header comment in the format `-- shaperid:<UUID>` at the top of the file. **Do not write, edit, or copy this comment manually.**

### 4. Validation
- **Action**: Before presenting a dashboard to the user, run the validation tool to check for SQL or execution errors:
  ```bash
  shaper validate path/to/Dashboard.dashboard.sql
  # Or, if using a custom config:
  shaper validate path/to/Dashboard.dashboard.sql --config-file <PATH_TO_CONFIG>
  ```

### 5. Previewing
- **Action**: Once the dashboard is valid, preview it locally. This command automatically opens the preview in the browser:
  ```bash
  shaper preview path/to/Dashboard.dashboard.sql
  # Or, if using a custom config:
  shaper preview path/to/Dashboard.dashboard.sql --config-file <PATH_TO_CONFIG>
  ```

### 6. Git Hygiene & Deployment
- **Deployment constraint**: **Never deploy dashboards directly.** Dashboards are synchronized through the CI/CD pipeline.
- **Action**: Once the changes are verified and previewed, commit the `*.dashboard.sql` files to git so they can be reviewed and deployed automatically.

---

## SQL & Dashboard Reference

Each dashboard is a collection of SQL queries separated by `;`. All queries are executed using **DuckDB SQL**.

### Custom Types & Visualizations

Cast SQL expression output to custom Shaper types using `::TYPE` (e.g., `SELECT 'Total Sales'::LABEL;`).

#### 1. Tables (Default)
Any query returning multiple rows and columns is rendered as a table. Column headers map to column aliases.
- **`PERCENT`**: Renders a float/double between 0 and 1 as a percentage (e.g. `col::PERCENT`).
- **`TREND`**: Shows a trend arrow up/down.
  ```sql
  -- Example Table with Trend
  SELECT
    date::DATE AS "Date",
    value AS "Value",
    (value::DOUBLE / lag(value) OVER (ORDER BY date))::TREND AS "Trend"
  FROM sales;
  ```

#### 2. Single Value Card
If a query returns exactly 1 row and 1 column, it is rendered as a single large metric card.
- **`PERCENT`**: Formats the value as a percentage.
- **`COMPARE`**: Renders a comparison subtitle below the value.
- **`TEXT_SMALL` / `TEXT_MEDIUM` / `TEXT_LARGE`**: Manually overrides auto-scaling font size.
  ```sql
  -- Example Single Value Card
  SELECT 14500 AS "Active Users";
  SELECT 0.12::PERCENT AS "Conversion Rate", 0.08::COMPARE AS "vs Last Month";
  ```

#### 3. Bar Chart
Renders vertical or horizontal bars. Can be grouped or stacked.
- **`XAXIS` / `YAXIS`**: X-axis for vertical charts, Y-axis for horizontal charts (dimensions).
- **`BARCHART`**: The numeric value defining the length of the bar.
- **`CATEGORY`**: Groups data into categories, showing a legend.
- **`BARCHART_STACKED`**: Stacks categories on top of each other.
- **`BARCHART_PERCENT` / `BARCHART_STACKED_PERCENT`**: Bounds the chart axis to 100% (values should be 0 to 1).
- **`COLOR`**: Text/hex code to set bar color.
  ```sql
  -- Vertical Grouped Bar Chart
  SELECT month::XAXIS, count::BARCHART, category::CATEGORY
  FROM monthly_stats;
  ```

#### 4. Line Chart
Identical to Bar Charts but represents trends over time. Does not support horizontal `YAXIS` or stacked forms.
- **`XAXIS`**: Dimension/time column.
- **`LINECHART` / `LINECHART_PERCENT`**: The numeric/percentage value column.
- **`CATEGORY`**: Renders multiple lines.
- **`COLOR`**: Category line colors.
  ```sql
  -- Line Chart with categories
  SELECT date::XAXIS, active_users::LINECHART, tier::CATEGORY, color::COLOR
  FROM active_tiers;
  ```

#### 5. Box Plots
Visualizes distribution of a dataset. Calculated via the `BOXPLOT()` aggregate function.
- **`BOXPLOT(val)`**: Renders boxes (min, max, median, Q1, Q3).
- **Outliers**: Pass `outlier_info := MAP {'label': col}` to show outlier points on hover.
  ```sql
  -- Box plot grouping values by region
  SELECT region::XAXIS, BOXPLOT(revenue, outlier_info := MAP {'Client': client_name})
  FROM regional_data
  GROUP BY region;
  ```

#### 6. Annotations
Draw mark lines on Bar/Line charts. Place annotation queries *before* the main chart query.
- **`XLINE`**: Vertical line on the X-axis.
- **`YLINE`**: Horizontal line on the Y-axis.
- **`LABEL`**: Label displaying next to the line.
  ```sql
  SELECT '2026-11-27'::TIMESTAMP::XLINE, 'Black Friday'::LABEL;
  SELECT date::XAXIS, sales::LINECHART FROM daily_sales;
  ```

#### 7. Gauge
Shows progress towards a goal or value distribution across segments.
- **`GAUGE` / `GAUGE_PERCENT`**: Renders progress.
- **`RANGE`**: Custom range intervals, e.g. `[0, 50, 100]::RANGE`.
- **`COLORS`**: Colors for range segments. Must contain **one less** element than `RANGE`.
- **`LABELS`**: Labels for range segments. Must contain **one less** element than `RANGE`.
  ```sql
  -- Colored Gauge
  SELECT
    78::GAUGE,
    [0, 50, 80, 100]::RANGE,
    ['#ee5674', '#ffd26a', '#6cbc87']::COLORS,
    ['Poor', 'Fair', 'Excellent']::LABELS;
  ```

#### 8. Pie Chart & Donut Chart
Shows category distributions. Donut charts display the total aggregate sum in the center.
- **`PIECHART` / `DONUTCHART`**: Value column.
- **`PIECHART_PERCENT` / `DONUTCHART_PERCENT`**: Percentage columns.
- **`CATEGORY`**: Category names. Categories `< 5%` are automatically grouped under "Other".
- **`COLOR`**: Slice colors.
  ```sql
  SELECT tier::CATEGORY, users::DONUTCHART, '#FF9933'::COLOR FROM user_tiers;
  ```

### Interactive Filtering

Filters define variables that can be accessed in subsequent queries using `getvariable('variable_name')` (returned as matching DuckDB types).

- **`DATEPICKER`**: Single date selector. Returns `DATE`.
  ```sql
  SELECT today()::DATEPICKER AS my_date;
  -- Usage: WHERE date = getvariable('my_date')
  ```
- **`DATEPICKER_FROM` & `DATEPICKER_TO`**: Date range selector.
  ```sql
  SELECT (today() - 7)::DATEPICKER_FROM AS "from", today()::DATEPICKER_TO AS "to";
  -- Usage: WHERE date BETWEEN getvariable('from') AND getvariable('to')
  ```
- **`DROPDOWN`**: Drop-down menu. Returns `VARCHAR`. Use `UNION ALL` to define a default value.
  ```sql
  SELECT 'All Categories'::DROPDOWN AS selected_cat
  UNION ALL
  (SELECT category FROM items GROUP BY category ORDER BY category);
  ```
- **`DROPDOWN_MULTI`**: Multi-select dropdown. Returns a list/array of `VARCHAR` elements.
  - Optional **`HINT`**: Displays additional text alongside options (e.g. item count).
  ```sql
  SELECT category::DROPDOWN_MULTI AS selected_cats, count(*)::HINT FROM items GROUP BY category;
  -- Usage: WHERE category IN getvariable('selected_cats')
  ```
- **`INPUT`**: Text input field. Returns `VARCHAR` (or `NULL` if empty).
  ```sql
  SELECT 'Search items...'::INPUT AS search_term;
  -- Usage: WHERE name LIKE '%' || getvariable('search_term') || '%'
  ```

### Downloads

Render download buttons to trigger data extraction.
- **`DOWNLOAD_CSV` / `DOWNLOAD_XLSX`**: Creates a button. The following query defines the downloaded data.
  ```sql
  SELECT 'Export Sales'::DOWNLOAD_CSV;
  SELECT * FROM daily_sales;
  ```
- **`DOWNLOAD_PDF`**: Triggers a PDF layout download of the dashboard (or another dashboard using `ID`).
  ```sql
  SELECT 'Download Report'::DOWNLOAD_PDF, '<TARGET_DASHBOARD_UUID>'::ID AS my_pdf;
  ```

### Layout & Utility Commands

- **`SECTION`**: Groups subsequent cards/tables. Use `SELECT 'Section Title'::SECTION;`. If the query returns no rows (e.g., `WHERE FALSE`), the entire section and its queries are hidden.
- **`LABEL`**: Sets a card or filter's header text when queried right before the target card.
- **`PLACEHOLDER`**: Injects blank spaces into the layout grid: `SELECT ''::PLACEHOLDER;`.
- **`HEADER_IMAGE`**: Sets dashboard logo (URL or base64 URL): `SELECT 'logo_url'::HEADER_IMAGE;`.
- **`FOOTER_LINK`**: Displays a footer link on screens and PDFs: `SELECT 'link_url'::FOOTER_LINK;`.
- **`RELOAD`**: Sets auto-reload interval: `SELECT (INTERVAL '5 minutes')::RELOAD;`.

### Non-SELECT Statements (Metadata & Exploration)

- **`DESCRIBE <table>`**: Returns a table's schema (columns, types, nullability).
- **`SUMMARIZE <table>`**: Returns detailed statistics (mean, stddev, range) for all columns.
- **`SHOW TABLES` / `SHOW ALL TABLES`**: List available tables.
- **`CREATE TEMPORARY TABLE <name> AS (<query>)`**: Caches intermediate results in memory.
- **`CREATE TEMPORARY VIEW <name> AS (<query>)`**: Creates a reusable view logic.
- **`SET VARIABLE <name> = (<query>)`**: Updates variable value for subsequent queries.
- **`USE <database>[.<schema>]`**: Switches context so you can query without prefixing table names.
