import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { applyCommand } from '../src/state/platformStore.ts'
let data=structuredClone(seed)
const scope={operatorId:'assn-org',businessId:'nonghal-2026'},run=c=>{data=applyCommand(data,'account-assn',{type:'workflow',operation:{...scope,...c}})}
const representative={id:'test-new-rep',name:'국산 호박',unit:'1개'},plan={...scope,id:'test-direct-plan',name:'직접 등록 계획',startsOn:'2026-10-15',endsOn:'2026-10-21',status:'draft',official:{items:[representative.id],discount:20,personalLimit:10000,conditions:'직접 등록 운영조건',source:'협회 직접 등록'},operating:{budget:10000000,reserveRate:5,mode:'branch',deadline:'2026-10-14T18:00'}}
const unchanged=structuredClone(data.workflow)
assert.throws(()=>run({kind:'round',value:{...plan,official:{...plan.official,items:[]}}}),/대표품목/)
assert.throws(()=>run({kind:'round',value:{...plan,startsOn:'2026-10-22'},representatives:[representative]}),/목요일/)
assert.throws(()=>run({kind:'round',value:{...plan,startsOn:'2026-10-08',endsOn:'2026-10-14',operating:{...plan.operating,deadline:'2026-10-07T18:00'}},representatives:[representative]}),/중복/)
assert.deepEqual(data.workflow,unchanged)
run({kind:'round',value:plan,representatives:[representative]})
assert.equal(data.workflow.rounds.find(r=>r.id===plan.id).official.source,'협회 직접 등록')
assert.equal(data.workflow.rounds.find(r=>r.id===plan.id).status,'draft')
assert.deepEqual(data.workflow.ledger,unchanged.ledger);assert.deepEqual(data.workflow.claims,unchanged.claims)
run({kind:'confirmRound',id:plan.id})
assert.equal(data.workflow.rounds.find(r=>r.id===plan.id).status,'confirmed')
assert.ok(data.workflow.products.filter(p=>p.roundId===plan.id).length>0)
assert.ok(data.workflow.products.filter(p=>p.roundId===plan.id).every(p=>p.representativeId===representative.id))
const roundId='assn-org-nonghal-2026-next',storeId='magok',value={id:`no-sales-${roundId}-${storeId}`,roundId,storeId,kind:'무실적',status:'new',note:'집행 자료에 거래 없음',source:'cumulative'}
run({kind:'anomaly',id:value.id,value,status:'checking',reason:'담당자 확인'})
run({kind:'anomaly',id:value.id,status:'resolved',reason:'자료 제출 완료'})
assert.equal(data.workflow.anomalies.filter(a=>a.id===value.id).length,1)
assert.equal(data.workflow.anomalies.find(a=>a.id===value.id).status,'resolved')
assert.equal(data.changes.filter(c=>c.entity==='workflow:anomaly'&&c.after.target===value.id).length,2)
assert.throws(()=>run({kind:'anomaly',id:'invalid',value:{...value,id:'invalid'},status:'checking'}),/무실적/)
assert.deepEqual(data.workflow.claims,unchanged.claims)
console.log('직접 계획/상세 모델 통과: 필수 품목·역전·중복 기간 차단, 실패 원자성, 새 대표품목/출처/확정/공통 상품, Ledger/Snapshot 보존, 파생 이상건 저장/이력/중복 방지')
