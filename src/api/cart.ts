import type { CartResponse } from '../types/cart.ts'
import { CartApiError } from './errors.ts'

export async function fetchCart(): Promise<CartResponse> {
  let response: Response

  try {
    response = await fetch('/api/cart')
  } catch {
    throw new CartApiError(
      'network',
      'We could not reach the cart service. Check your connection and try again.',
    )
  }

  if (!response.ok) {
    throw new CartApiError(
      response.status >= 500 ? 'server' : 'client',
      response.status >= 500
        ? 'The cart service is temporarily unavailable. Please try again shortly.'
        : 'The cart request was rejected. Please refresh and try again.',
      response.status,
    )
  }

  try {
    return (await response.json()) as CartResponse
  } catch {
    throw new CartApiError('unknown', 'The cart response was invalid.')
  }
}
