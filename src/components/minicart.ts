import { updateCartItem } from '../api/cart-item.ts'
import { fetchCart } from '../api/cart.ts'
import type { Accessory, CartResponse, Product } from '../types/cart.ts'

export type MinicartStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface MinicartState {
  status: MinicartStatus
  cart: CartResponse | null
  errorMessage: string
  savingItems: Record<string, boolean>
  pendingQuantities: Record<string, number | undefined>
  formatMoney: (value: string | number | null | undefined) => string
  hasAmount: (value: string | number | null | undefined) => boolean
  itemTotal: (product: Product) => number | null
  itemKey: (shopId: number, product: Product) => string
  isSaving: (shopId: number, product: Product) => boolean
  normalizeQuantity: (product: Product, quantity: number) => number
  setQuantity: (shopId: number, product: Product, quantity: number | string) => Promise<void>
  flushQuantity: (shopId: number, product: Product) => Promise<void>
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
    savingItems: {},
    pendingQuantities: {},

    formatMoney(value) {
      const amount = Number(value)

      if (!Number.isFinite(amount)) {
        return '—'
      }

      const formattedAmount = new Intl.NumberFormat('hu-HU').format(amount)
      return `${formattedAmount} ${this.cart?.currency_symbol ?? ''}`.trim()
    },

    hasAmount(value) {
      const amount = Number(value)
      return Number.isFinite(amount) && amount !== 0
    },

    itemKey(shopId, product) {
      return `${shopId}:${product.object_id}`
    },

    isSaving(shopId, product) {
      return this.savingItems[this.itemKey(shopId, product)] === true
    },

    normalizeQuantity(product, quantity) {
      const min = Math.max(0, Number(product.min_qty) || 0)
      const max = Math.max(min, Number(product.max_qty) || min)
      const pack = Math.max(1, Number(product.pack_quantity) || 1)
      const requested = Number(quantity)

      if (!Number.isFinite(requested)) {
        return product.qty
      }

      const clamped = Math.min(max, Math.max(min, requested))
      const aligned = min + Math.round((clamped - min) / pack) * pack

      return Math.min(max, Math.max(min, aligned))
    },

    async setQuantity(shopId, product, quantity) {
      const key = this.itemKey(shopId, product)
      const nextQuantity = this.normalizeQuantity(product, Number(quantity))

      product.qty = nextQuantity
      this.pendingQuantities[key] = nextQuantity

      if (!this.savingItems[key]) {
        await this.flushQuantity(shopId, product)
      }
    },

    async flushQuantity(shopId, product) {
      const key = this.itemKey(shopId, product)
      this.savingItems[key] = true

      try {
        while (this.pendingQuantities[key] !== undefined) {
          const quantity = this.pendingQuantities[key] as number
          delete this.pendingQuantities[key]

          const cart = await updateCartItem({
            shop_id: shopId,
            object_id: product.object_id,
            qty: quantity,
          })

          this.cart = cart

          const pendingQuantity = this.pendingQuantities[key]
          if (pendingQuantity !== undefined) {
            const currentProduct = this.cart.shops
              .find((shop) => shop.id === shopId)
              ?.cart_items.find((cartItem) => cartItem.item.object_id === product.object_id)
              ?.item

            if (currentProduct) {
              currentProduct.qty = pendingQuantity
            }
          }
        }
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : 'Unable to update the cart.'

        try {
          this.cart = await fetchCart()
        } catch {
          this.status = 'error'
        }
      } finally {
        delete this.pendingQuantities[key]
        this.savingItems[key] = false
      }
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
