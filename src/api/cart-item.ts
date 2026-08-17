import type { CartResponse, UpdateCartItemRequest } from '../types/cart.ts'

export async function updateCartItem(
  request: UpdateCartItemRequest,
): Promise<CartResponse> {
  const response = await fetch('/api/cart/item', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Cart update failed with status ${response.status}`)
  }

  return (await response.json()) as CartResponse
}
