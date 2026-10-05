import type { Command } from './platformStore'
import { createContext, useContext } from 'react'
import type { Account, Business, Organization, Role, PlatformData } from '../types/platform'

interface AppContextValue {
  data: PlatformData
  storageAvailable: boolean
  run: (command: Command) => string | null
  account: Account | null
  business: Business | null
  organization: Organization | null
  role: Role | null
  login: (loginId: string, password: string) => boolean
  logout: () => void
  selectBusiness: (id: string) => void
}
export const AppContext = createContext<AppContextValue | null>(null)
export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('AppProvider is required')
  return value
}
