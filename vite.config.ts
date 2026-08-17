import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { mockCart } from './src/mocks/cart.ts'
import type { CartResponse, Product, UpdateCartItemRequest } from './src/types/cart.ts'

interface MockRequest {
  method?: string
  on: (
    event: 'data' | 'end',
    listener: (chunk?: unknown) => void,
  ) => void
}

const cartState: CartResponse = JSON.parse(JSON.stringify(mockCart)) as CartResponse

function parseAmount(value: string | number): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function recalculateCart(cart: CartResponse): void {
  for (const shop of cart.shops) {
    const productSubtotal = shop.cart_items.reduce((total, cartItem) => {
      const product = cartItem.item
      const accessoryTotal = product.accessories?.items?.reduce(
        (accessorySum, accessory) =>
          accessorySum + parseAmount(accessory.price) * accessory.qty,
        0,
      ) ?? 0

      return total + parseAmount(product.price) * product.qty + accessoryTotal
    }, 0)

    const shipping = parseAmount(shop.shipping.price)
    const payment = parseAmount(shop.payment.price)
    const discount = parseAmount(shop.subtotal.discount)

    shop.subtotal.subtotal = String(productSubtotal)
    shop.subtotal.shipping_price = String(shipping)
    shop.subtotal.total = String(productSubtotal + shipping + payment - discount)
  }

  const productTotal = cart.shops.reduce(
    (total, shop) => total + parseAmount(shop.subtotal.subtotal),
    0,
  )
  const shippingTotal = cart.shops.reduce(
    (total, shop) => total + parseAmount(shop.shipping.price),
    0,
  )
  const paymentTotal = cart.shops.reduce(
    (total, shop) => total + parseAmount(shop.payment.price),
    0,
  )
  const discountTotal = cart.discounts.giftcards.reduce(
    (total, giftcard) => total + giftcard.value,
    0,
  )

  cart.grandtotal.product_qty = cart.shops.reduce(
    (total, shop) =>
      total + shop.cart_items.reduce((shopTotal, item) => shopTotal + item.item.qty, 0),
    0,
  )
  cart.grandtotal.shop_qty = cart.shops.length
  cart.grandtotal.shipping_price = String(shippingTotal)
  cart.grandtotal.payment_price = String(paymentTotal)
  cart.grandtotal.discount = String(discountTotal)
  cart.grandtotal.grandtotal = String(productTotal + shippingTotal + paymentTotal - discountTotal)
}

function isValidQuantity(product: Product, quantity: number): boolean {
  const min = Math.max(0, product.min_qty)
  const max = Math.max(min, product.max_qty)
  const pack = Math.max(1, product.pack_quantity)

  return (
    Number.isInteger(quantity) &&
    quantity >= min &&
    quantity <= max &&
    (quantity - min) % pack === 0
  )
}

function sendJson(response: { statusCode: number; setHeader: Function; end: Function }, statusCode: number, data: unknown): void {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(data))
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'mock-cart-api',
      configureServer(server) {
        server.middlewares.use('/api/cart/item', (request, response) => {
          const patchRequest = request as unknown as MockRequest

          if (patchRequest.method !== 'PATCH') {
            response.statusCode = 405
            response.setHeader('Allow', 'PATCH')
            response.end('Method Not Allowed')
            return
          }

          let body = ''
          patchRequest.on('data', (chunk) => {
            body += String(chunk ?? '')
          })
          patchRequest.on('end', () => {
            let payload: UpdateCartItemRequest

            try {
              payload = JSON.parse(body) as UpdateCartItemRequest
            } catch {
              sendJson(response, 400, { message: 'Request body must be valid JSON.' })
              return
            }

            const shop = cartState.shops.find((candidate) => candidate.id === payload.shop_id)
            const cartItem = shop?.cart_items.find(
              (candidate) => candidate.item.object_id === payload.object_id,
            )

            if (!shop || !cartItem) {
              sendJson(response, 404, { message: 'Cart item not found.' })
              return
            }

            if (payload.qty === 0) {
              shop.cart_items = shop.cart_items.filter(
                (candidate) => candidate.item.object_id !== payload.object_id,
              )
              cartState.shops = cartState.shops.filter(
                (candidate) => candidate.cart_items.length > 0,
              )
              recalculateCart(cartState)
              sendJson(response, 200, cartState)
              return
            }

            if (!isValidQuantity(cartItem.item, payload.qty)) {
              sendJson(response, 422, {
                message: `Quantity must be between ${cartItem.item.min_qty} and ${cartItem.item.max_qty} in packs of ${cartItem.item.pack_quantity}.`,
              })
              return
            }

            cartItem.item.qty = payload.qty
            recalculateCart(cartState)
            sendJson(response, 200, cartState)
          })
        })

        server.middlewares.use('/api/cart', (request, response) => {
          const method = (request as { method?: string }).method

          if (method !== 'GET') {
            response.statusCode = 405
            response.setHeader('Allow', 'GET')
            response.end('Method Not Allowed')
            return
          }

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(cartState))
        })
      },
    },
  ],
})
