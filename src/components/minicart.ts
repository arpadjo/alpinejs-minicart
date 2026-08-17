import { fetchCart } from '../api/cart.ts'
import type { CartResponse, Product } from '../types/cart.ts'

export type MinicartStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface MinicartState {
  status: MinicartStatus
  cart: CartResponse | null
  errorMessage: string
  formatMoney: (value: string | number | null | undefined) => string
  itemTotal: (product: Product) => number | null
  init: () => Promise<void>
  loadCart: () => Promise<void>
}

export function createMinicart(): MinicartState {
  return {
    status: 'loading',
    cart: null,
    errorMessage: '',

    formatMoney(value) {
      const amount = Number(value)

      if (!Number.isFinite(amount)) {
        return '—'
      }

      const formattedAmount = new Intl.NumberFormat('hu-HU').format(amount)
      return `${formattedAmount} ${this.cart?.currency_symbol ?? ''}`.trim()
    },

    itemTotal(product) {
      const unitPrice = Number(product.price)

      if (!Number.isFinite(unitPrice) || !Number.isFinite(product.qty)) {
        return null
      }

      return unitPrice * product.qty
    },

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
