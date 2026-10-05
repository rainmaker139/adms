import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { applyCommand, readData, DATA_KEY } from '../src/state/platformStore.ts'
import { interfaceFields, liveCapabilities, mappingProblems } from '../src/state/hubStore.ts'
let data = structuredClone(seed)
const run = operation => { data = applyCommand(data, 'account-admin', { type: 'hub', operation }) }
const c = id => data.hub.connections.find(c => c.storeId === id)
assert.equal(c('main').status, 'active'); assert.equal(c('gangseo').status, 'validating'); assert.equal(c('magok').status, 'unset')
assert.ok(liveCapabilities(data.hub, c('main')).some(c => c.id === 'sales'))
assert.ok(!data.hub.poses.find(p => p.id === 'sample-pos').capabilityIds.includes('sales'))
assert.throws(() => run({ kind: 'activate', storeId: 'gangseo' }), /検証|검증/)
const missing = data.hub.mappings.find(m => m.interfaceId === 'hipos-agent' && m.fieldId === 'SaleTransaction.support_amount')
run({ kind: 'mapping', value: { ...missing, source: 'SUPPORT_AMT' } })
assert.equal(c('gangseo').status, 'validating')
run({ kind: 'validateMappings', interfaceId: 'hipos-agent' }); assert.equal(mappingProblems(data.hub, data.hub.interfaces.find(i => i.id === 'hipos-agent')).length, 0)
run({ kind: 'step', storeId: 'gangseo', step: 'mapping' }); run({ kind: 'step', storeId: 'gangseo', step: 'capabilities', simulate: 'sales' }); assert.equal(c('gangseo').status, 'error')
assert.throws(() => run({ kind: 'activate', storeId: 'gangseo' }), /검증/)
run({ kind: 'step', storeId: 'gangseo', step: 'capabilities' }); run({ kind: 'activate', storeId: 'gangseo' }); assert.equal(c('gangseo').status, 'active')
run({ kind: 'collect', storeId: 'gangseo' }); assert.equal(c('gangseo').lastCount, 12)
const beforeCount = data.hub.mappings.length
const hipos = data.hub.poses.find(p => p.id === 'hipos')
assert.throws(() => run({ kind: 'capabilities', posId: hipos.id, ids: hipos.capabilityIds.filter(id => id !== 'sales') }), /확인/)
run({ kind: 'capabilities', posId: hipos.id, ids: hipos.capabilityIds.filter(id => !['sales', 'transaction'].includes(id)), confirmed: true })
assert.equal(data.hub.mappings.length, beforeCount, 'Capability OFF는 Mapping을 삭제하지 않음')
assert.ok(!interfaceFields(data.hub, data.hub.interfaces.find(i => i.id === 'hipos-agent')).some(f => f.schema === 'SaleTransaction'))
assert.deepEqual(liveCapabilities(data.hub, c('main')), [])
const sample = data.hub.poses.find(p => p.id === 'sample-pos')
run({ kind: 'capabilities', posId: sample.id, ids: [...sample.capabilityIds, 'sales'], confirmed: true })
const excel = data.hub.interfaces.find(i => i.id === 'sample-excel')
run({ kind: 'interface', value: { ...excel, capabilityIds: [...excel.capabilityIds, 'sales'] } })
assert.ok(data.hub.mappings.some(m => m.interfaceId === excel.id && m.fieldId === 'SaleTransaction.support_amount' && m.status === 'unmapped'))
run({ kind: 'autoMap', interfaceId: excel.id }); run({ kind: 'validateMappings', interfaceId: excel.id })
assert.equal(mappingProblems(data.hub, data.hub.interfaces.find(i => i.id === excel.id)).length, 0)
run({ kind: 'connection', storeId: 'magok', posId: sample.id, interfaceId: excel.id, config: { storeCode: 'DEMO-MAGOK', sheet: '판매실적', template: 'DEMO-v1', secret: 'NEVER-STORE-THIS' }, replaceSecrets: [] })
assert.equal(c('magok').status, 'pending'); assert.ok(!JSON.stringify(data).includes('NEVER-STORE-THIS'))
assert.throws(() => run({ kind: 'step', storeId: 'magok', step: 'sample' }), /앞 단계/)
for (const step of ['connect', 'identity', 'sample', 'mapping', 'capabilities']) run({ kind: 'step', storeId: 'magok', step })
run({ kind: 'activate', storeId: 'magok' }); assert.equal(data.stores.find(s => s.id === 'magok').posConnectionStatus, 'active')
run({ kind: 'stop', storeId: 'magok' }); assert.deepEqual(liveCapabilities(data.hub, c('magok')), [])
run({ kind: 'reset', storeId: 'magok' }); assert.equal(c('magok').status, 'pending')
const qty = data.hub.mappings.find(m => m.interfaceId === excel.id && m.fieldId === 'SaleTransaction.quantity')
run({ kind: 'mapping', value: { ...qty, source: 'ITEM_NM' } }); run({ kind: 'validateMappings', interfaceId: excel.id }); assert.equal(data.hub.mappings.find(m => m.interfaceId === excel.id && m.fieldId === qty.fieldId).status, 'error')
assert.ok(data.hub.runs.some(r => r.storeId === 'gangseo' && r.result === 'failure'))
// 기존 관리 화면에서 만든 저장 데이터는 유지하고 HUB만 추가 이관한다.
const old = structuredClone(seed); delete old.hub; old.organizations[0].contactName = '보존된 담당자'
globalThis.localStorage = { getItem: key => key === DATA_KEY ? JSON.stringify({ version: 2, data: old }) : null }
assert.equal(readData().organizations[0].contactName, '보존된 담당자'); assert.equal(readData().hub.version, 1)
console.log('POS HUB 모델 검증 통과: 상태 분리, 활성화 가드, 매핑 보완·오류, Capability OFF 보존/ON 작업 생성, 검증 실패·복구, 제한 기능 계산, 이력, Secret 제거, 기존 저장 데이터 이관')
