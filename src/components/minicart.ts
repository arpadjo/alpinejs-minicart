import { updateCartItem } from '../api/cart-item.ts'
import { fetchCart } from '../api/cart.ts'
import { getCartErrorDetails, type CartErrorKind } from '../api/errors.ts'
import type { Accessory, CartResponse, Product } from '../types/cart.ts'

export type MinicartStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface MinicartState {
  status: MinicartStatus
  cart: CartResponse | null
  errorMessage: string
  errorKind: CartErrorKind | null
  actionError: string
  actionErrorKind: CartErrorKind | null
  savingItems: Record<string, boolean>
  pendingQuantities: Record<string, number | undefined>
  requestVersions: Record<string, number>
  formatMoney: (value: string | number | null | undefined) => string
  hasAmount: (value: string | number | null | undefined) => boolean
  errorTitle: (kind: CartErrorKind | null) => string
  itemTotal: (product: Product) => number | null
  itemKey: (shopId: number, product: Product) => string
  isSaving: (shopId: number, product: Product) => boolean
  normalizeQuantity: (product: Product, quantity: number) => number
  setQuantity: (shopId: number, product: Product, quantity: number | string) => Promise<void>
  removeItem: (shopId: number, product: Product) => Promise<void>
  flushQuantity: (shopId: number, product: Product) => Promise<void>
  preservePendingQuantities: (cart: CartResponse) => void
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
    errorKind: null,
    actionError: '',
    actionErrorKind: null,
    savingItems: {},
    pendingQuantities: {},
    requestVersions: {},

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

    errorTitle(kind) {
      switch (kind) {
        case 'network':
          return 'Connection problem'
        case 'client':
          return 'Cart request rejected'
        case 'server':
          return 'Cart service unavailable'
        default:
          return 'Cart error'
      }
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

      this.actionError = ''
      this.actionErrorKind = null
      this.requestVersions[key] = (this.requestVersions[key] ?? 0) + 1
      product.qty = nextQuantity
      this.pendingQuantities[key] = nextQuantity

      if (!this.savingItems[key]) {
        await this.flushQuantity(shopId, product)
      }
    },

    async removeItem(shopId, product) {
      const key = this.itemKey(shopId, product)

      this.actionError = ''
      this.actionErrorKind = null
      this.requestVersions[key] = (this.requestVersions[key] ?? 0) + 1
      this.pendingQuantities[key] = 0

      if (this.cart) {
        for (const shop of this.cart.shops) {
          if (shop.id !== shopId) {
            continue
          }

          shop.cart_items = shop.cart_items.filter(
            (cartItem) => cartItem.item.object_id !== product.object_id,
          )
        }

        this.cart.shops = this.cart.shops.filter((shop) => shop.cart_items.length > 0)
        this.status = this.cart.shops.length === 0 ? 'empty' : 'ready'
      }

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
          const requestVersion = this.requestVersions[key]
          delete this.pendingQuantities[key]

          const cart = await updateCartItem({
            shop_id: shopId,
            object_id: product.object_id,
            qty: quantity,
          })

          this.cart = cart
          const responseIsStale = this.requestVersions[key] !== requestVersion
          const anotherItemIsPending = Object.keys(this.pendingQuantities).length > 0

          if (responseIsStale || anotherItemIsPending) {
            this.preservePendingQuantities(cart)
          }
        }
      } catch (error) {
        const details = getCartErrorDetails(error)
        this.actionError = details.message
        this.actionErrorKind = details.kind

        try {
          this.cart = await fetchCart()
          this.status = this.cart.shops.length === 0 ? 'empty' : 'ready'
        } catch (reloadError) {
          const reloadDetails = getCartErrorDetails(reloadError)
          this.cart = null
          this.status = 'error'
          this.errorKind = reloadDetails.kind
          this.errorMessage = `The update failed and the cart could not be reloaded. ${reloadDetails.message}`
        }
      } finally {
        delete this.pendingQuantities[key]
        this.savingItems[key] = false
      }
    },

    preservePendingQuantities(cart) {
      for (const [key, quantity] of Object.entries(this.pendingQuantities)) {
        if (quantity === undefined) {
          continue
        }

        const separatorIndex = key.indexOf(':')
        const shopId = Number(key.slice(0, separatorIndex))
        const objectId = key.slice(separatorIndex + 1)
        const shop = cart.shops.find((candidate) => candidate.id === shopId)

        if (!shop) {
          continue
        }

        const itemIndex = shop.cart_items.findIndex(
          (cartItem) => cartItem.item.object_id === objectId,
        )

        if (quantity === 0) {
          if (itemIndex >= 0) {
            shop.cart_items.splice(itemIndex, 1)
          }
        } else if (itemIndex >= 0) {
          shop.cart_items[itemIndex].item.qty = quantity
        }
      }

      cart.shops = cart.shops.filter((shop) => shop.cart_items.length > 0)
      this.status = cart.shops.length === 0 ? 'empty' : 'ready'
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
      this.errorKind = null
      this.actionError = ''
      this.actionErrorKind = null

      try {
        const cart = await fetchCart()

        this.cart = cart
        this.status = cart.shops.length === 0 ? 'empty' : 'ready'
      } catch (error) {
        const details = getCartErrorDetails(error)
        this.cart = null
        this.status = 'error'
        this.errorKind = details.kind
        this.errorMessage = details.message
      }
    },
  }
}
