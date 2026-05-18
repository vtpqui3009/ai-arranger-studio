export const ROUTES = {
  landing: 'landing',
  studio: 'studio',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
