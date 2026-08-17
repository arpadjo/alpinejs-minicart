import type { CartResponse, UpdateCartItemRequest } from '../types/cart.ts'
import { CartApiError } from './errors.ts'

export async function updateCartItem(
  request: UpdateCartItemRequest,
): Promise<CartResponse> {
  let response: Response

  try {
    response = await fetch('/api/cart/item', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new CartApiError(
      'network',
      'We could not save the cart. Check your connection and try again.',
    )
  }

  if (!response.ok) {
    const responseBody = await response.text()
    let message = responseBody

    try {
      const parsedBody = JSON.parse(responseBody) as { message?: string }
      message = parsedBody.message ?? responseBody
    } catch {
      // Keep the plain-text response when the API does not return JSON.
    }

    throw new CartApiError(
      response.status >= 500 ? 'server' : 'client',
      message ||
        (response.status >= 500
          ? 'The cart service is temporarily unavailable. Please try again shortly.'
          : 'The cart update was rejected. Please check the quantity and try again.'),
      response.status,
    )
  }

  try {
    return (await response.json()) as CartResponse
  } catch {
    throw new CartApiError('unknown', 'The cart response was invalid.')
  }
}
