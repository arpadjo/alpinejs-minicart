import { fetchCart } from '../api/cart.ts'
import type { Accessory, CartResponse, Product } from '../types/cart.ts'

export type MinicartStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface MinicartState {
  status: MinicartStatus
  cart: CartResponse | null
  errorMessage: string
  formatMoney: (value: string | number | null | undefined) => string
  itemTotal: (product: Product) => number | null
  hasAccessories: (product: Product) => boolean
  getAccessories: (product: Product) => Accessory[]
  isMadeToOrder: (product: Product) => boolean
  preparationMessage: (product: Product) => string
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

    hasAccessories(product) {
      const items = product.accessories?.items
      return Array.isArray(items) && items.length > 0
    },

    getAccessories(product) {
      const items = product.accessories?.items
      return Array.isArray(items) ? items : []
    },

    isMadeToOrder(product) {
      return Number(product.to_order_product) === 1
    },

    preparationMessage(product) {
      const days = Number(product.to_order_product_time)

      if (!Number.isFinite(days) || days <= 0) {
        return 'Preparation time not specified.'
      }

      return `Prepared in ${days} business day${days === 1 ? '' : 's'}.`
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
