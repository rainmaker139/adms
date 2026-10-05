import { Link } from 'react-router'
import type { HubData, PosInterface, PosMaster, TestState } from '../../types/hub'
import { Field } from '../admin/AdminUI'
import { DataTable, StatusBadge } from '../common/ui'
import { capabilities, hubTitles } from '../../data/hubCatalog'
import { requirements } from '../../state/hubStore'


export function HubLinks({ posId, interfaceId, storeId }: { posId?: string; interfaceId?: string; storeId?: string }) {
  const query = new URLSearchParams(); if (posId) query.set('pos', posId); if (interfaceId) query.set('interface', interfaceId); if (storeId) query.set('store', storeId)
  return <nav className="hub-flow" aria-label="POS 업무 흐름">{Object.entries(hubTitles).map(([id, title]) => <Link key={id} to={`/p/${id}?${query}`}>{title}</Link>)}</nav>
}
export function PosSelect({ hub, value, onChange }: { hub: HubData; value: string; onChange: (id: string) => void }) { return <Field label="POS 선택"><select value={value} onChange={e => onChange(e.target.value)}>{hub.poses.map(p => <option value={p.id} key={p.id}>{p.name}{!p.active && ' · 비활성'}</option>)}</select></Field> }
export function InterfaceSelect({ items, value, onChange }: { items: PosInterface[]; value?: string; onChange: (id: string) => void }) { return <Field label="Interface 선택"><select value={value ?? ''} onChange={e => onChange(e.target.value)}>{!items.length && <option value="">등록된 Interface 없음</option>}{items.map(i => <option key={i.id} value={i.id}>{i.name}{!i.active && ' · 비활성'}</option>)}</select></Field> }
export function TestBadge({ state }: { state: TestState }) { return <StatusBadge tone={state === 'success' ? 'success' : state === 'failure' ? 'warning' : 'neutral'}>{state === 'success' ? '성공' : state === 'failure' ? '실패' : '대기'}</StatusBadge> }
export function FieldRequirements({ ids, caption = 'Capability 요구 Field' }: { ids: string[]; caption?: string }) {
  const fields = requirements(ids)
  return <DataTable caption={caption} rows={fields} rowKey={f => f.id} columns={[{ key: 'schema', label: 'Schema', render: f => f.schema }, { key: 'field', label: '표준 Field', render: f => <><code>{f.name}</code><span className="cell-sub">{f.label}</span></> }, { key: 'type', label: '데이터형', render: f => f.type }, { key: 'required', label: '요구', render: f => <StatusBadge tone={f.required ? 'warning' : 'neutral'}>{f.required ? '필수' : '선택'}</StatusBadge> }, { key: 'cap', label: '사용 Capability', render: f => capabilities.filter(c => ids.includes(c.id) && c.fieldIds.includes(f.id)).map(c => c.name).join(', ') }]} />
}
export function PosImpact({ pos, hub }: { pos: PosMaster; hub: HubData }) { return <p className="muted">연결 점포 {hub.connections.filter(c => c.posId === pos.id).length}개 · Interface {hub.interfaces.filter(i => i.posId === pos.id).length}개. Capability 또는 연결 프로파일 변경 시 기존 매핑을 보존하고 점포를 재검증합니다.</p> }
