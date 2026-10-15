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
