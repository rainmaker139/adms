import { Link } from 'react-router'
import { useState } from 'react'
import { useHub } from '../../state/useHub'
import { capabilities, directionLabels, methods } from '../../data/hubCatalog'
import type { PosInterface } from '../../types/hub'
import { interfaceCapabilities, interfaceIssue } from '../../state/hubStore'
import { Active, Check, Editor, Field } from '../../components/admin/AdminUI'
import { PosSelect } from '../../components/hub/HubUI'
import { DataTable, PageHeader } from '../../components/common/ui'

export default function InterfacesPage() {
  const { hub, pos, interfaces, select, save, feedback } = useHub()
  const [draft, setDraft] = useState<PosInterface | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const old = hub.interfaces.find(i => i.id === draft?.id)
  const edit = (i: PosInterface) => { setDraft({ ...i }); setConfirmed(false) }
  return <><PageHeader eyebrow="POS DATA HUB" title="데이터소스·인터페이스" description="한 POS에 여러 수신/송신 프로파일을 등록합니다. 접속 규격은 범용 Mock 항목으로 구성합니다." actions={<button className="button primary" onClick={() => edit({ id: crypto.randomUUID(), posId: pos.id, name: '', method: 'API', direction: 'read', capabilityIds: [], active: true, description: '' })}>Interface 등록</button>} />{feedback}<div className="hub-controls"><PosSelect hub={hub} value={pos.id} onChange={id => select('pos', id)} /></div><section className="panel"><DataTable rows={interfaces} rowKey={i => i.id} caption="POS Interface 목록" columns={[
    { key: 'name', label: 'Interface', render: i => <button className="text-button" onClick={() => edit(i)}>{i.name}</button> }, { key: 'method', label: '방식 / 방향', render: i => `${i.method} / ${directionLabels[i.direction]}` }, { key: 'cap', label: '활성 대상 Capability', render: i => interfaceCapabilities(hub, i).map(c => c.name).join(', ') || '없음' }, { key: 'state', label: '상태', render: i => <><Active value={i.active} /><span className="cell-sub">{interfaceIssue(hub, i)}</span></> }, { key: 'next', label: '다음 작업', render: i => <Link className="text-button" to={`/p/pos-mapping?pos=${pos.id}&interface=${i.id}`}>매핑 보기</Link> },
  ]} /></section>
    {draft && <Editor title={old ? 'Interface 수정' : 'Interface 등록'} onClose={() => setDraft(null)} onSave={() => save({ kind: 'interface', value: draft, confirmed })}>
      <Field label="Interface명"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="방식"><select value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value as PosInterface['method'] })}>{methods.map(m => <option key={m}>{m}</option>)}</select></Field><Field label="방향"><select value={draft.direction} onChange={e => setDraft({ ...draft, direction: e.target.value as PosInterface['direction'] })}>{Object.entries(directionLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field><Check label="Interface 활성" checked={draft.active} onChange={active => setDraft({ ...draft, active })} /><Field label="설명"><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></Field>
      <fieldset className="full-width"><legend>대상 Capability</legend><div className="program-checks">{capabilities.filter(c => !c.technical && (pos.capabilityIds.includes(c.id) || draft.capabilityIds.includes(c.id))).map(c => <Check key={c.id} label={`${c.name}${!pos.capabilityIds.includes(c.id) ? ' · POS에서 OFF' : ''}`} checked={draft.capabilityIds.includes(c.id)} onChange={on => setDraft({ ...draft, capabilityIds: on ? [...draft.capabilityIds, c.id] : draft.capabilityIds.filter(id => id !== c.id) })} />)}</div></fieldset>
      {old && hub.connections.some(c => c.interfaceId === old.id) && <div className="notice-box full-width">프로파일 변경 후 연결된 점포의 기존 검증을 초기화합니다.<Check label="Interface 변경 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}
    </Editor>}
  </>
}
