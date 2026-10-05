import { useState } from 'react'
import { useHub } from '../../state/useHub'
import { statuses } from '../../types/status'
import { interfaceCapabilities, liveCapabilities } from '../../state/hubStore'
import { Field } from '../../components/admin/AdminUI'
import { DataTable, PageHeader, StatusBadge } from '../../components/common/ui'
import KpiCard from '../../components/KpiCard'
import ConnectionPanel from '../../components/hub/ConnectionPanel'

export default function ConnectionsPage({ history = false }: { history?: boolean }) {
  const { hub, data, store, select } = useHub()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const rows = hub.connections.filter(c => { const s = data.stores.find(s => s.id === c.storeId)!; const p = hub.poses.find(p => p.id === c.posId); return `${s.name} ${p?.name ?? ''}`.includes(query.trim()) && (status === 'all' || c.status === status) })
  return <><PageHeader eyebrow="STORE INTEGRATION" title={history ? '연동 현황·이력' : '점포 POS 연동'} description={history ? '전체 점포의 수집·오류·검증 상태를 확인하고 재연결·재검증·중지를 처리합니다.' : 'POS 종류 지정과 실제 연결 완료를 분리합니다. 점포 접속정보와 단계별 검증을 완료한 후 활성화합니다.'} />
    {history && <div className="hub-kpis">{(['all', 'active', 'configuring', 'validating', 'error', 'stopped'] as const).map(s => <KpiCard key={s} label={s === 'all' ? '전체 대상 점포' : statuses.posConnection[s]} value={`${s === 'all' ? hub.connections.length : hub.connections.filter(c => c.status === s).length}`} />)}</div>}
    <div className="hub-controls"><Field label="점포 / POS 검색"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="점포명 또는 POS" /></Field><Field label="연동 상태"><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">전체</option>{Object.entries(statuses.posConnection).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field></div><section className="panel"><DataTable rows={rows} rowKey={c => c.storeId} caption="점포 POS 연결 목록" columns={[
      { key: 'store', label: '점포 / 회원사', render: c => { const s = data.stores.find(s => s.id === c.storeId)!; return <button className="text-button" onClick={() => select('store', c.storeId)}>{s.name}<span className="cell-sub">{data.companies.find(co => co.id === s.companyId)?.legalName}</span></button> } }, { key: 'pos', label: 'POS / Interface', render: c => <>{hub.poses.find(p => p.id === c.posId)?.name ?? '미지정'}<span className="cell-sub">{hub.interfaces.find(i => i.id === c.interfaceId)?.name ?? '미설정'}</span></> }, { key: 'status', label: '연동 상태', render: c => <StatusBadge tone={c.status === 'active' ? 'success' : c.status === 'error' ? 'warning' : 'neutral'}>{statuses.posConnection[c.status]}</StatusBadge> }, { key: 'cap', label: '실행 / 지원 기능', render: c => { const iface = hub.interfaces.find(i => i.id === c.interfaceId); return `${liveCapabilities(hub, c).length} / ${iface ? interfaceCapabilities(hub, iface).length : 0}` } }, { key: 'last', label: '마지막 수신 / 처리건수', render: c => <>{c.lastReceived ? new Date(c.lastReceived).toLocaleString('ko-KR') : '없음'}<span className="cell-sub">{c.lastCount}건</span></> }, { key: 'error', label: '최근 오류', render: c => <span className="hub-wrap">{c.lastError || '없음'}</span> },
    ]} /></section><ConnectionPanel key={store.id} storeId={store.id} /></>
}
