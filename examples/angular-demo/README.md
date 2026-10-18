# Angular live portfolio demo

The portfolio catalog and initial positions are simulated data. Prices, average
costs, and previous closes are in EUR; no market feed or FX conversion is used.
For bonds, quantity counts EUR 100 nominal lots and price is EUR per lot.

Calculations in `src/app/portfolio/portfolio-calculations.ts` use:

- Value = Quantity × Price
- P/L = Quantity × (Price − Average Cost)
- Change % = (Price − Previous Close) / Previous Close × 100
- Portfolio Value = sum of position Values
- Portfolio Cost = sum of Quantity × Average Cost
- Portfolio P/L = Portfolio Value − Portfolio Cost
- Overall Return % = Portfolio P/L / Portfolio Cost × 100 (zero when cost is zero)

Invalid numeric inputs throw `RangeError`. Change % is `null` when Previous Close
is zero. Calculations do not round; the UI formats EUR and percentages.

## Holdings and editing

`INITIAL_POSITIONS` contains exactly 14 fixed positions. Instrument and Quantity
are the only editable columns; all other columns are for consultation. The UI
has no Add, Delete, Save, Reload, Payload or Rollback controls, though AMB Grid
continues its internal CRUD tracking for user edits. The 50-instrument simulated
catalog is searched by ticker, name, category and optional ISIN through
`AMB.lookup()`, `AMB.multifieldLookup()` and `AMB.LookupDialog`.

Instrument completes name prefixes inline; Tab accepts the suggested name.
F2 opens the Lookup Dialog for the full search, including ticker and ISIN.

Before each lookup load, the demo excludes instruments held by other positions.
It excludes the edited row from the occupied set, disables lookup caching and
checks uniqueness again before applying a record. Rejected choices preserve the
previous row. A valid replacement keeps the position ID, updates instrument
identity fields and sets Average Cost to the current simulated price, so P/L
starts near zero. Fractional Crypto Quantity is kept; a switch to Stock, ETF or
Bond rounds up to a positive whole unit. Quantity edits require a finite
positive value. Stock, ETF and Bond use Integer editors; Crypto uses a Decimal
editor with up to eight fractional digits. Non-Crypto fractional input is rejected
without rounding or reinterpreting its digits.

The integrated AMB Grid `topCalc` row shows `POSIZIONI` (14), portfolio Value,
and P/L with overall Return % beneath it. Custom calculations read the current
market store rather than summing virtual formatter fields. `grid.recalc()` runs
after user edits and market ticks. The initially closed, keyboard-accessible
“Come funziona questa tabella” panel explains the lifecycle and presentation.

The toolbar searches the 14 held positions by instrument name, ticker or category.
Its mutually exclusive category chips combine with the query; the clear-search
button removes only the query, while “Azzera filtri” restores all positions.
AMB Grid filters the displayed rows and supplies the visible count. The topCalc
totals continue to use all positions, including those hidden by a filter.

Instrument icons use local SVGs where suitable, with an immediate text fallback
that remains visible if an image fails to load or the demo is offline. Asset
sources and use conditions are recorded in `src/assets/instruments/SOURCES.md`.

## Serve within the AMB Grid site

Use Node.js 24. From the repository root, install both workspaces once:

```bash
npm ci
npm ci --prefix examples/angular-demo
```

`npm run dev:site` builds the AMB Grid distribution and the Angular page, then
starts Vite. Open `http://localhost:5173/angular/`. After Angular source changes,
restart this command to rebuild the staged page.

The focused browser check is `tests/e2e/angular-portfolio.e2e.js`. Before running
it locally, stage `/angular/` with `npm run site:angular`; the CI `e2e` job installs
the Angular workspace and runs the same staging script before Playwright.

For production, run `npm run build:site` and then `npm run preview`. The Angular
CLI output is staged in the ignored `public/angular/` directory before Vite copies
it to `dist/angular/`. Both routes serve Angular from `/angular/`; the standalone
Angular CLI workspace remains available through its own `npm run dev`.

## Simulated live market

The portfolio uses a seeded, in-memory EUR random walk. Every 900 ms it updates
four held instruments, with fixed Previous Close and per-category bands: Stock
±7%, ETF ±5%, Bond ±2%, Crypto ±15%. These are simulation settings, not market
limits. Each Timeline keeps its latest 32 price samples. Pause stops the timer;
the timer also stops while the browser tab is hidden.

Live Price, Change %, Value, P/L and Timeline are rendered from the market store.
They do not enter AMB Grid CRUD data or its save payload. Sorting on these live
columns is disabled, and the demo offers no export of live values. Market ticks
update the five financial cells granularly and call `grid.recalc()` without changing row states or
snapshots. Pause stops quotes, while manual edits still refresh totals. Angular
creates the table in `ngAfterViewInit()` and destroys the grid, dialog, timer and
visibility listener in `ngOnDestroy()`; Angular owns the host and AMB Grid owns
the table DOM.
