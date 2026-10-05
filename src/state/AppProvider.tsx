import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { accountEnabled, availableBusinesses, getRole } from '../access/policy'
import { authenticate, readSession, saveSession } from './session'
import { applyCommand, readData, saveData } from './platformStore'
import type { Command } from './platformStore'
import { AppContext } from './AppContext'

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readData)
  const current = useRef(data)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [session, setSession] = useState(() => readSession(data))
  useEffect(() => { saveSession(session) }, [session])
  const candidate = data.accounts.find(a => a.id === session?.accountId)
  const account = candidate && accountEnabled(candidate, data) ? candidate : null
  const choices = account ? availableBusinesses(account, data) : []
  const business = choices.find(b => b.id === session?.businessId) ?? choices[0] ?? { id: '', name: '연결된 사업 없음', code: '—', description: '사업 참여 조직 연결 후 사업 업무를 이용할 수 있습니다.', status: 'planned' as const, startsOn: '—', endsOn: '—', applicationOpen: false }
  const organization = data.organizations.find(o => o.id === account?.organizationId) ?? null
  const role = account ? getRole(account, data) : null
  function run(command: Command): string | null {
    try {
      const next = applyCommand(current.current, account?.id ?? '', command)
      current.current = next; setData(next); setStorageAvailable(saveData(next))
      return null
    } catch (error) { return error instanceof Error ? error.message : '저장하지 못했습니다.' }
  }
  return <AppContext.Provider value={{ data, storageAvailable, run, account, business, organization, role,
    login(loginId, password) {
      const next = authenticate(loginId, password, current.current)
      if (next) {
        const updated = { ...current.current, accounts: current.current.accounts.map(a => a.id === next.accountId ? { ...a, lastLogin: new Date().toLocaleString('ko-KR') } : a) }
        current.current = updated; setData(updated); setStorageAvailable(saveData(updated))
      }
      setSession(next); return next !== null
    },
    logout() { saveSession(null); setSession(null) },
    selectBusiness(id) { if (account && choices.some(b => b.id === id)) setSession({ accountId: account.id, businessId: id }) },
  }}>{children}</AppContext.Provider>
}
