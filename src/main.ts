import Alpine from 'alpinejs'
import { createMinicart } from './components/minicart.ts'
import './style.css'

declare global {
  interface Window {
    Alpine: typeof Alpine
  }
}

window.Alpine = Alpine

Alpine.data('minicart', createMinicart)
Alpine.start()
