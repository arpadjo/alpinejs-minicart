declare module 'alpinejs' {
  interface Alpine {
    start(): void
    data<T extends object>(name: string, callback: () => T): void
  }

  const Alpine: Alpine

  export default Alpine
}
