import { useState } from 'react'
import { useHub } from '../../state/useHub'
import { mappingLabels, schemaFields, schemaNames } from '../../data/hubCatalog'
import { interfaceFields, interfaceIssue, mappingProblems } from '../../state/hubStore'
import type { FieldMapping } from '../../types/hub'
import { Check, Editor, Field } from '../../components/admin/AdminUI'
import { HubLinks, InterfaceSelect, PosSelect } from '../../components/hub/HubUI'
import { DataTable, PageHeader, StatusBadge } from '../../components/common/ui'

export default function MappingPage() {
  const { hub, pos, interfaces, iface, select, params, save, feedback } = useHub()
  const [draft, setDraft] = useState<FieldMapping | null>(null)
  const [codes, setCodes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [preserved, setPreserved] = useState(false)
  const [autoConfirmed, setAutoConfirmed] = useState(false)
  const schema = params.get('schema') ?? 'SaleTransaction'
  const active = new Set(iface ? interfaceFields(hub, iface).map(f => f.id) : [])
  const fields = schemaFields.filter(f => (schema === 'all' || f.schema === schema) && (preserved || active.has(f.id)))
  const problems = iface ? mappingProblems(hub, iface) : []
  const mappingOf = (fieldId: string): FieldMapping => hub.mappings.find(m => m.interfaceId === iface?.id && m.fieldId === fieldId) ?? { interfaceId: iface?.id ?? '', fieldId, source: '', rule: 'identity', codes: {}, status: 'unmapped', message: '아직 미설정' }
  const field = schemaFields.find(f => f.id === draft?.fieldId)
  const source = hub.sources[draft?.interfaceId ?? '']?.find(s => s.name === draft?.source)
  function edit(fieldId: string) { const m = mappingOf(fieldId); setDraft({ ...m }); setCodes(Object.entries(m.codes).map(([a, b]) => `${a}=${b}`).join('\n')); setConfirmed(false) }
  return <><PageHeader eyebrow="SOURCE → STANDARD" title="필드·코드 매핑" description="Interface별 원천 Field를 ADMS 표준으로 연결합니다. 저장 후 Sample 검증을 거쳐 완료 상태로 전환합니다." />{feedback}<div className="hub-controls"><PosSelect hub={hub} value={pos.id} onChange={id => select('pos', id)} /><InterfaceSelect items={interfaces} value={iface?.id} onChange={id => select('interface', id)} /><Field label="Schema 필터"><select value={schema} onChange={e => select('schema', e.target.value)}><option value="all">모든 Schema</option>{schemaNames.map(name => <option key={name}>{name}</option>)}</select></Field><Check label="비활성/보존 Field 포함" checked={preserved} onChange={setPreserved} /></div>
    {iface ? <><p className="muted">{iface.name} · {iface.method} · {interfaceIssue(hub, iface) || '활성 프로파일'}</p><div className="notice-box">필수 미매핑/검증 대기/오류 {problems.length}건{problems.length > 0 && <ul className="hub-warning-list">{problems.slice(0, 6).map(p => <li key={p}>{p}</li>)}{problems.length > 6 && <li>외 {problems.length - 6}건</li>}</ul>}</div><section className="panel admin-section"><DataTable caption="Field Mapping 목록" rows={fields} rowKey={f => f.id} columns={[
      { key: 'standard', label: 'ADMS 표준 Field', render: f => <button className="text-button" onClick={() => edit(f.id)}><code>{f.name}</code><span className="cell-sub">{f.schema} · {f.label}</span></button> }, { key: 'source', label: 'POS 원천 Field', render: f => mappingOf(f.id).source || '미매핑' }, { key: 'sample', label: '타입 / Sample', render: f => { const s = hub.sources[iface.id]?.find(s => s.name === mappingOf(f.id).source); return s ? <>{s.type}<span className="cell-sub">{s.sample || '(빈 값)'}</span></> : '—' } }, { key: 'req', label: '요구', render: f => !active.has(f.id) ? <StatusBadge>비활성 · 보존</StatusBadge> : f.required ? <StatusBadge tone="warning">필수</StatusBadge> : <StatusBadge>선택</StatusBadge> }, { key: 'status', label: 'Mapping 상태', render: f => <><StatusBadge tone={mappingOf(f.id).status === 'complete' ? 'success' : 'warning'}>{mappingLabels[mappingOf(f.id).status]}</StatusBadge><span className="cell-sub hub-wrap">{mappingOf(f.id).message}</span></> }, { key: 'rule', label: '변환 규칙', render: f => mappingOf(f.id).rule === 'codes' ? Object.entries(mappingOf(f.id).codes).map(([a, b]) => `${a} → ${b}`).join(', ') : mappingOf(f.id).rule },
    ]} /></section><div className="admin-actions"><button className="button primary" onClick={() => save({ kind: 'validateMappings', interfaceId: iface.id })}>매핑 검증</button><button className="button secondary" onClick={() => save({ kind: 'autoMap', interfaceId: iface.id, confirmed: autoConfirmed })}>원천명 기반 가매핑</button>{hub.connections.some(c => c.interfaceId === iface.id && c.status === 'active') && <Check label="가매핑 적용 후 점포 재검증에 동의" checked={autoConfirmed} onChange={setAutoConfirmed} />}</div><p className="muted">가매핑은 미매핑 Field만 채우며 기존 연결을 덮어쓰지 않습니다. Capability OFF 시 Mapping을 삭제하지 않고 비활성 요구로 보존합니다.</p><HubLinks posId={pos.id} interfaceId={iface.id} /></> : <p className="notice-box">Interface를 먼저 등록해 주세요.</p>}
    {draft && field && <Editor title={`${field.schema}.${field.name} 매핑`} onClose={() => setDraft(null)} onSave={() => {
      const pairs = codes.split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('=').map(s => s.trim()))
      if (draft.rule === 'codes' && (pairs.some(p => p.length !== 2 || !p[0] || !p[1]) || new Set(pairs.map(p => p[0])).size !== pairs.length)) return '코드값은 중복 없이 원천=표준 형식으로 입력해 주세요.'
      return save({ kind: 'mapping', value: { ...draft, codes: Object.fromEntries(pairs) }, confirmed })
    }}><Field label="POS 원천 Field"><select value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })}><option value="">미매핑</option>{hub.sources[draft.interfaceId]?.map(s => <option key={s.name} value={s.name}>{s.name} ({s.type})</option>)}</select></Field><Field label="변환 규칙"><select value={draft.rule} onChange={e => setDraft({ ...draft, rule: e.target.value as FieldMapping['rule'] })}><option value="identity">그대로 사용</option><option value="number">숫자로 변환</option><option value="string">문자로 변환</option><option value="codes">코드값 Mapping</option></select></Field><p className="muted full-width">표준 {field.type} · {field.required ? '필수' : '선택'} · 원천 Sample: {source?.sample || '(빈 값)'}</p>{draft.rule === 'codes' && <Field label="코드값 변환 (한 줄에 원천=표준)"><textarea value={codes} onChange={e => setCodes(e.target.value)} placeholder={'0=NORMAL\n1=CANCEL\n2=RETURN'} /></Field>}{hub.connections.some(c => c.interfaceId === draft.interfaceId && c.status === 'active') && <div className="notice-box full-width">정상 연동 점포도 재검증 대상이 됩니다.<Check label="Mapping 변경 영향을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}</Editor>}
  </>
}
