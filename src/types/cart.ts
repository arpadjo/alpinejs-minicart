export interface CartResponse {
  shops: Shop[]
  discounts: Discounts
  currency: string
  currency_symbol: string
  grandtotal: Grandtotal
}

export interface UpdateCartItemRequest {
  shop_id: number
  object_id: string
  qty: number
}

export interface Shop {
  id: number
  name: string
  avatar: string | null
  link: string | null
  just_personal_orders: string
  cart_items: CartItem[]
  shipping: Shipping
  payment: Payment
  comment: Comment
  address: Address
  subtotal: ShopSubtotal
}

export interface CartItem {
  item: Product
}

export interface Product {
  object_id: string
  id: number
  name: string
  product_code: string
  price: string
  original_price: string
  discount_price: string
  discount_unit: string
  discount_value: number
  unit: string
  qty: number
  min_qty: number
  max_qty: number
  pack_quantity: number
  to_order_product: number
  to_order_product_time: number
  specific_customer_id: number
  image: string | null
  url: string
  variants: Record<string, number>
  accessories: Accessories | null
  unit_price: string
}

export interface Accessories {
  items: Accessory[] | null
}

export interface Accessory {
  id: number
  name: string
  qty: number
  price: string
  min_qty: number
  max_qty: number
}

export interface Shipping {
  method_id: number
  method_code: string
  method_type: string
  method_name: string
  price: string
  original_price: string
  special_price: string
  discount_price: string
}

export interface Payment {
  method_code: string
  method_name: string
  price: string
  original_price: string
  special_price: string
  discount_price: string
}

export interface Comment {
  message: string
}

export interface Address {
  shipping: number
  billing: number
  same_as_shipping: number
}

export interface ShopSubtotal {
  subtotal: string
  shipping_price: string
  discount: string
  total: string
}

export interface Discounts {
  coupons: Coupon[]
  giftcards: Giftcard[]
}

export interface Coupon {
  id: number
  code: string
  value: number
  expiration_date: string
  status: string
}

export interface Giftcard {
  id: number
  code: string
  value: number
  expiration_date: string
  status: string
}

export interface Grandtotal {
  product_qty: number
  shop_qty: number
  grandtotal: string
  shipping_price: string
  payment_price: string
  discount: string
}
