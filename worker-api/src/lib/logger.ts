export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(message, meta ?? {})
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(message, meta ?? {})
  },
}
