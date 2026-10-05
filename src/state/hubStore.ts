import { capabilities, connectionFields, schemaFields, stepLabels, stepOrder } from '../data/hubCatalog.ts'
import { emptyConnection, emptySteps } from '../data/hubSeed.ts'
import type { FieldMapping, HubCommand, HubData, PosInterface, StoreConnection } from '../types/hub.ts'
import type { Store } from '../types/platform.ts'

function ensure(value: unknown, message: string): asserts value { if (!value) throw Error(message) }
const id = () => crypto.randomUUID()
export function requirements(ids: string[]) { const fields = new Set(capabilities.filter(c => ids.includes(c.id)).flatMap(c => c.fieldIds)); return schemaFields.filter(f => fields.has(f.id)) }
export function interfaceCapabilities(data: HubData, iface: PosInterface) { const pos = data.poses.find(p => p.id === iface.posId); return capabilities.filter(c => !c.technical && iface.capabilityIds.includes(c.id) && pos?.capabilityIds.includes(c.id)) }
export function interfaceFields(data: HubData, iface: PosInterface) { return requirements(interfaceCapabilities(data, iface).map(c => c.id)) }
export function interfaceIssue(data: HubData, iface: PosInterface): string {
  const pos = data.poses.find(p => p.id === iface.posId)
  if (!pos?.active || !iface.active) return 'POS 또는 Interface가 비활성 상태입니다.'
  if (!pos.capabilityIds.includes(`transport-${iface.method}`)) return `${iface.method} Capability가 비활성 상태입니다.`
  if (!pos.capabilityIds.includes('transport-양방향') && (iface.direction === 'both' || !pos.capabilityIds.includes('transport-단방향'))) return 'Interface 방향에 필요한 Capability가 없습니다.'
  const enabled = interfaceCapabilities(data, iface)
  if (!enabled.length) return 'Interface에 활성 업무 Capability가 없습니다.'
  if (enabled.some(c => c.direction !== iface.direction && iface.direction !== 'both')) return 'Capability와 Interface의 Read/Write 방향이 일치하지 않습니다.'
  return ''
}
export function validateMapping(data: HubData, mapping: FieldMapping): FieldMapping {
  const f = schemaFields.find(f => f.id === mapping.fieldId)
  const source = data.sources[mapping.interfaceId]?.find(s => s.name === mapping.source)
  let message = ''
  if (!mapping.source) return { ...mapping, status: 'unmapped', message: f?.required ? '필수 Field가 매핑되지 않았습니다.' : '선택 Field 미매핑' }
  if (!source || !f) message = '원천 또는 표준 Field를 찾을 수 없습니다.'
  else if (mapping.rule === 'codes' && (!Object.keys(mapping.codes).length || Object.values(mapping.codes).some(v => !['NORMAL', 'CANCEL', 'RETURN'].includes(v)) || !mapping.codes[source.sample])) message = 'Sample 코드와 NORMAL / CANCEL / RETURN 변환을 확인해 주세요.'
  else if (f.required && !source.sample.trim()) message = '필수 Field의 Sample 값이 비어 있습니다.'
  else if (f.type === 'number' && (source.type !== 'number' && mapping.rule !== 'number' || !source.sample.trim() || !Number.isFinite(Number(source.sample)))) message = '숫자 타입 또는 숫자 변환 규칙이 필요합니다.'
  else if (f.type === 'datetime' && Number.isNaN(Date.parse(source.sample))) message = '유효한 날짜/시간 Sample이 필요합니다.'
  else if (f.type === 'enum' && mapping.rule !== 'codes') message = '표준 코드값 Mapping이 필요합니다.'
  else if (f.type === 'string' && source.type !== 'string' && mapping.rule !== 'string') message = '문자 타입 또는 문자 변환 규칙이 필요합니다.'
  else if ((mapping.rule === 'codes' && f.type !== 'enum') || (mapping.rule === 'number' && f.type !== 'number') || (mapping.rule === 'string' && f.type !== 'string')) message = '표준 데이터형과 변환 규칙이 일치하지 않습니다.'
  return { ...mapping, status: message ? 'error' : 'complete', message: message || '내장 Sample 검증 통과' }
}
export function mappingProblems(data: HubData, iface: PosInterface): string[] {
  return interfaceFields(data, iface).flatMap(f => {
    const mapping = data.mappings.find(m => m.interfaceId === iface.id && m.fieldId === f.id)
    if (!mapping?.source && !f.required) return []
    if (!mapping) return [`${f.schema}.${f.name}: 미매핑`]
    const result = validateMapping(data, mapping)
    if (result.status !== 'complete') return [`${f.schema}.${f.name}: ${result.message}`]
    if (mapping.status !== 'complete') return [`${f.schema}.${f.name}: 매핑 검증을 실행해 주세요.`]
    return []
  })
}
export function liveCapabilities(data: HubData, connection: StoreConnection) {
  const iface = data.interfaces.find(i => i.id === connection.interfaceId)
  if (!iface || interfaceIssue(data, iface) || connection.status !== 'active') return []
  return interfaceCapabilities(data, iface).filter(c => connection.capabilityResults[c.id]?.status === 'success')
}
export function hubSnapshot(data: HubData, command: HubCommand): unknown {
  if (command.kind === 'pos') return data.poses.find(p => p.id === command.value.id) ?? null
  if (command.kind === 'capabilities') return data.poses.find(p => p.id === command.posId) ?? null
  if (command.kind === 'interface') return data.interfaces.find(i => i.id === command.value.id) ?? null
  if (command.kind === 'mapping') return data.mappings.find(m => m.interfaceId === command.value.interfaceId && m.fieldId === command.value.fieldId) ?? null
  if (command.kind === 'autoMap' || command.kind === 'validateMappings') return data.mappings.filter(m => m.interfaceId === command.interfaceId)
  return data.connections.find(c => c.storeId === command.storeId) ?? null
}
export function synchronizeHub(data: HubData, stores: Store[]) {
  for (const store of stores) if (!data.connections.some(c => c.storeId === store.id)) data.connections.push(emptyConnection(store.id))
  for (const iface of data.interfaces) {
    for (const f of interfaceFields(data, iface)) if (!data.mappings.some(m => m.interfaceId === iface.id && m.fieldId === f.id)) data.mappings.push({ interfaceId: iface.id, fieldId: f.id, source: '', rule: 'identity', codes: {}, status: 'unmapped', message: 'Capability 요구에 따라 생성된 Mapping 작업' })
  }
}
function log(data: HubData, c: StoreConnection, action: string, result: 'success' | 'failure' | 'info', message: string, count = 0) { data.runs.unshift({ id: id(), storeId: c.storeId, posId: c.posId, interfaceId: c.interfaceId, at: new Date().toISOString(), action, result, message, count, revision: c.revision }) }
function invalidate(data: HubData, filter: (c: StoreConnection) => boolean, message: string, full = false) {
  for (const c of data.connections.filter(filter)) {
    c.revision++; c.capabilityResults = {}
    if (full) c.steps = emptySteps()
    else { c.steps.mapping = { status: 'waiting', message }; c.steps.capabilities = { status: 'waiting', message } }
    if (c.interfaceId && c.status !== 'stopped') c.status = full ? 'configuring' : 'validating'
    c.lastError = message; log(data, c, '설정 변경 · 재검증 필요', 'info', message)
  }
}
export function applyHubCommand(source: HubData, command: HubCommand, stores: Store[]): HubData {
  const data = structuredClone(source)
  synchronizeHub(data, stores)
  if (command.kind === 'pos') {
    const v = { ...command.value, code: command.value.code.trim(), name: command.value.name.trim() }
    const old = data.poses.find(p => p.id === v.id)
    ensure(v.code && v.name && v.company.trim(), '회사명·POS명·POS 코드는 필수입니다.')
    ensure(!data.poses.some(p => p.id !== v.id && p.code.toLowerCase() === v.code.toLowerCase()), '이미 사용 중인 POS 코드입니다.')
    if (old && old.active !== v.active) {
      ensure(command.confirmed || !data.connections.some(c => c.posId === v.id), '점포 사용 상태가 변경됩니다. 영향 확인 후 저장해 주세요.')
      invalidate(data, c => c.posId === v.id, 'POS 활성 상태 변경', true)
      if (!v.active) for (const c of data.connections.filter(c => c.posId === v.id)) c.status = 'stopped'
    }
    // Capability 변경은 전용 명령을 거쳐 요구 필드와 검증을 갱신한다.
    v.capabilityIds = old?.capabilityIds ?? []
    data.poses = old ? data.poses.map(p => p.id === v.id ? v : p) : [...data.poses, v]
  } else if (command.kind === 'capabilities') {
    const pos = data.poses.find(p => p.id === command.posId); ensure(pos, 'POS를 선택해 주세요.')
    ensure(command.ids.every(id => capabilities.some(c => c.id === id)), '알 수 없는 Capability입니다.')
    ensure(command.confirmed || !data.connections.some(c => c.posId === pos.id), '연결된 점포의 재검증이 필요합니다. 영향 확인 후 저장해 주세요.')
    pos.capabilityIds = [...new Set(command.ids)]
    invalidate(data, c => c.posId === pos.id, 'Capability 변경 · 기존 Schema/Mapping 보존', true)
  } else if (command.kind === 'interface') {
    const v = command.value; const old = data.interfaces.find(i => i.id === v.id)
    const pos = data.poses.find(p => p.id === v.posId); ensure(pos && v.name.trim(), 'POS와 Interface명을 입력해 주세요.')
    ensure(v.capabilityIds.length && v.capabilityIds.every(id => capabilities.some(c => c.id === id && !c.technical)), '대상 업무 Capability를 하나 이상 선택해 주세요.')
    ensure(!old || old.posId === v.posId, '기존 Interface의 POS 소속은 변경할 수 없습니다.')
    if (v.active) ensure(!interfaceIssue({ ...data, interfaces: [...data.interfaces.filter(i => i.id !== v.id), v] }, v), interfaceIssue(data, v))
    if (old) {
      ensure(command.confirmed || !data.connections.some(c => c.interfaceId === v.id), 'Interface를 사용하는 점포는 재검증해야 합니다. 영향을 확인해 주세요.')
      invalidate(data, c => c.interfaceId === v.id, 'Interface 프로파일 변경', true)
    }
    data.interfaces = old ? data.interfaces.map(i => i.id === v.id ? v : i) : [...data.interfaces, v]
    if (!data.sources[v.id]) data.sources[v.id] = [...new Map(schemaFields.map(f => [f.source, { name: f.source, type: f.type === 'enum' ? 'string' as const : f.type, sample: f.sample }])).values()]
  } else if (command.kind === 'mapping') {
    const v = command.value
    ensure(data.interfaces.some(i => i.id === v.interfaceId) && schemaFields.some(f => f.id === v.fieldId), 'Interface/Field를 확인해 주세요.')
    ensure(!v.source || data.sources[v.interfaceId]?.some(s => s.name === v.source), '내장 원천 Field를 선택해 주세요.')
    ensure(command.confirmed || !data.connections.some(c => c.interfaceId === v.interfaceId && c.status === 'active'), '정상 연동 점포도 재검증해야 합니다. 영향을 확인해 주세요.')
    const result = { ...v, status: v.source ? 'review' as const : 'unmapped' as const, message: '매핑 저장 후 검증 필요' }
    data.mappings = [...data.mappings.filter(m => !(m.interfaceId === v.interfaceId && m.fieldId === v.fieldId)), result]
    invalidate(data, c => c.interfaceId === v.interfaceId, 'Field/코드 Mapping 변경')
  } else if (command.kind === 'autoMap') {
    const iface = data.interfaces.find(i => i.id === command.interfaceId); ensure(iface, 'Interface를 선택해 주세요.')
    ensure(command.confirmed || !data.connections.some(c => c.interfaceId === iface.id && c.status === 'active'), '정상 연동 점포도 재검증해야 합니다. 영향을 확인해 주세요.')
    const fields = new Set(interfaceFields(data, iface).map(f => f.id))
    data.mappings = data.mappings.map(m => {
      const field = schemaFields.find(f => f.id === m.fieldId)!
      if (m.interfaceId !== iface.id || !fields.has(m.fieldId) || m.source) return m
      return { ...m, source: data.sources[iface.id]?.some(s => s.name === field.source) ? field.source : '', rule: field.type === 'enum' ? 'codes' as const : 'identity' as const, codes: field.type === 'enum' ? { '0': 'NORMAL', '1': 'CANCEL', '2': 'RETURN' } as Record<string, string> : {}, status: 'review' as const, message: '내장 원천명 기반 가매핑 · 검증 필요' }
    })
    invalidate(data, c => c.interfaceId === iface.id, '가매핑 제안 적용 · 검증 필요')
  } else if (command.kind === 'validateMappings') {
    const iface = data.interfaces.find(i => i.id === command.interfaceId); ensure(iface, 'Interface를 선택해 주세요.')
    const fields = new Set(interfaceFields(data, iface).map(f => f.id))
    data.mappings = data.mappings.map(m => m.interfaceId === iface.id && fields.has(m.fieldId) ? validateMapping(data, m) : m)
  } else if (command.kind === 'connection') {
    const c = data.connections.find(c => c.storeId === command.storeId); ensure(c, '점포를 찾을 수 없습니다.')
    ensure(data.poses.some(p => p.id === command.posId && p.active), '활성 POS를 선택해 주세요.')
    const iface = data.interfaces.find(i => i.id === command.interfaceId)
    ensure(!command.interfaceId || (iface && iface.posId === command.posId && !interfaceIssue(data, iface)), '선택 POS의 활성 Interface와 Capability를 확인해 주세요.')
    ensure(command.confirmed || c.status === 'unset', '접속정보를 변경하면 기존 검증이 초기화됩니다. 영향을 확인해 주세요.')
    const same = c.posId === command.posId && c.interfaceId === command.interfaceId
    const allowedFields = iface ? connectionFields[iface.method] : []
    c.config = Object.fromEntries(allowedFields.filter(f => !f.secret).map(f => [f.key, command.config[f.key]?.trim() ?? '']))
    c.secretSet = Object.fromEntries(allowedFields.filter(f => f.secret).map(f => [f.key, (same && !!c.secretSet[f.key]) || command.replaceSecrets.includes(f.key)]))
    c.posId = command.posId; c.interfaceId = command.interfaceId; c.steps = emptySteps(); c.capabilityResults = {}; c.revision++; c.lastError = ''
    const complete = iface && allowedFields.filter(f => f.required).every(f => f.secret ? c.secretSet[f.key] : c.config[f.key])
    c.status = !iface ? 'unset' : complete ? 'pending' : 'configuring'
    log(data, c, '접속정보 저장', 'info', '비밀값 원문은 저장하지 않고 설정 여부만 기록했습니다.')
  } else {
    const c = data.connections.find(c => c.storeId === command.storeId); ensure(c, '점포를 찾을 수 없습니다.')
    const iface = data.interfaces.find(i => i.id === c.interfaceId)
    if (command.kind === 'stop') { c.status = 'stopped'; log(data, c, '연동 중지', 'info', '기존 데이터와 검증 이력을 보존합니다.'); return data }
    ensure(iface && iface.posId === c.posId, 'POS 지정 후 Interface와 접속정보를 저장해 주세요.')
    ensure(!interfaceIssue(data, iface), interfaceIssue(data, iface))
    if (command.kind === 'reset') { c.steps = emptySteps(); c.capabilityResults = {}; c.revision++; c.status = 'pending'; c.lastError = ''; log(data, c, '재연결 / 재검증', 'info', '연결 테스트부터 다시 확인합니다.'); return data }
    ensure(c.status !== 'stopped', '연동 중지 상태입니다. 재연결 후 진행해 주세요.')
    if (command.kind === 'activate' || command.kind === 'collect') {
      ensure(stepOrder.every(s => c.steps[s].status === 'success') && !mappingProblems(data, iface).length && interfaceCapabilities(data, iface).every(cap => c.capabilityResults[cap.id]?.status === 'success'), '연결·점포·Sample·Mapping·모든 Capability 검증을 완료해야 합니다.')
      if (command.kind === 'collect') ensure(c.status === 'active', '정상 연동 점포만 수집할 수 있습니다.')
      c.status = 'active'; c.lastError = ''
      if (command.kind === 'collect') { c.lastReceived = new Date().toISOString(); c.lastCount = 12 }
      log(data, c, command.kind === 'activate' ? '연동 활성화' : 'Mock 데이터 수집', 'success', command.kind === 'activate' ? '필수 검증 완료 · 정상 연동' : '내장 Sample 12건 처리', command.kind === 'collect' ? 12 : 0)
      return data
    }
    ensure(command.kind === 'step', '알 수 없는 검증 명령입니다.')
    const step = command.step; const previous = stepOrder.slice(0, stepOrder.indexOf(step))
    ensure(previous.every(s => c.steps[s].status === 'success'), '앞 단계 검증을 먼저 완료해 주세요.')
    for (const later of stepOrder.slice(stepOrder.indexOf(step))) c.steps[later] = { status: 'waiting', message: '앞 단계 재실행으로 검증 대기' }
    c.capabilityResults = {}; c.status = step === 'connect' ? 'pending' : 'validating'
    let error = ''
    if (step === 'connect') {
      const missing = connectionFields[iface.method].filter(f => f.required && !(f.secret ? c.secretSet[f.key] : c.config[f.key]))
      if (missing.length) error = `접속정보 누락: ${missing.map(f => f.label).join(', ')}`
      if (c.config.port && (!/^\d+$/.test(c.config.port) || Number(c.config.port) < 1 || Number(c.config.port) > 65535)) error = 'Port는 1~65535의 숫자여야 합니다.'
      if (c.config.interval && (!Number.isFinite(Number(c.config.interval)) || Number(c.config.interval) <= 0)) error = '동기화 주기는 양수여야 합니다.'
      if (command.simulate === 'connection') error = 'Mock 연결 시간 초과 · 접속정보/Agent 상태 확인'
    }
    if (step === 'identity' && command.simulate === 'identity') error = 'Mock 응답 점포 코드 불일치'
    if (step === 'sample' && command.simulate === 'sample') error = 'Mock Sample 수신 실패'
    if (step === 'mapping') error = mappingProblems(data, iface).join(' / ')
    if (step === 'capabilities') {
      for (const cap of interfaceCapabilities(data, iface)) {
        let reason = command.simulate === 'sales' && ['sales', 'transaction', 'settlement'].includes(cap.id) ? 'Mock 판매실적 필수 값 누락' : ''
        for (const schema of ['SaleTransaction', 'SettlementTransaction']) {
          if (!cap.fieldIds.some(id => id.startsWith(schema))) continue
          const type = data.mappings.find(m => m.interfaceId === iface.id && m.fieldId === `${schema}.sale_type`)
          const original = data.mappings.find(m => m.interfaceId === iface.id && m.fieldId === `${schema}.original_transaction_id`)
          const rawType = data.sources[iface.id]?.find(s => s.name === type?.source)?.sample ?? ''
          const typeValue = type?.codes[rawType]
          if (['CANCEL', 'RETURN'].includes(typeValue ?? '') && !data.sources[iface.id]?.find(s => s.name === original?.source)?.sample) reason = '취소/반품 거래의 원거래번호가 없습니다.'
        }
        c.capabilityResults[cap.id] = { status: reason ? 'failure' : 'success', message: reason || '내장 Sample 필수 값·데이터형 검증 통과' }
      }
      error = Object.values(c.capabilityResults).filter(r => r.status === 'failure').map(r => r.message).join(' / ')
    }
    c.steps[step] = { status: error ? 'failure' : 'success', message: error || (step === 'identity' ? `점포 코드 ${c.config.storeCode} 확인 · Mock 응답` : step === 'sample' ? '내장 Sample 수신 완료 · 실제 네트워크 요청 없음' : 'Mock 검증 통과') }
    c.lastError = error; c.status = error ? 'error' : step === 'connect' ? 'connected' : 'validating'
    log(data, c, stepLabels[step], error ? 'failure' : 'success', c.steps[step].message)
  }
  synchronizeHub(data, stores)
  return data
}

export function validHub(data: HubData, stores: Store[]): boolean {
  try {
    if (data.version !== 1 || ![data.poses, data.interfaces, data.mappings, data.connections, data.runs].every(Array.isArray)) return false
    return data.poses.every(p => typeof p.name === 'string' && Array.isArray(p.capabilityIds)) && data.interfaces.every(i => data.poses.some(p => p.id === i.posId) && i.method in connectionFields && Array.isArray(i.capabilityIds)) && data.connections.every(c => stores.some(s => s.id === c.storeId) && stepOrder.every(step => c.steps[step]) && c.config && Object.values(c.secretSet).every(v => typeof v === 'boolean'))
  } catch { return false }
}
