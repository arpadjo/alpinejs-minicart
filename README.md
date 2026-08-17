# Marketplace Minicart

Alpine.js minicart component for a marketplace cart structure with shop-level
carts, discounts, gift cards, shipping, payment, and grand totals.

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Type-check

```bash
npm run typecheck
```

## Current status

This repository currently contains the frontend scaffold. The mock cart API,
cart state, and minicart UI will be added in subsequent tasks.

## Mock API

The Vite development server exposes the typed mock response at:

```text
GET /api/cart
```

The response data is defined in `src/mocks/cart.ts` and its contract is defined
in `src/types/cart.ts`. The mock route is available during `npm run dev`; it is
not a production API server.

## Implementation notes

- TypeScript and Alpine.js are used for component state and behavior.
- Tailwind CSS is used for styling.
- Vite is used as the development server and build tool.

## Time spent

To be completed when the implementation is finished.
