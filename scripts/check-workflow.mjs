import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { applyCommand, readData, DATA_KEY } from '../src/state/platformStore.ts'
import { reserve, execution, settlementTotals } from '../src/state/workflowStore.ts'
let p = structuredClone(seed)
const ctx = { operatorId: 'assn-org', businessId: 'nonghal-2026' }, run = c => { p = applyCommand(p, 'account-assn', { type: 'workflow', operation: { ...ctx, ...c } }) }
const nextId = 'assn-org-nonghal-2026-next', pastId = 'assn-org-nonghal-2026-past', currentId = 'assn-org-nonghal-2026-current', batchId = 'batch-assn-org-nonghal-2026'
assert.equal(reserve(p, nextId), 5000000)
assert.ok(p.workflow.transactions.every(t => t.support <= t.price * t.quantity))
assert.equal(execution(p, pastId).amount, 26368000)
const scopeError = c => assert.throws(() => run(c), /범위|권한|소속|사업|점포/)
scopeError({ kind: 'storePos', storeId: 'saebom-store', confirmed: true, reason: '접근 금지' })
const oldPermission = p.permissions.find(v => v.roleId === 'association' && v.programId === 'budget'); oldPermission.actions = ['view']
assert.throws(() => run({ kind: 'allocate', id: nextId }), /Action/); oldPermission.actions = ['view', 'allocate', 'recover', 'reserve', 'edit']
const count = [p.companies.length, p.stores.length, p.accounts.length]
run({ kind: 'membership', id: 'application-assn-org', status: 'approved' })
assert.deepEqual([p.companies.length, p.stores.length, p.accounts.length], count.map(n => n + 1)); const co = p.workflow.applications.find(a => a.id === 'application-assn-org').companyId
assert.equal(p.accounts.filter(a => a.companyId === co && a.roleId === 'martOwner').length, 1)
assert.ok(p.hub.connections.some(c => p.stores.some(s => s.id === c.storeId && s.companyId === co)))
assert.throws(() => run({ kind: 'membership', id: 'application-assn-org', status: 'approved' }), /미처리/)
run({ kind: 'allocate', id: nextId }); assert.equal(reserve(p, nextId), 5000000)
const before = p.workflow.allocations.find(a => a.roundId === nextId && a.storeId === 'main').amount
run({ kind: 'budgetMove', id: nextId, storeId: 'main', amount: 1000000, reason: '추가 배정' }); assert.equal(reserve(p, nextId), 4000000)
run({ kind: 'budgetMove', id: nextId, storeId: 'main', amount: -1000000, reason: '미사용 회수' }); assert.equal(p.workflow.allocations.find(a => a.roundId === nextId && a.storeId === 'main').amount, before)
assert.throws(() => run({ kind: 'budgetMove', id: currentId, storeId: 'main', amount: -10000000, reason: '집행액 아래 회수' }), /잔액/)
let product = p.workflow.products.find(v => v.roundId === nextId && v.storeId === 'magok')
assert.throws(() => run({ kind: 'confirmProduct', id: product.id }), /사진/)
run({ kind: 'product', value: { ...product, name: '농할 국내산 사과', photo: true } }); run({ kind: 'confirmProduct', id: product.id })
const saleSupport=Math.floor(p.workflow.allocations.find(a=>a.roundId===nextId && a.storeId==='magok').amount*.9/2000)*2000
run({ kind: 'sale', value: { id: '', roundId: nextId, storeId: 'magok', productId: product.id, at: '2026-10-08T10:00', quantity: saleSupport/2000, price: 10000, support: saleSupport, source: 'Excel', valid: true, exclusion: '' } })
assert.equal(execution(p, nextId, 'magok').amount, saleSupport); assert.ok(p.workflow.anomalies.some(a => a.storeId === 'magok' && a.kind === '예산 소진 임박'))
run({ kind: 'claim', id: batchId }); const originalClaim = structuredClone(p.workflow.claims.find(v => v.batchId === batchId)); assert.equal(originalClaim.total, 26368000)
assert.throws(() => run({ kind: 'claim', id: batchId }), /한 번/)
run({ kind: 'submitClaim', id: batchId, method: 'Excel' }); run({ kind: 'submitClaim', id: batchId, method: 'API' }); assert.deepEqual(p.workflow.claims.find(v => v.batchId === batchId).rows, originalClaim.rows)
run({ kind: 'receiveRejections', id: batchId }); let caseId = p.workflow.rejections.find(v => v.batchId === batchId).id
assert.equal(settlementTotals(p, batchId).held, 100000); assert.equal(p.workflow.ledger.filter(l => l.type.startsWith('최종불인정')).length, seed.workflow.ledger.filter(l => l.type.startsWith('최종불인정')).length)
assert.throws(() => run({ kind: 'finalize', id: batchId, confirmed: true }), /종결/)
run({ kind: 'appeal', id: caseId, reason: '마트 증빙' }); run({ kind: 'reviewAppeal', id: caseId, reason: '협회 검토' }); run({ kind: 'receiveDecision', id: caseId, status: 'rejected' })
assert.equal(settlementTotals(p, batchId).held, 0); assert.equal(settlementTotals(p, batchId).rejected, 100000); assert.equal(p.workflow.ledger.filter(l => l.type.startsWith('최종불인정')).reduce((s, l) => s + l.delta, 0), 100000 + seed.workflow.ledger.filter(l => l.operatorId === ctx.operatorId && l.businessId === ctx.businessId && l.type.startsWith('최종불인정')).reduce((s, l) => s + l.delta, 0))
run({ kind: 'finalize', id: batchId, confirmed: true }); const final = p.workflow.finals.find(v => v.batchId === batchId); assert.equal(final.initial, final.accepted + final.rejected); assert.equal(final.accepted, 26268000); assert.equal(p.workflow.payouts.filter(v => v.batchId === batchId).reduce((s, v) => s + v.amount, 0), final.accepted)
assert.deepEqual(p.workflow.claims.find(v => v.batchId === batchId).rows, originalClaim.rows)
const payout = p.workflow.payouts.find(v => v.batchId === batchId), payoutCmd = status => ({ kind: 'payout', id: batchId, storeId: payout.storeId, status, confirmed: true, reason: '지급 시연' })
assert.throws(() => run(payoutCmd('processing')), /지급준비/); run(payoutCmd('received')); run(payoutCmd('ready')); run(payoutCmd('processing')); run(payoutCmd('failed')); run(payoutCmd('processing')); run(payoutCmd('paid')); assert.throws(() => run(payoutCmd('processing')), /지급준비/)
run({ kind: 'deposit', id: 'deposit-assn-org', value: { companyId: 'hanbit', category: '회비', dueId: 'due-hanbit', memo: 'Alias 확인' } }); assert.equal(p.workflow.receipts.find(r => r.dueId === 'due-hanbit').amount, 100000)
const legacy = structuredClone(seed); delete legacy.workflow; globalThis.localStorage = { getItem: key => key === DATA_KEY ? JSON.stringify({ version: 2, data: legacy }) : null }
assert.ok(readData().workflow.rounds.length)
console.log('협회 도메인 통과: 공통 객체 승인 생성, Scope/Action, 예산/원장/집행 정합성, 사진/확정/이상감지, 청구 불변/API·Excel 공통 원본, 보류·재심사·환원, 최종정산·지급/계좌/중복 방지, 수납/Alias, 저장 데이터 이관')
