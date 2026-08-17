import { fetchCart } from '../api/cart.ts'
import type { CartResponse } from '../types/cart.ts'

export type MinicartStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface MinicartState {
  status: MinicartStatus
  cart: CartResponse | null
  errorMessage: string
  init: () => Promise<void>
  loadCart: () => Promise<void>
}

export function createMinicart(): MinicartState {
  return {
    status: 'loading',
    cart: null,
    errorMessage: '',

    async init() {
      await this.loadCart()
    },

    async loadCart() {
      this.status = 'loading'
      this.errorMessage = ''

      try {
        const cart = await fetchCart()

        this.cart = cart
        this.status = cart.shops.length === 0 ? 'empty' : 'ready'
      } catch (error) {
        this.cart = null
        this.status = 'error'
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Unable to load the cart.'
      }
    },
  }
}
