import type { CartResponse } from '../types/cart.ts'

export async function fetchCart(): Promise<CartResponse> {
  const response = await fetch('/api/cart')

  if (!response.ok) {
    throw new Error(`Cart request failed with status ${response.status}`)
  }

  return (await response.json()) as CartResponse
}
