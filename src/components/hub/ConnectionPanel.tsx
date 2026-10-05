import { useState } from 'react'
import type { HubCommand, StoreConnection } from '../../types/hub'
import { useHub } from '../../state/useHub'
import { connectionFields, stepLabels, stepOrder } from '../../data/hubCatalog'
import { interfaceCapabilities, interfaceFields, interfaceIssue, liveCapabilities } from '../../state/hubStore'
import { statuses } from '../../types/status'
import { Check, Editor, Field } from '../admin/AdminUI'
import { DataTable, DetailList, StatusBadge } from '../common/ui'
import { HubLinks, TestBadge } from './HubUI'

export default function ConnectionPanel({ storeId }: { storeId: string }) {
  const { hub, data, save, feedback } = useHub()
  const store = data.stores.find(s => s.id === storeId)!
  const connection = hub.connections.find(c => c.storeId === storeId)!
  const pos = hub.poses.find(p => p.id === connection.posId)
  const iface = hub.interfaces.find(i => i.id === connection.interfaceId)
  const [editing, setEditing] = useState(false)
  const [scenario, setScenario] = useState('success')
  const enabled = iface ? interfaceCapabilities(hub, iface) : []
  const allValid = stepOrder.every(step => connection.steps[step].status === 'success') && enabled.every(c => connection.capabilityResults[c.id]?.status === 'success') && enabled.length > 0
  const issue = iface ? interfaceIssue(hub, iface) : 'Interface를 선택하고 접속정보를 저장해 주세요.'
  const recent = hub.runs.filter(r => r.storeId === storeId)
  return <section className="panel admin-detail admin-section">{feedback}<div className="section-heading"><h2>{store.name}</h2><StatusBadge tone={connection.status === 'active' ? 'success' : connection.status === 'error' ? 'warning' : 'neutral'}>{statuses.posConnection[connection.status]}</StatusBadge></div><DetailList items={[{ label: '회원사', value: data.companies.find(c => c.id === store.companyId)?.legalName }, { label: 'POS / Interface', value: `${pos?.name ?? '미지정'} / ${iface?.name ?? '미설정'}` }, { label: '마지막 데이터 수신', value: connection.lastReceived ? new Date(connection.lastReceived).toLocaleString('ko-KR') : '없음' }, { label: '최근 오류', value: connection.lastError || '없음' }, { label: '실행 가능한 기능', value: liveCapabilities(hub, connection).map(c => c.name).join(', ') || '검증·활성화 전에는 사용 불가' }, { label: '접속정보', value: Object.entries(connection.config).map(([key, value]) => `${iface ? connectionFields[iface.method].find(f => f.key === key)?.label ?? key : key}: ${value || '미입력'}`).join(' / ') || '미설정' }, { label: '인증정보', value: Object.entries(connection.secretSet).map(([key, value]) => `${key}: ${value ? '•••••••• (설정됨)' : '미설정'}`).join(' / ') || '미설정' }]} />
    <div className="admin-actions"><button className="button primary" onClick={() => setEditing(true)}>연결 설정</button><button className="button secondary" disabled={!iface || !!issue} onClick={() => save({ kind: 'reset', storeId })}>재연결 / 재검증</button><button className="button secondary" disabled={connection.status === 'stopped'} onClick={() => save({ kind: 'stop', storeId })}>연동 중지</button><button className="button secondary" disabled={connection.status !== 'active'} onClick={() => save({ kind: 'collect', storeId })}>Mock 데이터 수집</button></div>
    {issue && <p className="notice-box">{issue}</p>}<div className="hub-controls"><Field label="Mock 검증 시나리오"><select value={scenario} onChange={e => setScenario(e.target.value)}><option value="success">정상 응답</option><option value="connection">연결 실패</option><option value="identity">점포 식별 불일치</option><option value="sample">Sample 수신 실패</option><option value="sales">판매실적 데이터 실패</option></select></Field></div>
    <ol className="hub-steps"><li className="hub-step"><span className="hub-step-number">1</span><div><strong>접속정보 입력</strong><p>{connection.status === 'unset' ? 'POS 지정과 실제 접속정보는 별도입니다.' : '설정 저장 후 연결 검증을 진행합니다.'}</p></div><button className="button secondary" onClick={() => setEditing(true)}>설정</button></li>{stepOrder.map((step, index) => <li className="hub-step" key={step}><span className="hub-step-number">{index + 2}</span><div><strong>{stepLabels[step]} <TestBadge state={connection.steps[step].status} /></strong><p>{connection.steps[step].message}</p></div><button className="button secondary" disabled={!!issue || connection.status === 'stopped' || stepOrder.slice(0, index).some(s => connection.steps[s].status !== 'success')} onClick={() => save({ kind: 'step', storeId, step, simulate: scenario === 'success' ? undefined : scenario as Extract<HubCommand, { kind: 'step' }>['simulate'] })}>{stepLabels[step]} 실행</button></li>)}<li className="hub-step"><span className="hub-step-number">7</span><div><strong>연동 활성화</strong><p>선택 Interface의 필수 검증이 완료되어야 정상 연동으로 전환합니다.</p></div><button className="button primary" disabled={!!issue || !allValid || connection.status === 'active' || connection.status === 'stopped'} onClick={() => save({ kind: 'activate', storeId })}>연동 활성화</button></li></ol>
    <div className="section-heading"><h2>Capability별 검증 결과</h2><span>{enabled.length}개 기능</span></div><DataTable caption="Capability 데이터 검증" rows={enabled} rowKey={c => c.id} columns={[{ key: 'name', label: 'Capability', render: c => c.name }, { key: 'field', label: '요구 Field', render: c => c.fieldIds.length }, { key: 'state', label: '결과', render: c => <TestBadge state={connection.capabilityResults[c.id]?.status ?? 'waiting'} /> }, { key: 'message', label: '내용', render: c => <span className="hub-wrap">{connection.capabilityResults[c.id]?.message ?? '검증 대기'}</span> }]} />
    {iface && connection.steps.sample.status === 'success' && <details className="hub-sample"><summary>수신 Sample Field 확인 ({interfaceFields(hub, iface).length}개 요구)</summary><DataTable caption="내장 Sample 데이터" rows={hub.sources[iface.id] ?? []} rowKey={s => s.name} columns={[{ key: 'source', label: '원천 Field', render: s => <code>{s.name}</code> }, { key: 'type', label: '타입', render: s => s.type }, { key: 'value', label: 'Sample', render: s => s.sample || '(빈 값)' }]} /></details>}
    <h2 className="hub-subheading">최근 수집·검증 이력</h2><DataTable caption="점포 최근 연동 이력" rows={recent.slice(0, 12)} rowKey={r => r.id} columns={[{ key: 'at', label: '시각', render: r => new Date(r.at).toLocaleString('ko-KR') }, { key: 'action', label: '작업', render: r => r.action }, { key: 'result', label: '결과', render: r => r.result === 'info' ? '정보' : <TestBadge state={r.result} /> }, { key: 'message', label: '내용 / 건수', render: r => <span className="hub-wrap">{r.message}{r.count > 0 && ` · ${r.count}건`}</span> }]} /><HubLinks posId={pos?.id} interfaceId={iface?.id} storeId={storeId} />
    {editing && <ConnectionEditor connection={connection} onClose={() => setEditing(false)} save={save} />}
  </section>
}
function ConnectionEditor({ connection, onClose, save }: { connection: StoreConnection; onClose: () => void; save: ReturnType<typeof useHub>['save'] }) {
  const { hub } = useHub()
  const [posId, setPosId] = useState(connection.posId ?? hub.poses.find(p => p.active)?.id ?? '')
  const [interfaceId, setInterfaceId] = useState(connection.interfaceId ?? '')
  const [config, setConfig] = useState(connection.config)
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [confirmed, setConfirmed] = useState(false)
  const iface = hub.interfaces.find(i => i.id === interfaceId)
  const same = posId === connection.posId && interfaceId === connection.interfaceId
  const fields = iface ? connectionFields[iface.method] : []
  function changeInterface(id: string) { setInterfaceId(id); setConfig(id === connection.interfaceId && posId === connection.posId ? connection.config : {}); setSecrets({}) }
  const fillSamples = () => { setConfig(Object.fromEntries(fields.filter(f => !f.secret).map(f => [f.key, f.key === 'storeCode' ? `DEMO-${connection.storeId.toUpperCase()}` : f.example]))); setSecrets(Object.fromEntries(fields.filter(f => f.secret).map(f => [f.key, 'mock-only-1234']))) }
  return <Editor title="점포 연결 설정" onClose={onClose} onSave={() => save({ kind: 'connection', storeId: connection.storeId, posId, interfaceId: interfaceId || null, config, replaceSecrets: Object.keys(secrets).filter(key => secrets[key].trim()), confirmed })}>
    <Field label="사용 POS"><select value={posId} onChange={e => { setPosId(e.target.value); setInterfaceId(''); setConfig({}); setSecrets({}) }}>{hub.poses.map(p => <option key={p.id} value={p.id} disabled={!p.active}>{p.name}{!p.active && ' · 비활성'}</option>)}</select></Field><Field label="연결 Interface"><select value={interfaceId} onChange={e => changeInterface(e.target.value)}><option value="">미설정 · POS 종류만 지정</option>{hub.interfaces.filter(i => i.posId === posId).map(i => <option key={i.id} value={i.id} disabled={!!interfaceIssue(hub, i)}>{i.name}{interfaceIssue(hub, i) ? ' · 사용 불가' : ''}</option>)}</select></Field>
    {iface && <div className="full-width"><p className="muted">{iface.method} / {iface.direction} · 지원 {interfaceCapabilities(hub, iface).map(c => c.name).join(', ')}</p><button type="button" className="button secondary" onClick={fillSamples}>시연값 채우기</button></div>}
    {fields.map(f => <Field key={f.key} label={f.label}><input type={f.secret ? 'password' : 'text'} autoComplete="off" value={f.secret ? secrets[f.key] ?? '' : config[f.key] ?? ''} placeholder={f.secret && same && connection.secretSet[f.key] ? '•••••••• 설정됨 · 입력 시 교체' : f.example} onChange={e => f.secret ? setSecrets({ ...secrets, [f.key]: e.target.value }) : setConfig({ ...config, [f.key]: e.target.value })} /><span className="muted">{f.required ? '연결 테스트 필수' : '선택'}{f.secret && ' · 원문 저장/재표시 없음'}</span></Field>)}
    {connection.status !== 'unset' && <div className="notice-box full-width">POS·Interface·접속정보 변경 시 기존 검증 결과가 초기화되고 업무 실행이 제한됩니다. 수집·검증 이력은 유지합니다.<Check label="접속정보 변경과 재검증을 확인했습니다" checked={confirmed} onChange={setConfirmed} /></div>}
    <p className="muted full-width">입력정보는 Mock입니다. 실제 API/DB 연결은 실행하지 않습니다. 빈 필드가 있으면 설정중으로 저장하고 연결 테스트에서 누락을 표시합니다.</p>
  </Editor>
}
