import Alpine from 'alpinejs'
import './style.css'

declare global {
  interface Window {
    Alpine: typeof Alpine
  }
}

window.Alpine = Alpine

Alpine.start()
