# Angular demo data

The portfolio catalog and initial positions are simulated data. Prices, average
costs, and previous closes are in EUR; no market feed or FX conversion is used.
For bonds, quantity counts EUR 100 nominal lots and price is EUR per lot.

Calculations in `src/app/portfolio/portfolio-calculations.ts` use:

- Value = Quantity × Price
- P/L = Quantity × (Price − Average Cost)
- Change % = (Price − Previous Close) / Previous Close × 100
- Portfolio Value = sum of position Values

Invalid numeric inputs throw `RangeError`. Change % is `null` when Previous Close
is zero. Calculations do not round; formatting belongs to the future UI.

## Serve within the AMB Grid site

Use Node.js 24. From the repository root, install both workspaces once:

```bash
npm ci
npm ci --prefix examples/angular-demo
```

`npm run dev:site` builds the AMB Grid distribution and the Angular page, then
starts Vite. Open `http://localhost:5173/angular/`. After Angular source changes,
restart this command to rebuild the staged page.

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
columns is disabled, and the demo offers no export of live values. Quantity
remains the user-edited CRUD field.
