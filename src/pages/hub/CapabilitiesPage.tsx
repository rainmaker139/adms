import { useState } from 'react'
import { useHub } from '../../state/useHub'
import { capabilities } from '../../data/hubCatalog'
import { requirements } from '../../state/hubStore'
import { Check } from '../../components/admin/AdminUI'
import { FieldRequirements, HubLinks, PosImpact, PosSelect } from '../../components/hub/HubUI'
import { PageHeader } from '../../components/common/ui'
import type { HubData, PosMaster } from '../../types/hub'

export default function CapabilitiesPage() {
  const app = useHub()
  return <><PageHeader eyebrow="POS DATA HUB" title="Capability" description="기능별 지원 여부를 설정합니다. 선택하면 필요한 표준 Field 요구사항을 바로 확인할 수 있습니다." />{app.feedback}<div className="hub-controls"><PosSelect hub={app.hub} value={app.pos.id} onChange={id => app.select('pos', id)} /></div><CapabilityEditor key={app.pos.id} pos={app.pos} hub={app.hub} save={app.save} /></>
}
function CapabilityEditor({ pos, hub, save }: { pos: PosMaster; hub: HubData; save: ReturnType<typeof useHub>['save'] }) {
  const [ids, setIds] = useState(pos.capabilityIds)
  const [confirmed, setConfirmed] = useState(false)
  const changed = [...ids].sort().join('|') !== [...pos.capabilityIds].sort().join('|')
  const impacted = hub.connections.filter(c => c.posId === pos.id)
  const fields = requirements(ids)
  return <><section className="panel admin-detail"><div className="section-heading"><h2>{pos.name}</h2><span>{ids.length}개 지원 기능 · 표준 Field {fields.length}개</span></div><PosImpact pos={pos} hub={hub} /><div className="hub-cap-grid">{[...new Set(capabilities.map(c => c.group))].map(group => <fieldset key={group}><legend>{group}</legend>{capabilities.filter(c => c.group === group).map(c => <Check key={c.id} label={c.name} checked={ids.includes(c.id)} onChange={on => { setIds(on ? [...ids, c.id] : ids.filter(id => id !== c.id)); setConfirmed(false) }} />)}</fieldset>)}</div>
    {changed && impacted.length > 0 && <div className="notice-box">연결 점포 {impacted.length}개가 재검증 대상입니다. OFF된 기능의 Schema/Mapping은 보존하며 해당 기능의 사용만 제한합니다.<Check label="Capability 변경 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}<div className="admin-actions"><button className="button primary" disabled={!changed} onClick={() => save({ kind: 'capabilities', posId: pos.id, ids, confirmed })}>Capability 저장</button><button className="button secondary" disabled={!changed} onClick={() => { setIds(pos.capabilityIds); setConfirmed(false) }}>변경 취소</button></div></section>
    <section className="panel admin-detail admin-section"><div className="section-heading"><h2>Capability → 요구 Schema / Field</h2><span>{changed ? '저장 전 미리보기' : '현재 저장된 요구사항'}</span></div><p className="muted">공통 Field는 한 번만 표시합니다. 필수/선택 여부는 Mock 표준이며 POS별 실제 제출 규격은 별도 협의 대상입니다.</p><FieldRequirements ids={ids} /><HubLinks posId={pos.id} /></section>
  </>
}
