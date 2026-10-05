import { useAdmin } from '../../state/useAdmin'
import { useState } from 'react'
import type { Action, Program } from '../../types/platform'
import { actionLabels, basicActions } from '../../data/seed'
import { newId } from '../../state/platformStore'
import { DetailList } from '../../components/common/ui'
import { Active, AdminList, Check, Editor, Field } from '../../components/admin/AdminUI'

const scopeLabels = { platform: '플랫폼 전역', organization: '조직 공통', business: '사업 업무', participation: '사업 신청 안내' }
export default function ProgramsPage({ statusMode = false }: { statusMode?: boolean }) {
  const { data, save, feedback } = useAdmin()
  const [draft, setDraft] = useState<Program | null>(null)
  const [status, setStatus] = useState('all')
  const [confirmed, setConfirmed] = useState(false)
  const old = data.programs.find(p => p.id === draft?.id)
  const edit = (p: Program) => { setDraft({ ...p }); setConfirmed(false) }
  const linked = data.businessPrograms.filter(m => m.programId === draft?.id)
  const granted = data.roles.filter(r => r.id === 'system' || data.permissions.some(p => p.roleId === r.id && p.programId === draft?.id && p.actions.includes('view')))
  return <>{feedback}<AdminList title={statusMode ? '사용·중지' : '메뉴/프로그램 관리'} description="사업과 Role이 공통으로 참조하는 전역 프로그램 마스터입니다. 선택 사업에 따라 목록이 바뀌지 않습니다." rows={[...data.programs].filter(p => status === 'all' || p.active === (status === 'active')).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))} rowKey={p => p.id} searchText={p => `${p.name} ${p.code} ${p.group}`} onCreate={statusMode ? undefined : () => edit({ id: newId('program'), code: '', name: '', parentId: null, group: '농할 운영', scope: 'business', description: '', active: true, order: 1000, actions: [...basicActions] })} extraFilter={<Field label="프로그램 상태"><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">전체</option><option value="active">활성</option><option value="inactive">사용중지</option></select></Field>} columns={[
    { key: 'name', label: '프로그램명', render: p => <button className="text-button" onClick={() => edit(p)}>{p.name}<small className="cell-sub">{p.protected ? '보호된 관리 메뉴' : scopeLabels[p.scope]}</small></button> }, { key: 'code', label: '프로그램 코드', render: p => <code>{p.code}</code> }, { key: 'parent', label: '상위메뉴', render: p => data.programs.find(parent => parent.id === p.parentId)?.name ?? '최상위' }, { key: 'group', label: '업무영역', render: p => p.group }, { key: 'state', label: '사용상태', render: p => <Active value={p.active} /> }, { key: 'order', label: '표시순서', render: p => p.order }, { key: 'actions', label: '기본 Action', render: p => p.actions?.filter(a => basicActions.includes(a)).map(a => actionLabels[a]).join(' · ') },
    ]} />
    {draft && <Editor title={old ? '프로그램 상세/수정' : '프로그램 등록'} onClose={() => setDraft(null)} onSave={() => save({ type: 'program', value: draft, confirmed })}>
      <Field label="프로그램명"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="프로그램 코드"><input required value={draft.code ?? ''} onChange={e => setDraft({ ...draft, code: e.target.value })} /></Field>
      <Field label="적용범위"><select disabled={!!old} value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value as Program['scope'], parentId: null })}>{Object.entries(scopeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="업무영역"><input required value={draft.group} onChange={e => setDraft({ ...draft, group: e.target.value })} list="program-groups" /><datalist id="program-groups">{[...new Set(data.programs.map(p => p.group))].map(g => <option key={g}>{g}</option>)}</datalist></Field>
      <Field label="상위메뉴"><select disabled={draft.protected} value={draft.parentId ?? ''} onChange={e => setDraft({ ...draft, parentId: e.target.value || null })}><option value="">최상위</option>{data.programs.filter(p => p.id !== draft.id && p.scope === draft.scope).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="표시순서"><input type="number" min="0" required value={draft.order} onChange={e => setDraft({ ...draft, order: Number(e.target.value) })} /></Field>
      <Field label="설명"><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></Field><Check label="프로그램 활성" checked={draft.active} disabled={draft.protected} onChange={active => setDraft({ ...draft, active })} />
      <fieldset className="full-width"><legend>지원 Action</legend><div className="program-checks">{(Object.entries(actionLabels) as [Action, string][]).map(([id, label]) => <Check key={id} label={label} checked={draft.actions?.includes(id) ?? false} disabled={id === 'view' || (draft.protected && basicActions.includes(id))} onChange={on => setDraft({ ...draft, actions: on ? [...draft.actions ?? [], id] : draft.actions?.filter(a => a !== id) })} />)}</div></fieldset>
      {old && <div className="full-width"><DetailList items={[{ label: '연결된 사업', value: linked.map(m => data.businesses.find(b => b.id === m.businessId)?.name).join(', ') || '없음' }, { label: '조회 권한 Role', value: granted.map(r => `${r.name}${r.active === false ? ' (비활성)' : ''}`).join(', ') || '없음' }, { label: '직속 하위메뉴', value: data.programs.filter(p => p.parentId === old.id).map(p => p.name).join(', ') || '없음' }]} /></div>}
      {old?.active && !draft.active && <div className="notice-box full-width"><p>사용중지 시 연결된 사업과 Role에서 이 메뉴 및 하위메뉴가 숨겨집니다. 기존 매핑·권한·업무 데이터는 보존됩니다.</p><Check label="프로그램 사용중지 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}
      <p className="muted full-width">새 프로그램의 상세 업무 화면은 준비 상태로 연결됩니다. 프로그램 등록만으로 사업 연결이나 Role 권한이 자동 부여되지는 않습니다.</p>
    </Editor>}
  </>
}
