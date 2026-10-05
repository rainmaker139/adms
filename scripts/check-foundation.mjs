import assert from 'node:assert/strict'
import { seed } from '../src/data/seed.ts'
const { accounts: allAccounts, businesses, businessOrganizations, companies, organizations, participations, stores, programs, permissions, businessPrograms } = seed
const accounts = allAccounts.filter(a => ['admin', 'at', 'assn', 'mart'].includes(a.loginId))
import { availableBusinesses, canAccessProgram, navigationFor, programCatalogFor, scopedOrganizations, scopedStores, usesBusinessContext } from '../src/access/policy.ts'
import { authenticate, validateSession } from '../src/state/session.ts'
import { statuses } from '../src/types/status.ts'

const byId = (items, id) => items.find((item) => item.id === id)
for (const items of [accounts, businesses, companies, organizations, stores, programs]) assert.equal(new Set(items.map((item) => item.id)).size, items.length)
for (const org of organizations) {
  const seen = new Set([org.id])
  let parentId = org.parentId
  while (parentId) {
    assert.ok(!seen.has(parentId), '조직 트리에 순환이 없어야 함')
    seen.add(parentId)
    const parent = byId(organizations, parentId)
    assert.ok(parent)
    parentId = parent.parentId
  }
}
for (const link of businessOrganizations) { assert.ok(byId(businesses, link.businessId)); assert.ok(byId(organizations, link.organizationId)) }
for (const link of businessPrograms) { assert.ok(byId(businesses, link.businessId)); assert.ok(byId(programs, link.programId)) }
for (const store of stores) { assert.ok(byId(companies, store.companyId)); assert.ok(byId(organizations, store.organizationId)) }
for (const row of participations) { assert.ok(byId(stores, row.storeId)); assert.ok(byId(businesses, row.businessId)) }
for (const grant of permissions) assert.ok(byId(programs, grant.programId))
for (const account of accounts) {
  assert.equal(authenticate(account.loginId, '1234')?.accountId, account.id)
  assert.equal(authenticate(account.loginId, 'bad'), null)
  const menu = navigationFor(account, 'nonghal-2026')
  assert.ok(menu.length > 0)
  assert.ok(menu.every((program) => canAccessProgram(account, 'nonghal-2026', program)))
}
assert.equal(authenticate('missing', '1234'), null)
assert.equal(validateSession({ accountId: 'missing', businessId: 'nonghal-2026' }), null)
assert.equal(validateSession({ accountId: 'account-at', businessId: 'pilot-2027' }), null)
assert.deepEqual(validateSession({ accountId: 'account-mart', businessId: 'nonghal-2026', roleId: 'system' }), { accountId: 'account-mart', businessId: 'nonghal-2026' })
const mart = accounts.find((a) => a.loginId === 'mart')
const at = accounts.find((a) => a.loginId === 'at')
const assn = accounts.find((a) => a.loginId === 'assn')
assert.equal(availableBusinesses(mart).length, 3)
assert.equal(availableBusinesses(at).length, 2)
assert.equal(scopedStores(mart, 'nonghal-2026').length, 3)
assert.equal(scopedStores(assn, 'pilot-2027').length, 0)
assert.equal(scopedStores(mart, 'pilot-2027').length, 0)
assert.ok(navigationFor(mart, 'pilot-2027').some((p) => p.id === 'join-future'))
assert.ok(!navigationFor(mart, 'pilot-2027').some((p) => p.scope === 'business'))
assert.ok(!canAccessProgram(at, 'nonghal-2026', byId(programs, 'anomalies')))
assert.ok(!canAccessProgram(mart, 'nonghal-2026', byId(programs, 'audit')))
assert.ok(!canAccessProgram(mart, 'nonghal-2026', byId(programs, 'public-data')))
assert.ok(canAccessProgram(mart, 'public-2026', byId(programs, 'public-data')))
assert.ok(!scopedOrganizations(assn, 'nonghal-2026').some((o) => o.id === 'other-org'))
const branch = { ...assn, roleId: 'branch', organizationId: 'gyeonggi' }
assert.equal(scopedStores(branch, 'nonghal-2026').length, 7); assert.ok(!scopedStores(branch, 'nonghal-2026').some(s=>s.region==='전라'))
assert.ok(navigationFor(branch, 'nonghal-2026').some((p) => p.id === 'week-plan'))
assert.ok(!canAccessProgram(branch, 'nonghal-2026', byId(programs, 'budget')))
const staff = { ...mart, roleId: 'martStaff', storeAccess: ['main'] }
assert.deepEqual(scopedStores(staff, 'nonghal-2026').map((s) => s.id), ['main'])
assert.ok(!canAccessProgram(staff, 'nonghal-2026', byId(programs, 'company-accounts')))
assert.equal(Object.keys(statuses.eventWeek).length, 12)
assert.equal(Object.keys(statuses.payment).length, 7)
const admin = accounts.find((a) => a.loginId === 'admin')
for (const [account, group] of [[assn, '농할 정산'], [mart, '농할 정산'], [at, '정산 관리']]) {
  const nav = navigationFor(account, 'nonghal-2026')
  assert.deepEqual(nav.filter((p) => p.group === group).map((p) => p.id), ['claims', 'appeals', 'settlement'])
  assert.ok(nav.filter((p) => p.group === '농할 운영').every((p) => !['claims', 'appeals', 'settlement'].includes(p.id)))
}
assert.deepEqual(navigationFor(at, 'nonghal-2026').filter((p) => p.group === '농할 운영').map((p) => p.id), ['week-plan', 'execution'])
for (const id of ['organizations', 'accounts', 'permissions', 'programs', 'pos-master', 'pos-schema', 'codes']) {
  const program = byId(programs, id)
  assert.ok(!usesBusinessContext(program))
  assert.ok(canAccessProgram(admin, '', program), '전역 마스터는 사업 Context 없이도 접근 가능')
  assert.ok(!canAccessProgram(mart, '', program), '전역 범위가 Role 권한을 우회하면 안 됨')
}
assert.deepEqual(programCatalogFor(admin).map((p) => p.id), programs.map((p) => p.id))
for (const business of businesses) assert.deepEqual(scopedOrganizations(admin, business.id), organizations)
for (const id of ['business-organizations', 'business-programs', 'claims']) {
  assert.ok(usesBusinessContext(byId(programs, id)))
  assert.ok(!canAccessProgram(admin, '', byId(programs, id)))
}
assert.ok(!canAccessProgram(admin, 'pilot-2027', byId(programs, 'claims')))
console.log('공통 기반 모델 검증 통과: 관계 무결성, 조직 순환, 4계정, 사업/프로그램/Role/점포 범위, 지회/일반관리자, 세션 검증')
console.log('IA 검증 통과: 운영/정산 분리, 전역 마스터의 사업 독립성, 사업 연결 화면 Scope')
