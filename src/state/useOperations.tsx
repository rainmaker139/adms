import { useState, useSyncExternalStore } from 'react'
import { useApp } from './AppContext'
import { applyOperations, OPERATIONS_KEY, readOperations } from './operationsStore'
import type { OperationsCommand, OperationsData } from '../types/operations'
let current: OperationsData | undefined
let stored = true
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const snapshot = () => current ??= readOperations()
export function useOperations() {
  const app = useApp(), operations = useSyncExternalStore(subscribe, snapshot)
  const [message, setMessage] = useState('')
  function save(command: OperationsCommand) {
    try {
      if (app.account?.roleId !== 'system') throw Error('시스템 관리자 전용 기능입니다.')
      if (command.kind === 'notification' && (!command.value.roleIds.every(id => app.data.roles.some(r => r.id === id)) || !command.value.organizationIds.every(id => app.data.organizations.some(o => o.id === id)))) throw Error('등록된 Role과 조직을 선택해 주세요.')
      current = applyOperations(snapshot(), command, { actor: app.account.name, organizationId: app.account.organizationId, role: app.role?.name || '시스템 관리자' })
      try { localStorage.setItem(OPERATIONS_KEY, JSON.stringify(current)); stored = true } catch { stored = false }
      listeners.forEach(l => l()); setMessage('처리 결과를 저장했습니다. 감사 이력에 반영했습니다.'); return null
    } catch (e) { const error = e instanceof Error ? e.message : '처리하지 못했습니다.'; setMessage(error); return error }
  }
  function download(entity: string, menu: string, filename: string, rows: unknown[][]) {
    const csv = '\uFEFF' + rows.map(row => row.map(v => { const text = typeof v === 'string' ? v : JSON.stringify(v) ?? ''; return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"' }).join(',')).join('\r\n')
    const error = save({ kind: 'download', entity, menu, related: filename }); if (error) return
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return { ...app, operations, save, download, feedback: <>{message && <p role="status" className="notice-box">{message}</p>}{!stored && <p className="notice-box">브라우저 저장이 차단되어 현재 세션 메모리에서 유지합니다.</p>}</> }
}
