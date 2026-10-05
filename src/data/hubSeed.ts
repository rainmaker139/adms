import type { FieldMapping, HubData, PosMaster, StoreConnection } from '../types/hub.ts'
import type { Store } from '../types/platform.ts'
import { capabilities, connectionFields, schemaFields, stepOrder } from './hubCatalog.ts'

export const emptySteps = (): StoreConnection['steps'] => Object.fromEntries(stepOrder.map(id => [id, { status: 'waiting', message: '아직 실행하지 않았습니다.' }])) as StoreConnection['steps']
export const emptyConnection = (storeId: string, posId: string | null = null): StoreConnection => ({ storeId, posId, interfaceId: null, status: 'unset', config: {}, secretSet: {}, steps: emptySteps(), capabilityResults: {}, lastReceived: null, lastCount: 0, lastError: '', revision: 1 })
export function createHubSeed(stores: Store[]): HubData {
  const pos = (id: string, name: string, company: string, capabilityIds: string[], active = true): PosMaster => ({ id, name, code: id.toUpperCase(), company, responsible: '시연 책임자', contact: '시연 담당자', phone: '02-0000-0000', email: 'demo@example.invalid', website: 'example.invalid (정보 표시용)', description: '실제 제품 규격을 나타내지 않는 가상 연동 프로파일입니다.', notes: '실제 지원 기능은 POS사 협의 후 확정', active, capabilityIds })
  const poses = [pos('hipos', '하이포스 (Mock)', '하이포스 예시', ['store', 'product', 'price', 'event', 'event-product', 'sales', 'transaction', 'settlement', 'member-identity', 'batch', 'transport-API', 'transport-Agent', 'transport-단방향']), pos('sample-pos', '기타 POS (Mock)', '샘플 POS사', ['store', 'product', 'price', 'batch', 'transport-DB', 'transport-Excel', 'transport-단방향']), pos('legacy-pos', '이전 POS (Mock)', '이전 공급사', ['store', 'transport-File', 'transport-단방향'], false)]
  const interfaces: HubData['interfaces'] = [
    { id: 'hipos-cloud', posId: 'hipos', name: 'Cloud API (시연)', method: 'API', direction: 'read', capabilityIds: ['store', 'product', 'price', 'event', 'event-product', 'sales', 'transaction', 'settlement', 'member-identity'], active: true, description: '가상 Cloud 수신 프로파일' },
    { id: 'hipos-agent', posId: 'hipos', name: 'Local Agent (시연)', method: 'Agent', direction: 'read', capabilityIds: ['store', 'product', 'event', 'sales'], active: true, description: '판매 지원금 필드 매핑을 보완하는 시연' },
    { id: 'sample-db', posId: 'sample-pos', name: 'Local DB (시연)', method: 'DB', direction: 'read', capabilityIds: ['store', 'product', 'price'], active: true, description: '상품·가격만 수신하는 가상 DB 프로파일' },
    { id: 'sample-excel', posId: 'sample-pos', name: 'Excel (시연)', method: 'Excel', direction: 'read', capabilityIds: ['store', 'product'], active: true, description: '내장 Sample을 사용하는 파일 수신 프로파일' },
  ]
  const data: HubData = { version: 1, poses, interfaces, mappings: [], sources: {}, connections: [], runs: [] }
  for (const item of interfaces) {
    data.sources[item.id] = [...new Map(schemaFields.map(f => [f.source, { name: f.source, type: f.type === 'enum' ? 'string' as const : f.type, sample: f.sample }])).values()]
    // 현재 프로파일 요구만 초기화한다. 추가 활성화 기능의 작업은 synchronizeHub에서 생성한다.
    const required = new Set(capabilities.filter(c => item.capabilityIds.includes(c.id)).flatMap(c => c.fieldIds))
    data.mappings.push(...schemaFields.filter(f => required.has(f.id)).map((f): FieldMapping => ({ interfaceId: item.id, fieldId: f.id, source: item.id === 'hipos-agent' && f.id === 'SaleTransaction.support_amount' ? '' : f.source, rule: f.type === 'enum' ? 'codes' as const : 'identity' as const, codes: f.type === 'enum' ? { '0': 'NORMAL', '1': 'CANCEL', '2': 'RETURN' } : {}, status: item.id === 'hipos-agent' && f.id === 'SaleTransaction.support_amount' ? 'unmapped' as const : 'complete' as const, message: '' })))
  }
  for (const store of stores) {
    const posId = ['main', 'gangseo'].includes(store.id) ? 'hipos' : ['magok', 'saebom-store'].includes(store.id) ? 'sample-pos' : store.posId
    const c = emptyConnection(store.id, posId)
    const iface = interfaces.find(i => i.id === (store.id === 'main' ? 'hipos-cloud' : store.id === 'gangseo' ? 'hipos-agent' : store.id === 'saebom-store' ? 'sample-db' : ''))
    if (iface) {
      c.interfaceId = iface.id
      for (const f of connectionFields[iface.method]) { if (f.secret) c.secretSet[f.key] = true; else c.config[f.key] = f.key === 'storeCode' ? `DEMO-${store.id.toUpperCase()}` : f.example }
      c.steps = Object.fromEntries(stepOrder.map(id => [id, { status: 'success', message: '초기 Mock 검증 통과' }])) as StoreConnection['steps']
      c.capabilityResults = Object.fromEntries(iface.capabilityIds.map(id => [id, { status: 'success', message: '초기 Mock 데이터 검증 통과' }]))
      c.status = 'active'; c.lastReceived = '2026-10-05T09:40:00+09:00'; c.lastCount = 124
      if (store.id === 'gangseo') { c.status = 'validating'; c.steps.mapping = { status: 'failure', message: '농할지원금 필수 필드 미매핑' }; c.steps.capabilities = { status: 'waiting', message: '매핑 보완 후 검증' }; c.capabilityResults = {}; c.lastReceived = null; c.lastCount = 0; c.lastError = '농할지원금 필수 필드 미매핑' }
      if (store.id === 'saebom-store') { c.status = 'error'; c.steps = emptySteps(); c.steps.connect = { status: 'failure', message: 'Mock 연결 시간 초과' }; c.capabilityResults = {}; c.lastError = 'Mock 연결 시간 초과'; c.lastReceived = null; c.lastCount = 0 }
    }
    data.connections.push(c)
    data.runs.push({ id: `initial-${store.id}`, storeId: store.id, posId: c.posId, interfaceId: c.interfaceId, at: '2026-10-05T09:40:00+09:00', action: '초기 시연 상태', result: c.lastError ? 'failure' : c.status === 'active' ? 'success' : 'info', message: c.lastError || (c.status === 'unset' ? 'POS 지정만 완료 · 접속정보 미설정' : 'Mock 수집 완료'), count: c.lastCount, revision: c.revision })
  }
  return data
}
