export type CartErrorKind = 'network' | 'client' | 'server' | 'unknown'

export class CartApiError extends Error {
  readonly kind: CartErrorKind
  readonly status?: number

  constructor(kind: CartErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'CartApiError'
    this.kind = kind
    this.status = status
  }
}

export function getCartErrorDetails(error: unknown): {
  kind: CartErrorKind
  message: string
} {
  if (error instanceof CartApiError) {
    return { kind: error.kind, message: error.message }
  }

  return { kind: 'unknown', message: 'Something went wrong. Please try again.' }
}
