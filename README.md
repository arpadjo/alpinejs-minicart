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

Quantity updates use:

```text
PATCH /api/cart/item
Content-Type: application/json

{
  "shop_id": 592000005565,
  "object_id": "36e402497",
  "qty": 3
}
```

Set `qty` to `0` to remove an item. Invalid quantities return `422`; failed
updates reload the cart so the UI rolls back to the server state.

The response data is defined in `src/mocks/cart.ts` and its contract is defined
in `src/types/cart.ts`. Both mock routes are available during `npm run dev`;
they are not production API endpoints.

## Implementation notes

- TypeScript and Alpine.js are used for component state and behavior.
- Tailwind CSS is used for styling.
- Vite is used as the development server and build tool.

## Time spent

To be completed when the implementation is finished.
