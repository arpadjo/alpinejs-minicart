# Marketplace Minicart

Alpine.js minicart component for a marketplace cart structure with shop-level
carts, discounts, gift cards, shipping, payment, and grand totals.

## Setup

```bash
pnpm install
```

## Run locally

```bash
pnpm dev
```

## Build

```bash
pnpm run build
```

## Type-check

```bash
pnpm run typecheck
```

## Current status

The minicart supports loading the mock cart, shop and product rendering,
accessories, made-to-order preparation details, totals, gift cards, quantity
updates, and item removal.

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

Network failures, client-side/API validation errors (`4xx`), and server errors
(`5xx`) are surfaced with different UX messages and retry behavior.

The response data is defined in `src/mocks/cart.ts` and its contract is defined
in `src/types/cart.ts`. Both mock routes are available during `pnpm dev`; they
are not production API endpoints.

## Implementation notes

- TypeScript and Alpine.js are used for component state and behavior.
- Tailwind CSS is used for styling.
- Vite is used as the development server and build tool.
- The cart is registered as a modular Alpine data component; the API client is
  separate from UI state and rendering.
- Quantity changes are optimistic in the UI and synchronized through PATCH.
  Per-item request queues and pending-intent preservation prevent stale full
  cart responses from overwriting newer changes.
- `qty: 0` is the mock API contract for item removal.
- HUF values are formatted with the `hu-HU` locale and the currency symbol
  supplied by the API.

## API assumptions

- `GET /api/cart` returns the complete cart, including shops, discounts, and
  grand totals.
- `PATCH /api/cart/item` accepts `shop_id`, `object_id`, and `qty`, and returns
  the complete updated cart.
- Product quantities are valid only within `min_qty`/`max_qty` and aligned to
  `pack_quantity`.
- `accessories.items` may be `null`; empty image and link values are treated as
  missing data.
- The mock server keeps state in memory. Restarting `pnpm dev` resets it to the
  fixture in `src/mocks/cart.ts`.

## Verification

Run the automated checks:

```bash
pnpm run typecheck
pnpm run build
git diff --check
```

Run the app and verify manually:

1. Open `http://localhost:5173/` and confirm the cart loads.
2. Confirm shop, product, accessory, preparation, subtotal, grand total, and
   gift-card sections are visible.
3. Change quantity with `+`, `−`, and the numeric input; verify saving state,
   pack/min/max validation, and updated totals.
4. Remove an item; verify optimistic removal and recalculated totals.
5. Remove all items; verify the empty-cart state.
6. Stop the API/server or use an invalid request; verify network, `4xx`, and
   `5xx` messages and retry behavior.

The mock API can also be checked directly:

```bash
curl --silent http://localhost:5173/api/cart | jq
```

## Time spent

I don't have enough information to report an exact implementation duration.
Record the actual duration here before submitting the task.
