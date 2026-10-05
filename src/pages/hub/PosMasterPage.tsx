import { useState } from 'react'
import { useHub } from '../../state/useHub'
import type { PosMaster } from '../../types/hub'
import { AdminList, Active, Check, Editor, Field } from '../../components/admin/AdminUI'
import { HubLinks } from '../../components/hub/HubUI'
import { DetailList } from '../../components/common/ui'
import { capabilities } from '../../data/hubCatalog'

export default function PosMasterPage() {
  const { hub, pos, select, save, feedback } = useHub()
  const [draft, setDraft] = useState<PosMaster | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [status, setStatus] = useState('all')
  const old = hub.poses.find(p => p.id === draft?.id)
  const edit = (p: PosMaster) => { setDraft({ ...p }); setConfirmed(false) }
  return <>{feedback}<AdminList title="POS 마스터" description="플랫폼 전체 POS 제품과 공급사를 관리합니다. 모든 프로파일은 실제 제품 규격이 아닌 Mock 예시입니다." rows={hub.poses.filter(p => status === 'all' || p.active === (status === 'active'))} rowKey={p => p.id} searchText={p => `${p.name} ${p.company} ${p.code}`} onCreate={() => edit({ id: crypto.randomUUID(), name: '', code: '', company: '', responsible: '', contact: '', phone: '', email: '', website: '', description: '', notes: '', active: true, capabilityIds: [] })} extraFilter={<Field label="POS 상태"><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">전체</option><option value="active">활성</option><option value="inactive">비활성</option></select></Field>} columns={[
    { key: 'pos', label: 'POS사 / 제품', render: p => <button className="text-button" onClick={() => select('pos', p.id)}>{p.name}<span className="cell-sub">{p.company}</span></button> }, { key: 'code', label: '코드', render: p => p.code }, { key: 'contact', label: '담당자 / 연락처', render: p => <>{p.contact}<span className="cell-sub">{p.phone}</span></> }, { key: 'method', label: '연동방식', render: p => [...new Set(hub.interfaces.filter(i => i.posId === p.id).map(i => i.method))].join(', ') || '미등록' }, { key: 'cap', label: '활성 Capability', render: p => p.capabilityIds.length }, { key: 'stores', label: '연결 점포', render: p => hub.connections.filter(c => c.posId === p.id).length }, { key: 'state', label: '상태', render: p => <Active value={p.active} /> },
  ]} /><section className="panel admin-detail admin-section"><div className="section-heading"><h2>{pos.name}</h2><button className="button secondary" onClick={() => edit(pos)}>POS 수정</button></div><DetailList items={[{ label: '회사명', value: pos.company }, { label: '책임자 / 실무담당', value: `${pos.responsible} / ${pos.contact}` }, { label: '연락처 / 이메일', value: `${pos.phone} / ${pos.email}` }, { label: '홈페이지', value: pos.website || '미등록' }, { label: '서비스 설명', value: pos.description || '미등록' }, { label: 'Capability', value: capabilities.filter(c => pos.capabilityIds.includes(c.id)).map(c => c.name).join(', ') || '아직 설정되지 않았습니다.' }, { label: '비고', value: pos.notes || '없음' }]} /><HubLinks posId={pos.id} /></section>
    {draft && <Editor title={old ? 'POS 수정' : 'POS 등록'} onClose={() => setDraft(null)} onSave={() => { const result = save({ kind: 'pos', value: draft, confirmed }); if (!result) select('pos', draft.id); return result }}>
      {(['company', 'name', 'code', 'responsible', 'contact', 'phone', 'email', 'website'] as const).map((key, i) => <Field key={key} label={['회사명', 'POS명', 'POS 코드', '대표자 또는 책임자', '실무 담당자', '연락처', '이메일', '홈페이지'][i]}><input required={i < 3} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></Field>)}
      <Field label="서비스 설명"><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></Field><Field label="비고"><textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field><Check label="POS 활성" checked={draft.active} onChange={active => setDraft({ ...draft, active })} />
      {old && draft.active !== old.active && <div className="notice-box full-width">상태 변경은 {hub.connections.filter(c => c.posId === old.id).length}개 점포의 연결에 영향을 줍니다. 비활성 시 연동을 중지하며 재활성 후에도 재검증합니다.<Check label="POS 상태 변경 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}
    </Editor>}
  </>
}
