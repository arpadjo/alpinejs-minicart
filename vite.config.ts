import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { mockCart } from './src/mocks/cart.ts'

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'mock-cart-api',
      configureServer(server) {
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
          response.end(JSON.stringify(mockCart))
        })
      },
    },
  ],
})
