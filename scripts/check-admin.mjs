import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
import { applyCommand, readData, saveData } from '../src/state/platformStore.ts'
import { authenticate } from '../src/state/session.ts'
import { navigationFor, scopedStores } from '../src/access/policy.ts'
let data = structuredClone(seed)
const admin = 'account-admin'
const run = c => { data = applyCommand(data, admin, c) }
const fail = (c, pattern) => assert.throws(() => applyCommand(data, admin, c), pattern)
fail({ type: 'organization', value: { ...data.organizations.find(o => o.id === 'assn-org'), parentId: 'main-org' } }, /하위조직/)
fail({ type: 'organization', value: { ...data.organizations.find(o => o.id === 'main-org'), parentId: 'other-company-org' } }, /이관/)
run({ type: 'organization', value: { id: 'new-company', name: '추가 회원사', code: 'NEW-COMPANY', type: '회원사', parentId: 'gyeonggi', active: true } })
run({ type: 'organization', value: { id: 'new-store', name: '추가 점포', code: 'NEW-STORE', type: '점포', parentId: 'new-company', active: true } })
assert.ok(data.companies.some(c => c.organizationId === 'new-company'))
assert.equal(data.stores.find(s => s.organizationId === 'new-store').companyId, 'company-new-company')
fail({ type: 'account', value: { ...data.accounts[0], status: 'inactive' } }, /보호/)
fail({ type: 'permissions', roleId: 'system', values: [] }, /제거/)
fail({ type: 'role', value: { ...data.roles[0], active: false } }, /변경/)
const mart = data.accounts.find(a => a.loginId === 'mart')
fail({ type: 'account', value: { ...mart, status: 'inactive' } }, /대표 관리자/)
run({ type: 'account', value: { ...mart, status: 'inactive' }, confirmed: true })
assert.equal(authenticate('mart', '1234', data), null)
run({ type: 'account', value: mart, confirmed: true })
const claims = data.programs.find(p => p.id === 'claims')
fail({ type: 'program', value: { ...claims, active: false } }, /영향/)
run({ type: 'program', value: { ...claims, active: false }, confirmed: true })
assert.ok(!navigationFor(mart, 'nonghal-2026', data).some(p => p.id === 'claims'))
assert.ok(data.businessPrograms.some(p => p.programId === 'claims'))
run({ type: 'program', value: claims })
fail({ type: 'businessPrograms', businessId: 'fish-2025', programIds: ['claims'] }, /종료/)
fail({ type: 'businessOrganizations', businessId: 'nonghal-2026', values: [{ businessId: 'nonghal-2026', organizationId: 'assn-org', role: 'store' }] }, /점포/)
run({ type: 'role', value: { id: 'demo-reviewer', name: '검토 담당', family: 'mart', scope: 'stores', active: true } })
run({ type: 'permissions', roleId: 'demo-reviewer', values: [{ roleId: 'demo-reviewer', programId: 'claims', actions: ['view', 'submit'] }] })
run({ type: 'account', value: { id: 'reviewer', loginId: 'reviewer', name: '검토자', organizationId: 'hanbit-org', roleId: 'demo-reviewer', storeAccess: ['main'], status: 'active' } })
const reviewer = data.accounts.find(a => a.id === 'reviewer')
assert.deepEqual(navigationFor(reviewer, 'nonghal-2026', data).map(p => p.id), ['claims'])
assert.deepEqual(scopedStores(reviewer, 'nonghal-2026', data).map(s => s.id), ['main'])
fail({ type: 'account', value: { ...reviewer, storeAccess: ['saebom-store'] } }, /접근 점포/)
assert.ok(authenticate('reviewer', '1234', data))
assert.ok(data.changes.length === 9)
assert.equal(seed.accounts.some(a => a.id === 'reviewer'), false)
assert.throws(() => applyCommand(data, mart.id, { type: 'program', value: claims }), /시스템 관리자/)
let stored
globalThis.localStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value } }
assert.equal(saveData(data), true)
assert.deepEqual(readData(), JSON.parse(JSON.stringify(data)), '정상 데이터의 참조·상태·권한 복구')
stored = '{broken'
assert.deepEqual(readData(), seed, '손상 JSON fallback')
const cyclic = structuredClone(seed); cyclic.organizations.find(o => o.id === 'assn-org').parentId = 'main-org'
stored = JSON.stringify({ version: 2, data: cyclic })
assert.deepEqual(readData(), seed, '저장 데이터 계층 순환 fallback')
localStorage.setItem = () => { throw Error('QuotaExceeded') }
assert.equal(saveData(data), false, '저장 실패 시 메모리 데이터 유지')
assert.ok(data.accounts.some(a => a.id === 'reviewer'))
console.log('관리자 모델 검증 통과: 조직 순환·점포 이관 가드, 회원사/점포 분리 생성, admin/Role 보호, 대표 경고, 중지와 이력 보존, 종료 사업 제한, 새 Role/계정/점포 범위, 변경 이력')
