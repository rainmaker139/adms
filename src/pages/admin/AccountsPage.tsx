import { useAdmin } from '../../state/useAdmin'
import { useState } from 'react'
import type { Account } from '../../types/platform'
import { statuses } from '../../types/status'
import { descendantIds } from '../../access/policy'
import { newId } from '../../state/platformStore'
import { Active, AdminList, Check, Editor, Field } from '../../components/admin/AdminUI'
import KpiCard from '../../components/KpiCard'

export default function AccountsPage() {
  const { data, save, feedback } = useAdmin()
  const [draft, setDraft] = useState<Account | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [status, setStatus] = useState('all')
  const old = data.accounts.find(a => a.id === draft?.id)
  const role = data.roles.find(r => r.id === draft?.roleId)
  const company = data.companies.find(c => draft && descendantIds(c.organizationId, data).has(draft.organizationId))
  const ownerWarning = old?.roleId === 'martOwner' && draft && (draft.status !== 'active' || draft.roleId !== old.roleId || draft.organizationId !== old.organizationId)
  const edit = (a: Account) => { setConfirmed(false); setDraft({ ...a }) }
  return <>{feedback}<AdminList title="관리자 계정 관리" description="소속조직·Role·점포 접근범위를 연결합니다. 모든 시연 계정의 비밀번호는 1234입니다." rows={data.accounts.filter(a => status === 'all' || a.status === status)} rowKey={a => a.id} searchText={a => `${a.name} ${a.loginId} ${data.organizations.find(o => o.id === a.organizationId)?.name}`} onCreate={() => edit({ id: newId('account'), loginId: '', name: '', organizationId: 'assn-org', roleId: 'association', status: 'pending', storeAccess: 'organization', phone: '' })} extraFilter={<Field label="계정 상태"><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">전체</option>{Object.entries(statuses.account).filter(([key]) => key !== 'deletable').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>} columns={[
      { key: 'name', label: '이름 / ID', render: a => <button className="text-button" onClick={() => edit(a)}>{a.name}<small className="cell-sub">{a.loginId}</small></button> }, { key: 'org', label: '소속조직', render: a => data.organizations.find(o => o.id === a.organizationId)?.name }, { key: 'role', label: 'Role', render: a => data.roles.find(r => r.id === a.roleId)?.name }, { key: 'stores', label: '접근 점포', render: a => Array.isArray(a.storeAccess) ? a.storeAccess.map(id => data.stores.find(s => s.id === id)?.name).join(', ') : a.storeAccess === 'company' ? '회원사 전체' : '조직 범위' }, { key: 'status', label: '상태', render: a => statuses.account[a.status] }, { key: 'login', label: '최근 로그인', render: a => a.lastLogin ?? '로그인 이력 없음' },
    ]} /><div className="kpi-grid admin-kpis"><KpiCard label="전체 계정" value={`${data.accounts.length}`} /><KpiCard label="정상" value={`${data.accounts.filter(a => a.status === 'active').length}`} /><KpiCard label="승인대기" value={`${data.accounts.filter(a => a.status === 'pending').length}`} /></div>
    {draft && <Editor title={old ? '계정 수정' : '계정 등록'} onClose={() => setDraft(null)} onSave={() => save({ type: 'account', value: draft, confirmed })}>
      <Field label="이름"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="ID"><input required value={draft.loginId} onChange={e => setDraft({ ...draft, loginId: e.target.value })} /></Field><Field label="연락처"><input value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></Field>
      <Field label="소속조직"><select value={draft.organizationId} onChange={e => setDraft({ ...draft, organizationId: e.target.value, storeAccess: role?.family === 'mart' ? [] : 'organization' })}>{data.organizations.map(o => <option value={o.id} key={o.id}>{o.name}{!o.active && ' (비활성)'}</option>)}</select></Field>
      <Field label="Role"><select value={draft.roleId} onChange={e => { const r = data.roles.find(r => r.id === e.target.value)!; setDraft({ ...draft, roleId: r.id, storeAccess: r.family === 'mart' ? (r.scope === 'company' ? 'company' : []) : 'organization' }) }}>{data.roles.filter(r => r.active !== false || r.id === draft.roleId).map(r => <option value={r.id} key={r.id}>{r.name}</option>)}</select></Field>
      <Field label="상태"><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Account['status'] })}>{Object.entries(statuses.account).filter(([key]) => key !== 'deletable').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      {role?.family === 'mart' && <fieldset className="full-width"><legend>점포 접근범위</legend>{role.scope === 'company' && <Check label="회원사 전체 점포" checked={draft.storeAccess === 'company'} onChange={checked => setDraft({ ...draft, storeAccess: checked ? 'company' : [] })} />}{Array.isArray(draft.storeAccess) && data.stores.filter(s => s.companyId === company?.id).map(s => <Check key={s.id} label={s.name} checked={draft.storeAccess.includes(s.id)} onChange={checked => setDraft({ ...draft, storeAccess: checked ? [...draft.storeAccess as string[], s.id] : (draft.storeAccess as string[]).filter(id => id !== s.id) })} />)}{!company && <p>회원사 또는 회원사 하위 소속조직을 선택해 주세요.</p>}</fieldset>}
      {ownerWarning && <div className="notice-box full-width"><p>대표 관리자의 상태·소속·Role을 변경하면 회원사의 대표 운영 권한이 사라질 수 있습니다. 후임 대표를 확인해 주세요.</p><Check label="대표 관리자 변경 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}
      <div className="full-width muted">비활성은 논리삭제입니다. 계정과 기존 이력을 보존하며 정상 상태로 복구할 수 있습니다. <Active value={draft.status === 'active'} /></div>
    </Editor>}
  </>
}
