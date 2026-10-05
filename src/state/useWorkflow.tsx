import { useState } from 'react'
import { useSearchParams, useLocation } from 'react-router'
import { useApp } from './AppContext'
import { organizationScope, execution, reserve, settlementTotals } from './workflowStore'
import type { WorkflowCommand } from '../types/workflow'
export function useWorkflow() {
  const app = useApp(), [params, setParams] = useSearchParams(), [message, setMessage] = useState(''), location = useLocation()
  const operatorId = app.account?.organizationId || '', businessId = app.business?.id || '', d = app.data.workflow, scope = organizationScope(app.data, operatorId)
  const stores = app.data.stores.filter(s => scope.has(s.organizationId)), companies = app.data.companies.filter(c => scope.has(c.organizationId)), branches = app.data.organizations.filter(o => scope.has(o.id) && o.type === '지회')
  const rounds = d.rounds.filter(r => r.operatorId === operatorId && r.businessId === businessId), batches = d.batches.filter(b => b.operatorId === operatorId && b.businessId === businessId)
  const round = rounds.find(r => r.id === params.get('round')) ?? rounds.find(r => r.status === 'executing') ?? rounds[0], batch = batches.find(b => b.id === params.get('batch')) ?? batches[0]
  function select(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); setParams(next) }
  function save(command: Omit<WorkflowCommand, 'operatorId' | 'businessId'>) { const result = app.run({ type: 'workflow', operation: { ...command, operatorId, businessId } }); setMessage(result || '처리 결과를 저장했습니다. 연결된 업무 화면에 반영했습니다.'); return result }
  const storeName = (id: string) => stores.find(s => s.id === id)?.name || id
  const branchName = (storeId: string) => { const company = app.data.companies.find(co => co.id === stores.find(s => s.id === storeId)?.companyId); return app.data.organizations.find(o => o.id === app.data.organizations.find(o => o.id === company?.organizationId)?.parentId)?.name || '직할' }
  const download = (name: string, rows: unknown[][]) => { if (save({ kind: 'download', id: name, method: location.pathname.split('/').at(-1), reason: `${rows.length}행 Mock 파일 생성` })) return; const cell = (value: unknown) => { const text = String(value ?? ''); return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"' }; const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return { ...app, d, operatorId, businessId, stores, companies, branches, rounds, batches, round, batch, params, select, save, storeName, branchName, execution: (r: string, s?: string) => execution(app.data, r, s), reserve: (r: string) => reserve(app.data, r), totals: (b: string) => settlementTotals(app.data, b), download, feedback: <>{message && <p className="notice-box" role="status">{message}</p>}{!app.storageAvailable && <p className="notice-box">저장소 차단 · 현재 세션 메모리에서 동작합니다.</p>}</> }
}
