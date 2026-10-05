import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { applyCommand, splitReviewNavigation, readData, DATA_KEY } from '../src/state/platformStore.ts'
import { createOperationsSeed } from '../src/data/operations.ts'
import { applyOperations, readOperations } from '../src/state/operationsStore.ts'
import { usesBusinessContext, navigationFor } from '../src/access/policy.ts'
const ctx={operatorId:'assn-org',businessId:'nonghal-2026'},actor={actor:'시연 관리자',organizationId:'platform',role:'시스템 관리자'},before=structuredClone(seed)
let p=structuredClone(seed),ops=createOperationsSeed()
assert.equal(usesBusinessContext(p.programs.find(p=>p.id==='membership-review')),false)
assert.equal(usesBusinessContext(p.programs.find(p=>p.id==='participation-review')),true)
const nav=navigationFor(p.accounts.find(a=>a.loginId==='assn'),ctx.businessId,p)
assert.ok(nav.some(n=>n.name==='회원가입 심사'));assert.ok(nav.some(n=>n.name==='사업 참여 심사'));assert.ok(nav.some(n=>n.id==='operators'&&n.name==='관리자 계정 관리'))
const run=c=>p=applyCommand(p,'account-assn',{type:'workflow',operation:{...ctx,...c}})
run({kind:'membership',id:'application-assn-org',status:'approved'})
assert.equal(p.companies.length,seed.companies.length+1);assert.equal(p.stores.length,seed.stores.length+1);assert.equal(p.accounts.length,seed.accounts.length+1)
const application=p.workflow.participationApplications.find(a=>a.operatorId===ctx.operatorId&&a.businessId===ctx.businessId)
run({kind:'participation',id:application.id,status:'approved',ids:application.storeIds})
assert.ok(application.storeIds.every(storeId=>p.participations.some(v=>v.storeId===storeId&&v.businessId===ctx.businessId&&v.status==='active')))
assert.deepEqual(p.workflow.claims,before.workflow.claims);assert.deepEqual(p.workflow.ledger,before.workflow.ledger)
const legacy=structuredClone(seed);legacy.programs=legacy.programs.filter(p=>p.id!=='participation-review');legacy.permissions=legacy.permissions.filter(p=>p.programId!=='participation-review');legacy.programs.find(p=>p.id==='membership-review').name='가입·참여 심사';legacy.permissions.find(p=>p.roleId==='association'&&p.programId==='membership-review').actions=['view'];legacy.organizationPermissionOverrides.push({organizationId:'assn-org',roleId:'association',programId:'membership-review',actions:[]})
const originalWorkflow=structuredClone(legacy.workflow);splitReviewNavigation(legacy);assert.deepEqual(legacy.workflow,originalWorkflow);assert.deepEqual(legacy.permissions.find(p=>p.roleId==='association'&&p.programId==='participation-review').actions,['view']);assert.deepEqual(legacy.organizationPermissionOverrides.find(p=>p.programId==='participation-review').actions,[]);const count=legacy.programs.length;splitReviewNavigation(legacy);assert.equal(legacy.programs.length,count)
globalThis.localStorage={getItem:key=>key===DATA_KEY?JSON.stringify({version:2,data:legacy}):null};assert.deepEqual(readData().workflow,legacy.workflow)
const code={id:'test-code',group:'시연그룹',code:'TEST',label:'시연코드',description:'전역 예시',order:10,active:true};ops=applyOperations(ops,{kind:'code',value:code},actor);ops=applyOperations(ops,{kind:'code',value:{...code,label:'변경',active:false}},actor);assert.equal(ops.codes.find(c=>c.id===code.id).active,false);assert.throws(()=>applyOperations(ops,{kind:'code',value:{...code,id:'duplicate'}},actor),/중복/)
const item=ops.integrations.find(i=>i.status==='failed'),history=structuredClone(item.runs),command={kind:'externalRun',integrationId:item.id,runId:item.runs.at(-1).id,action:'재처리',reason:'실패자료 재확인',confirmed:true,fail:false};ops=applyOperations(ops,command,actor);assert.equal(ops.integrations.find(i=>i.id===item.id).status,'healthy');assert.deepEqual(ops.integrations.find(i=>i.id===item.id).runs.slice(0,history.length),history);assert.throws(()=>applyOperations(ops,command,actor),/이미 처리/)
assert.ok(ops.events.some(e=>e.menu==='공통코드'));assert.ok(ops.events.some(e=>e.action==='재처리'&&e.businessId===''))
const oldOps=createOperationsSeed();delete oldOps.codes;delete oldOps.integrations;globalThis.localStorage={getItem:()=>JSON.stringify(oldOps)};const migrated=readOperations();assert.deepEqual(migrated.templates,oldOps.templates);assert.deepEqual(migrated.events,oldOps.events);assert.ok(migrated.codes.length&&migrated.integrations.length)
globalThis.localStorage={getItem(){throw Error('blocked')}};assert.ok(readOperations().codes.length);assert.deepEqual(seed,before)
console.log('구조 보완 모델 통과: 심사 분리/사업 Context/권한 승계·거부 보존/이관 반복 안전, 가입→회원사·점포·대표/참여 반영, Snapshot·Ledger 보존, 코드 중복·상태/전역 감사, 외부 재처리·중복방지·오류 이력 보존, 이전 저장소 이관/fallback')
