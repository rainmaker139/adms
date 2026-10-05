import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { expandAssociationDemo } from '../src/data/associationDemo.ts'
import { companyFeeSummary } from '../src/data/associationSummary.ts'
import { organizationScope, execution, reserve } from '../src/state/workflowStore.ts'
const scope=organizationScope(seed,'assn-org'), companies=seed.companies.filter(c=>scope.has(c.organizationId)), stores=seed.stores.filter(s=>scope.has(s.organizationId))
assert.equal(companies.length,25); assert.equal(stores.length,58)
assert.ok(companies.every(c=>{const n=stores.filter(s=>s.companyId===c.id).length;return n>=1&&n<=5}))
assert.equal(seed.workflow.deposits.filter(d=>d.operatorId==='assn-org').length,31)
const summaries=companies.map(c=>companyFeeSummary(seed,c.id)); for(const status of ['정상 납부','미납','연체','장기 연체','선납','부분납'])assert.ok(summaries.some(c=>c.status===status),status)
assert.equal(summaries.reduce((s,c)=>s+c.billed,0),2500000); assert.equal(summaries.reduce((s,c)=>s+c.paid,0),1000000)
for(const tag of ['current','next','past']){const id=`assn-org-nonghal-2026-${tag}`,r=seed.workflow.rounds.find(r=>r.id===id),allocations=seed.workflow.allocations.filter(a=>a.roundId===id);assert.equal(allocations.reduce((s,a)=>s+a.amount,0)+reserve(seed,id),r.operating.budget);assert.ok(allocations.every(a=>execution(seed,id,a.storeId).amount<=a.amount));assert.equal(execution(seed,id).amount,allocations.reduce((s,a)=>s+execution(seed,id,a.storeId).amount,0));assert.ok(allocations.every(a=>seed.participations.some(p=>p.storeId===a.storeId&&p.businessId==='nonghal-2026'&&p.status==='active')))}
// Existing data migration is additive: no recalculation of saved claims, budgets or ledger.
const previous=structuredClone(seed); previous.organizations=previous.organizations.filter(o=>!o.id.startsWith('demo-'));previous.companies=previous.companies.filter(c=>!c.id.startsWith('demo-'));previous.stores=previous.stores.filter(s=>!s.id.startsWith('demo-'));previous.accounts=previous.accounts.filter(a=>!a.id.startsWith('account-demo-'));previous.participations=previous.participations.filter(s=>!s.storeId.startsWith('demo-'));previous.businessOrganizations=previous.businessOrganizations.filter(o=>!o.organizationId.startsWith('demo-'))
const money=structuredClone({claims:previous.workflow.claims,ledger:previous.workflow.ledger,allocations:previous.workflow.allocations,transactions:previous.workflow.transactions});expandAssociationDemo(previous);assert.deepEqual({claims:previous.workflow.claims,ledger:previous.workflow.ledger,allocations:previous.workflow.allocations,transactions:previous.workflow.transactions},money)
console.log('협회 UX 데이터 검증 통과: 25회원사/58점포, 회비 6상태/31입금/당월 합계, 주차 배정·집행 합계, 참여 Scope, 기존 금액·원장·청구 보존')
