import { seed } from '../data/seed.ts'
import type { PlatformData } from '../types/platform.ts'
import { accountEnabled, availableBusinesses } from '../access/policy.ts'

export interface DemoSession { accountId: string; businessId: string }
export const SESSION_KEY = 'adms.demo.session.v1'
export function authenticate(loginId: string, password: string, data: PlatformData = seed): DemoSession | null {
  const account = data.accounts.find(a => a.loginId === loginId.trim() && password === '1234' && accountEnabled(a, data))
  return account ? { accountId: account.id, businessId: availableBusinesses(account, data)[0]?.id ?? '' } : null
}
export function validateSession(value: unknown, data: PlatformData = seed): DemoSession | null {
  if (!value || typeof value !== 'object' || !('accountId' in value) || !('businessId' in value)) return null
  const account = data.accounts.find((a) => a.id === value.accountId && accountEnabled(a, data))
  if (!account) return null
  const choices = availableBusinesses(account, data)
  if (!choices.some((b) => b.id === value.businessId) && !(choices.length === 0 && value.businessId === '')) return null
  // Role/조직은 저장된 값을 신뢰하지 않고 mock 마스터에서 다시 계산한다.
  return { accountId: account.id, businessId: String(value.businessId) }
}
export function readSession(data: PlatformData = seed): DemoSession | null {
  try { return validateSession(JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'), data) } catch { return null }
}
export function saveSession(session: DemoSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch { /* file:// 저장 차단/용량 초과 시에도 React 메모리 세션은 유지된다. */ }
}
