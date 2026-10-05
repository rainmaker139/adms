import OrganizationExplorer from '../../components/admin/OrganizationExplorer'
import { useAdmin } from '../../state/useAdmin'
import { businessRoleLabels } from '../../data/seed'
import { useState } from 'react'
import type { Organization } from '../../types/platform'
import { descendantIds } from '../../access/policy'
import { newId } from '../../state/platformStore'
import { DetailList, PageHeader } from '../../components/common/ui'
import KpiCard from '../../components/KpiCard'
import { Active, Editor, Field, Check } from '../../components/admin/AdminUI'

export default function OrganizationsPage() {
  const { data, save, feedback } = useAdmin()
  const [selectedId, setSelectedId] = useState('assn-org')
  const [draft, setDraft] = useState<Organization | null>(null)
  const selected = data.organizations.find(o => o.id === selectedId)!
  const children = descendantIds(selectedId, data); children.delete(selectedId)
  const linked = data.businessOrganizations.filter(m => m.organizationId === selectedId)
  function create(parentId: string | null) { setDraft({ id: newId('org'), code: '', name: '', type: '기관', parentId, contactName: '', phone: '', active: true }) }
  return <><PageHeader eyebrow="ORGANIZATION MASTER" title="조직 관리" description="사업과 독립된 조직 마스터입니다. 회원사와 점포는 각각 별도 객체로 연결합니다." actions={<button className="button primary" onClick={() => create(null)}>조직 추가</button>} />{feedback}
    <div className="kpi-grid"><KpiCard label="전체 조직" value={`${data.organizations.length}개`} hint="플랫폼 전역" /><KpiCard label="활성 조직" value={`${data.organizations.filter(o => o.active).length}개`} hint="조직 자체 상태 기준" /><KpiCard label="회원사 / 점포" value={`${data.companies.length} / ${data.stores.length}`} hint="독립된 마스터 객체" /></div>
    <div className="admin-split organization-workspace"><OrganizationExplorer items={data.organizations} selectedId={selectedId} onSelect={setSelectedId} /><section className="panel admin-detail"><div className="section-heading"><h2>{selected.name}</h2><Active value={selected.active} /></div><DetailList items={[
      { label: '조직코드', value: selected.code }, { label: '조직유형', value: selected.type }, { label: '상위조직', value: data.organizations.find(o => o.id === selected.parentId)?.name ?? '최상위' }, { label: '대표/담당자', value: selected.contactName || '미등록' }, { label: '연락처', value: selected.phone || '미등록' }, { label: '하위조직 수', value: children.size }, { label: '관리자 계정 수', value: data.accounts.filter(a => a.organizationId === selected.id).length }, { label: '연결된 사업', value: linked.length ? linked.map(m => <div key={`${m.businessId}:${m.role}`}>{data.businesses.find(b => b.id === m.businessId)?.name} · {businessRoleLabels[m.role]}</div>) : '연결 없음' },
    ]} /><div className="admin-actions"><button className="button secondary" onClick={() => setDraft({ ...selected })}>조직 수정</button><button className="button secondary" onClick={() => create(selected.id)}>하위조직 추가</button></div><p className="muted">사용중지는 수정 화면에서 처리합니다. 하위조직과 이력은 보존되며 비활성 조직과 그 하위 소속 계정의 로그인이 제한됩니다.</p></section></div>
    {draft && <Editor title={data.organizations.some(o => o.id === draft.id) ? '조직 수정' : '조직 등록'} onClose={() => setDraft(null)} onSave={() => { const error = save({ type: 'organization', value: draft }); if (!error) setSelectedId(draft.id); return error }}>
      <Field label="조직명"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="조직코드"><input required value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value })} /></Field>
      <Field label="조직유형"><input required list="organization-types" value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} /><datalist id="organization-types">{['기관', '공공기관', '기업', '협회', '지회', '회원사', '점포'].map(t => <option key={t}>{t}</option>)}</datalist></Field>
      <Field label="상위조직"><select value={draft.parentId ?? ''} onChange={e => setDraft({ ...draft, parentId: e.target.value || null })}><option value="">최상위</option>{data.organizations.filter(o => !descendantIds(draft.id, data).has(o.id)).map(o => <option value={o.id} key={o.id}>{o.name}</option>)}</select></Field>
      <Field label="대표/담당자"><input value={draft.contactName ?? ''} onChange={e => setDraft({ ...draft, contactName: e.target.value })} /></Field><Field label="연락처"><input value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></Field><Check label="사용 활성" checked={draft.active} onChange={active => setDraft({ ...draft, active })} />
      {!draft.active && <p className="notice-box">참조 데이터는 삭제되지 않습니다. 하위 소속 계정도 로그인이 제한됩니다.</p>}
    </Editor>}
  </>
}
