import { useAdmin } from '../../state/useAdmin'
import { useState } from 'react'
import type { Action, Permission, Role } from '../../types/platform'
import { actionLabels, basicActions } from '../../data/seed'
import { newId } from '../../state/platformStore'
import { PageHeader, StatusBadge } from '../../components/common/ui'
import { Active, Check, Editor, Field } from '../../components/admin/AdminUI'

const templates: { label: string; family: Role['family']; scope: Role['scope'] }[] = [
  { label: '사업 전체', family: 'at', scope: 'business' }, { label: '운영조직 및 하위', family: 'association', scope: 'organization' }, { label: '지회 및 하위', family: 'branch', scope: 'organization' }, { label: '회원사 전체', family: 'mart', scope: 'company' }, { label: '지정 점포', family: 'mart', scope: 'stores' },
]
export default function PermissionsPage() {
  const { data, save, feedback } = useAdmin()
  const [selected, setSelected] = useState('system')
  const [draft, setDraft] = useState<Role | null>(null)
  const [grants, setGrants] = useState<Permission[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const role = data.roles.find(r => r.id === selected)!
  const current = grants ?? data.permissions.filter(p => p.roleId === selected)
  const protectedRole = selected === 'system'
  const groups = [...new Set(data.programs.map(p => p.group))]
  const checked = (id: string, action: Action) => protectedRole || !!current.find(p => p.programId === id)?.actions.includes(action)
  function toggle(id: string, action: Action, on: boolean) {
    const grant = current.find(p => p.programId === id) ?? { roleId: selected, programId: id, actions: [] }
    let actions = on ? [...new Set([...grant.actions, action, 'view' as Action])] : grant.actions.filter(a => a !== action)
    if (action === 'view' && !on) actions = []
    setGrants([...current.filter(p => p.programId !== id), { ...grant, actions }]); setError('')
  }
  const sorted = (parentId: string | null, group: string, depth = 0): { id: string; depth: number }[] => data.programs.filter(p => (p.parentId ?? null) === parentId && (parentId || p.group === group)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).flatMap(p => [{ id: p.id, depth }, ...sorted(p.id, group, depth + 1)])
  return <><PageHeader eyebrow="ACCESS CONTROL" title="권한 관리" description="프로그램별 Action과 데이터 범위를 결합합니다. 저장 즉시 메뉴 접근권한에 반영됩니다." actions={<button className="button primary" onClick={() => setDraft({ id: newId('role'), name: '', family: 'association', scope: 'organization', active: true })}>Role 생성</button>} />{feedback}
    <div className="admin-split"><section className="panel role-list"><h2>Role 목록</h2>{data.roles.map(r => <button className={selected === r.id ? 'selected' : ''} key={r.id} disabled={!!grants && selected !== r.id} onClick={() => { setSelected(r.id); setGrants(null); setError('') }}><strong>{r.name}</strong><small>{r.id === 'system' ? '보호된 기본 Role' : r.active === false ? '비활성' : templates.find(t => t.family === r.family && t.scope === r.scope)?.label}</small></button>)}</section>
    <section className="panel admin-detail"><div className="section-heading"><h2>{role.name}</h2><Active value={role.active !== false} /></div><div className="admin-actions">{!protectedRole && <button className="button secondary" onClick={() => setDraft({ ...role })}>Role 수정</button>}<button className="button primary" disabled={protectedRole || !grants} onClick={() => { const result = save({ type: 'permissions', roleId: selected, values: current }); setError(result ?? ''); if (!result) setGrants(null) }}>권한 저장</button>{grants && <button className="button secondary" onClick={() => setGrants(null)}>변경 취소</button>}</div>
      {protectedRole ? <p className="notice-box">시스템 관리자 Role은 전체 메뉴·Action을 보유합니다. 기본 Role 삭제와 핵심 권한 해제는 제한됩니다.</p> : <p className="muted">삭제 권한은 비활성화 처리 권한입니다. 전역 마스터 변경은 시스템 관리자 전용이며, 업무별 특수 Action은 해당 메뉴에만 표시합니다.</p>}
      {grants && <p role="status">저장하지 않은 변경사항이 있습니다. 저장 또는 취소 후 다른 Role을 선택하세요.</p>}{error && <p role="alert" className="form-error">{error}</p>}
      <Field label="프로그램 검색"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="프로그램명 또는 코드" /></Field>
      <div className="table-scroll"><table className="permission-matrix"><caption className="sr-only">Role 권한 Matrix</caption><thead><tr><th>프로그램 / 메뉴</th>{basicActions.map(a => <th key={a}>{actionLabels[a]}</th>)}<th>상세 업무 권한</th></tr></thead><tbody>{groups.map(group => {
        const rows = sorted(null, group).filter(row => { const p = data.programs.find(p => p.id === row.id)!; return `${p.name} ${p.code}`.includes(filter.trim()) })
        return rows.length ? <GroupRows key={group} title={group}>{rows.map(row => { const p = data.programs.find(p => p.id === row.id)!; const actions = p.actions ?? basicActions; return <tr key={p.id}><th scope="row" style={{ paddingLeft: `${16 + row.depth * 18}px` }}>{row.depth > 0 && '↳ '}{p.name}{!p.active && <StatusBadge>중지</StatusBadge>}<small className="cell-sub">{p.code}</small></th>{basicActions.map(a => <td key={a}>{actions.includes(a) ? <input aria-label={`${p.name} ${actionLabels[a]}`} type="checkbox" checked={checked(p.id, a)} disabled={protectedRole || (p.scope === 'platform' && a !== 'view')} onChange={e => toggle(p.id, a, e.target.checked)} /> : '—'}</td>)}<td>{actions.filter(a => !basicActions.includes(a)).map(a => <Check key={a} label={actionLabels[a]} checked={checked(p.id, a)} disabled={protectedRole} onChange={on => toggle(p.id, a, on)} />)}</td></tr> })}</GroupRows> : null
      })}</tbody></table></div>
    </section></div>
    {draft && <Editor title={data.roles.some(r => r.id === draft.id) ? 'Role 수정' : 'Role 생성'} onClose={() => setDraft(null)} onSave={() => { const result = save({ type: 'role', value: draft }); if (!result) { setSelected(draft.id); setGrants(null) } return result }}><Field label="Role 이름"><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="데이터 접근범위"><select disabled={data.roles.some(r => r.id === draft.id)} value={`${draft.family}:${draft.scope}`} onChange={e => { const t = templates.find(t => `${t.family}:${t.scope}` === e.target.value)!; setDraft({ ...draft, family: t.family, scope: t.scope }) }}>{templates.map(t => <option key={t.label} value={`${t.family}:${t.scope}`}>{t.label}</option>)}</select></Field><Check label="Role 활성" checked={draft.active !== false} onChange={active => setDraft({ ...draft, active })} />{draft.active === false && <p className="notice-box">배정된 계정은 보존되며, 해당 Role 계정의 로그인이 제한됩니다.</p>}<p className="muted full-width">신규 Role은 권한 없이 생성됩니다. 권한 Matrix에서 조회 및 업무 Action을 부여해 주세요.</p></Editor>}
  </>
}
function GroupRows({ title, children }: { title: string; children: React.ReactNode }) { return <><tr className="matrix-group"><th colSpan={6}>{title}</th></tr>{children}</> }
