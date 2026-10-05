import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { executionView } from '../src/data/executionView.ts'
const before=structuredClone(seed)
for(const store of seed.stores)for(const round of seed.workflow.rounds){
 const tx=seed.workflow.transactions.filter(t=>t.storeId===store.id&&t.roundId===round.id),rows=executionView(tx,seed.workflow.products,store.id)
 assert.equal(rows.reduce((s,r)=>s+r.support,0),tx.reduce((s,t)=>s+t.support,0))
 assert.equal(rows.reduce((s,r)=>s+r.quantity,0),tx.reduce((s,t)=>s+t.quantity,0))
 assert.equal(rows.reduce((s,r)=>s+r.gross,0),tx.reduce((s,t)=>s+t.quantity*t.price,0))
 assert.equal(new Set(rows.map(r=>r.number)).size,rows.length)
 assert.ok(rows.every(r=>r.net===r.gross-r.ownDiscount-r.support&&!r.number.includes('sale-')))
 for(const r of rows.filter(r=>r.kind!=='정상')){const original=rows.find(o=>o.number===r.original);assert.ok(original);assert.equal(r.support+original.support,0);assert.equal(r.net+original.net,0)}
 if(tx.length){assert.ok(rows.length>=20);assert.ok(rows.some(r=>r.kind==='취소'));assert.ok(rows.some(r=>r.kind==='반품'));assert.ok(rows.some(r=>r.validation.includes('주의')))}else assert.equal(rows.length,0)
}
assert.deepEqual(seed,before)
console.log('판매 상세 projection 통과: 모든 점포/주차 농할지원금·판매수량·총판매금액 보존, 취소/반품 원거래 상계, 결제 산식, 거래번호 고유성, 20건/주의 사례, 원본 데이터 불변')
