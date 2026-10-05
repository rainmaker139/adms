import { expandAssociationDemo } from '../data/associationDemo.ts'
import { createHubSeed } from '../data/hubSeed.ts'
import { createWorkflowSeed } from '../data/workflowSeed.ts'
import { applyWorkflow } from './workflowStore.ts'
import type { WorkflowCommand } from '../types/workflow.ts'
import { grantWorkflow } from '../data/workflowPermissions.ts'
import { applyHubCommand, hubSnapshot, synchronizeHub, validHub } from './hubStore.ts'
import type { HubCommand } from '../types/hub.ts'
import { seed, basicActions, actionLabels, corePrograms } from '../data/seed.ts'
import { statuses } from '../types/status.ts'
import { accountEnabled, descendantIds } from '../access/policy.ts'
import type { Account, Business, BusinessOrganization, Organization, Permission, PlatformData, Program, Role } from '../types/platform.ts'

export const DATA_KEY = 'adms.demo.data.v2'
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
export type Command =
  | { type: 'workflow'; operation: WorkflowCommand }
  | { type: 'hub'; operation: HubCommand }
  | { type: 'organization'; value: Organization }
  | { type: 'account'; value: Account; confirmed?: boolean }
  | { type: 'role'; value: Role }
  | { type: 'permissions'; roleId: string; values: Permission[] }
  | { type: 'business'; value: Business }
  | { type: 'businessOrganizations'; businessId: string; values: BusinessOrganization[] }
  | { type: 'businessPrograms'; businessId: string; programIds: string[] }
  | { type: 'program'; value: Program; confirmed?: boolean }

const ensure = (ok: unknown, message: string): void => { if (!ok) throw new Error(message) }
const sameCode = (a: string | undefined, b: string | undefined) => a?.trim().toLowerCase() === b?.trim().toLowerCase()
function upsert<T extends { id: string }>(rows: T[], value: T): T[] { return rows.some(r => r.id === value.id) ? rows.map(r => r.id === value.id ? value : r) : [...rows, value] }
export function applyCommand(source: PlatformData, actorId: string, command: Command): PlatformData {
  if (command.type === 'workflow') return applyWorkflow(source, actorId, command.operation)
  const actor = source.accounts.find(a => a.id === actorId)
  ensure(actor && actor.roleId === 'system' && accountEnabled(actor, source), '시스템 관리자만 전역 마스터를 변경할 수 있습니다.')
  const data = structuredClone(source)
  let before: unknown
  let after: unknown
  if (command.type === 'hub') {
    before = hubSnapshot(data.hub, command.operation)
    data.hub = applyHubCommand(data.hub, command.operation, data.stores)
    after = hubSnapshot(data.hub, command.operation)
  } else if (command.type === 'organization') {
    const v = { ...command.value, name: command.value.name.trim(), code: command.value.code?.trim() }
    const old = data.organizations.find(o => o.id === v.id)
    ensure(v.name && v.code && v.type.trim(), '조직명·조직코드·조직유형은 필수입니다.')
    ensure(!data.organizations.some(o => o.id !== v.id && sameCode(o.code, v.code)), '이미 사용 중인 조직코드입니다.')
    ensure(!v.parentId || data.organizations.some(o => o.id === v.parentId), '상위조직을 확인해 주세요.')
    ensure(!v.parentId || !descendantIds(v.id, data).has(v.parentId), '자기 자신 또는 하위조직을 상위조직으로 지정할 수 없습니다.')
    ensure(v.id !== 'platform' || (v.active && !v.parentId), '플랫폼 운영 조직은 비활성화하거나 다른 조직 아래로 이동할 수 없습니다.')
    const company = data.companies.find(c => c.organizationId === v.id)
    const store = data.stores.find(s => s.organizationId === v.id)
    ensure(!old || old.type === v.type || (!company && !store && !['회원사', '점포'].includes(v.type)), '회원사·점포 객체의 유형 전환은 별도 이관이 필요합니다.')
    data.organizations = upsert(data.organizations, v)
    if (v.type === '회원사' && !company) data.companies.push({ id: `company-${v.id}`, organizationId: v.id, legalName: v.name, representativeName: v.contactName ?? '' })
    if (company) { company.legalName = v.name; company.representativeName = v.contactName ?? '' }
    if (v.type === '점포') {
      const owner = data.companies.find(c => descendantIds(c.organizationId, data).has(v.id))
      ensure(owner, '점포는 회원사의 하위조직으로 등록해 주세요.')
      ensure(!store || store.companyId === owner?.id, '다른 회원사로 점포를 이동하려면 계정·참여 데이터 이관이 필요합니다.')
      if (store) store.name = v.name
      else data.stores.push({ id: `store-${v.id}`, organizationId: v.id, companyId: owner!.id, name: v.name, region: '미지정', posId: null, posConnectionStatus: 'unset' })
    }
    // 중간 조직 이동으로 점포의 회원사 연결이 깨지는 경우도 차단한다.
    for (const s of data.stores) ensure(descendantIds(data.companies.find(c => c.id === s.companyId)!.organizationId, data).has(s.organizationId), '이동 시 점포와 회원사 소속이 불일치합니다.')
    before = old; after = v
  } else if (command.type === 'account') {
    const v = { ...command.value, name: command.value.name.trim(), loginId: command.value.loginId.trim() }
    const old = data.accounts.find(a => a.id === v.id)
    const role = data.roles.find(r => r.id === v.roleId)
    ensure(v.name && /^[A-Za-z0-9._-]+$/.test(v.loginId), '이름과 ID(영문·숫자·점·밑줄·하이픈)를 입력해 주세요.')
    ensure(!data.accounts.some(a => a.id !== v.id && sameCode(a.loginId, v.loginId)), '이미 사용 중인 ID입니다.')
    ensure(data.organizations.some(o => o.id === v.organizationId), '소속조직을 지정해 주세요.')
    ensure(role && (role.active !== false || old?.roleId === role.id), '활성 Role을 선택해 주세요.')
    ensure(v.id !== 'account-admin' || (v.roleId === 'system' && v.status === 'active' && v.organizationId === 'platform' && v.loginId === 'admin'), '기본 admin 계정의 ID·소속·Role·상태는 보호됩니다.')
    if (old?.roleId === 'martOwner' && (v.status !== 'active' || v.roleId !== old.roleId || v.organizationId !== old.organizationId)) ensure(command.confirmed, '대표 관리자 변경은 운영 권한에 영향을 줍니다. 경고 확인 후 저장해 주세요.')
    const company = data.companies.find(c => descendantIds(c.organizationId, data).has(v.organizationId))
    v.companyId = role?.family === 'mart' ? company?.id : undefined
    if (role?.family === 'mart') {
      ensure(company, '마트 Role은 회원사 또는 그 하위조직에 배정해 주세요.')
      ensure(v.storeAccess !== 'organization', '마트 계정은 회원사 전체 또는 개별 점포를 지정해 주세요.')
      ensure(role.scope !== 'stores' || Array.isArray(v.storeAccess), '점포 범위 Role에는 개별 점포를 지정해 주세요.')
    } else ensure(v.storeAccess === 'organization', '기관 계정의 접근범위는 조직 기준입니다.')
    if (Array.isArray(v.storeAccess)) ensure(v.storeAccess.length && v.storeAccess.every(id => data.stores.some(s => s.id === id && s.companyId === v.companyId)), '소속 회원사의 접근 점포를 하나 이상 선택해 주세요.')
    data.accounts = upsert(data.accounts, v); before = old; after = v
  } else if (command.type === 'role') {
    const v = { ...command.value, name: command.value.name.trim() }
    const old = data.roles.find(r => r.id === v.id)
    ensure(v.name && !data.roles.some(r => r.id !== v.id && sameCode(r.name, v.name)), 'Role 이름을 입력하고 중복을 확인해 주세요.')
    ensure(v.id !== 'system', '시스템 관리자 기본 Role은 변경할 수 없습니다.')
    ensure(v.family !== 'system' && v.scope !== 'all', '전체 플랫폼 권한은 보호된 시스템 관리자 Role만 사용합니다.')
    ensure(!old || (old.family === v.family && old.scope === v.scope), '기존 Role의 데이터 범위는 유지됩니다. 범위를 바꾸려면 새 Role을 생성해 주세요.')
    data.roles = upsert(data.roles, { ...v, protected: false }); before = old; after = v
  } else if (command.type === 'permissions') {
    ensure(command.roleId !== 'system', '시스템 관리자 핵심 권한은 제거할 수 없습니다.')
    ensure(data.roles.some(r => r.id === command.roleId), 'Role이 존재하지 않습니다.')
    ensure(new Set(command.values.map(p => p.programId)).size === command.values.length, '프로그램 권한이 중복되었습니다.')
    for (const p of command.values) {
      const program = data.programs.find(item => item.id === p.programId)
      ensure(p.roleId === command.roleId && program && p.actions.every(a => (program.actions ?? basicActions).includes(a)), '프로그램에서 제공하는 Action만 부여할 수 있습니다.')
      ensure(!p.actions.length || p.actions.includes('view'), '업무 Action에는 조회 권한이 필요합니다.')
      ensure(program?.scope !== 'platform' || !p.actions.some(a => a !== 'view'), '플랫폼 전역 마스터 변경은 시스템 관리자 전용입니다.')
    }
    before = data.permissions.filter(p => p.roleId === command.roleId); after = command.values
    data.permissions = [...data.permissions.filter(p => p.roleId !== command.roleId), ...command.values]
  } else if (command.type === 'business') {
    const v = { ...command.value, name: command.value.name.trim(), code: command.value.code.trim() }
    ensure(v.name && v.code && v.startsOn && v.endsOn && v.startsOn <= v.endsOn, '사업명·코드와 올바른 시작일/종료일을 입력해 주세요.')
    ensure(!data.businesses.some(b => b.id !== v.id && sameCode(b.code, v.code)), '이미 사용 중인 사업코드입니다.')
    if (['ended', 'archived', 'paused'].includes(v.status)) v.applicationOpen = false
    before = data.businesses.find(b => b.id === v.id); after = v; data.businesses = upsert(data.businesses, v)
  } else if (command.type === 'businessOrganizations' || command.type === 'businessPrograms') {
    const business = data.businesses.find(b => b.id === command.businessId)
    ensure(business && !['ended', 'archived', 'paused'].includes(business.status), '종료·보관·일시중지 사업은 연결 변경을 제한합니다. 기존 이력은 유지됩니다.')
    if (command.type === 'businessOrganizations') {
      const keys = command.values.map(v => `${v.organizationId}:${v.role}`)
      ensure(new Set(keys).size === keys.length, '같은 조직·역할이 중복되었습니다.')
      for (const v of command.values) {
        ensure(v.businessId === command.businessId && data.organizations.some(o => o.id === v.organizationId), '참여 조직을 확인해 주세요.')
        ensure(v.role !== 'store' || data.stores.some(s => s.organizationId === v.organizationId), '실행점포 역할에는 점포 객체만 연결할 수 있습니다.')
      }
      before = data.businessOrganizations.filter(v => v.businessId === command.businessId); after = command.values
      data.businessOrganizations = [...data.businessOrganizations.filter(v => v.businessId !== command.businessId), ...command.values]
      // 조직 연결은 참여 승인과 별도다. 새 실행점포에는 초안 참여 상태만 만든다.
      for (const v of command.values.filter(v => v.role === 'store')) {
        const store = data.stores.find(s => s.organizationId === v.organizationId)!
        if (!data.participations.some(p => p.businessId === command.businessId && p.storeId === store.id)) data.participations.push({ businessId: command.businessId, storeId: store.id, status: 'draft' })
      }
    } else {
      ensure(command.programIds.every(id => data.programs.some(p => p.id === id && p.scope === 'business')), '사업 업무 프로그램만 연결할 수 있습니다.')
      before = data.businessPrograms.filter(v => v.businessId === command.businessId)
      after = [...new Set(command.programIds)].map(programId => ({ businessId: command.businessId, programId }))
      data.businessPrograms = [...data.businessPrograms.filter(v => v.businessId !== command.businessId), ...after as PlatformData['businessPrograms']]
    }
  } else if (command.type === 'program') {
    const v = { ...command.value, name: command.value.name.trim(), code: command.value.code?.trim() }
    const old = data.programs.find(p => p.id === v.id)
    ensure(v.name && v.code && v.group.trim(), '프로그램명·코드·업무영역은 필수입니다.')
    ensure(!data.programs.some(p => p.id !== v.id && sameCode(p.code, v.code)), '이미 사용 중인 프로그램 코드입니다.')
    ensure(Number.isFinite(v.order) && v.order! >= 0, '표시순서는 0 이상의 숫자입니다.')
    ensure(v.actions?.includes('view'), '기본 조회 Action은 필요합니다.')
    ensure(!old?.protected || (v.active && v.scope === old.scope && !v.parentId && basicActions.every(a => v.actions?.includes(a))), '핵심 관리 프로그램의 활성 상태·범위·기본 권한은 보호됩니다.')
    ensure(!old || old.scope === v.scope, '기존 프로그램의 적용범위는 유지됩니다. 새 범위는 신규 프로그램으로 등록해 주세요.')
    const seen = new Set([v.id]); let parent = data.programs.find(p => p.id === v.parentId)
    ensure(!v.parentId || parent, '상위메뉴를 확인해 주세요.')
    while (parent) { ensure(!seen.has(parent.id), '메뉴 계층에 순환이 발생합니다.'); ensure(parent.scope === v.scope, '상위메뉴는 같은 적용범위여야 합니다.'); seen.add(parent.id); parent = data.programs.find(p => p.id === parent?.parentId) }
    if (old?.active && !v.active) ensure(command.confirmed, '연결된 사업·Role의 메뉴가 숨겨집니다. 영향 확인 후 사용중지해 주세요.')
    before = old; after = v; data.programs = upsert(data.programs, v)
    data.permissions = data.permissions.map(p => p.programId === v.id ? { ...p, actions: p.actions.filter(a => v.actions!.includes(a)) } : p)
  }
  synchronizeHub(data.hub, data.stores)
  data.stores = data.stores.map(s => { const c = data.hub.connections.find(c => c.storeId === s.id)!; return { ...s, posId: c.posId, posConnectionStatus: c.status } })
  data.changes.push({ id: newId('change'), at: new Date().toISOString(), actorId, entity: command.type, before: before ?? null, after })
  return data
}

function validData(d: PlatformData): boolean {
  const unique = (items: { id: string }[]) => items.every(i => typeof i.id === 'string') && new Set(items.map(i => i.id)).size === items.length
  if (![d.accounts, d.organizations, d.roles, d.businesses, d.programs, d.companies, d.stores].every(unique)) return false
  if (!d.roles.every(r => typeof r.name === 'string' && ['system', 'at', 'association', 'branch', 'mart'].includes(r.family) && ['all', 'business', 'organization', 'company', 'stores'].includes(r.scope))) return false
  if (!d.organizations.every(o => typeof o.name === 'string' && typeof o.type === 'string' && typeof o.active === 'boolean')) return false
  if (!d.businesses.length || !d.businesses.every(b => typeof b.name === 'string' && typeof b.code === 'string' && b.status in statuses.business)) return false
  if (!d.programs.every(p => typeof p.name === 'string' && typeof p.group === 'string' && ['platform', 'organization', 'business', 'participation'].includes(p.scope) && Array.isArray(p.actions) && p.actions.includes('view') && p.actions.every(a => a in actionLabels))) return false
  for (const nodes of [d.organizations, d.programs]) {
    for (const node of nodes) {
      const seen = new Set([node.id]); let parentId = node.parentId
      while (parentId) { const parent = nodes.find(n => n.id === parentId); if (!parent || seen.has(parent.id)) return false; seen.add(parent.id); parentId = parent.parentId }
    }
  }
  const orgExists = (id: string) => d.organizations.some(o => o.id === id)
  const businessExists = (id: string) => d.businesses.some(b => b.id === id)
  if (!d.accounts.every(a => typeof a.name === 'string' && typeof a.loginId === 'string' && a.status in statuses.account && orgExists(a.organizationId) && d.roles.some(r => r.id === a.roleId) && (Array.isArray(a.storeAccess) ? a.storeAccess.every(id => d.stores.some(s => s.id === id && s.companyId === a.companyId)) : ['organization', 'company'].includes(a.storeAccess)))) return false
  if (!d.companies.every(c => orgExists(c.organizationId)) || !d.stores.every(s => orgExists(s.organizationId) && s.posConnectionStatus in statuses.posConnection && d.companies.some(c => c.id === s.companyId))) return false
  if (!d.businessOrganizations.every(m => businessExists(m.businessId) && orgExists(m.organizationId))) return false
  if (!d.businessPrograms.every(m => businessExists(m.businessId) && d.programs.some(p => p.id === m.programId))) return false
  if (!d.participations.every(p => businessExists(p.businessId) && d.stores.some(s => s.id === p.storeId) && p.status in statuses.participation)) return false
  if (!d.permissions.every(p => d.roles.some(r => r.id === p.roleId) && d.programs.some(item => item.id === p.programId) && Array.isArray(p.actions) && p.actions.every(a => a in actionLabels))) return false
  const admin = d.accounts.find(a => a.id === 'account-admin')
  return !!admin && admin.roleId === 'system' && admin.loginId === 'admin' && accountEnabled(admin, d) && d.roles.some(r => r.id === 'system' && r.family === 'system' && r.scope === 'all') && corePrograms.every(id => d.programs.some(p => p.id === id && p.protected && p.active && !p.parentId))
}

export function readData(): PlatformData {
  try {
    const value = JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null')
    if (value?.version === 2 && Object.keys(seed).filter(k => Array.isArray(seed[k as keyof PlatformData])).every(k => Array.isArray(value.data?.[k]))) {
      const d = value.data as PlatformData
      if (validData(d)) {
        splitReviewNavigation(d)
        if (!d.workflow || d.workflow.version !== 1 || Object.entries(seed.workflow).some(([key, value]) => Array.isArray(value) && !Array.isArray(d.workflow[key as keyof typeof d.workflow]))) { d.workflow = createWorkflowSeed(d); d.permissions = grantWorkflow(d.permissions, d.roles); d.programs = d.programs.map(p => p.id === 'operators' && !p.actions?.includes('approve') ? { ...p, actions: [...(p.actions || []), 'approve'] } : p) }
        if (!d.hub || !validHub(d.hub, d.stores)) d.hub = createHubSeed(d.stores)
        expandAssociationDemo(d)
        synchronizeHub(d.hub, d.stores)
        d.stores = d.stores.map(s => { const c = d.hub.connections.find(c => c.storeId === s.id)!; return { ...s, posId: c.posId, posConnectionStatus: c.status } })
        return d
      }
    }
  } catch { /* 저장 차단/손상 시 기본 데이터와 메모리 상태를 사용한다. */ }
  return structuredClone(seed)
}

// Add the new review entry once, inheriting existing grants/denials without touching workflow records.
export function splitReviewNavigation(data:PlatformData):void {
 const membership=data.programs.find(p=>p.id==='membership-review'),operators=data.programs.find(p=>p.id==='operators')
 if(membership?.name==='가입·참여 심사')membership.name='회원가입 심사'
 if(operators?.name==='운영자 계정 현황')operators.name='관리자 계정 관리'
 data.permissions.forEach(p=>{if(p.programId==='membership-review'&&p.menuLabel==='가입·참여 심사')p.menuLabel='회원가입 심사';if(p.programId==='operators'&&p.menuLabel==='운영자 계정 현황')p.menuLabel='관리자 계정 관리'})
 if(data.programs.some(p=>p.id==='participation-review'))return
 const next=structuredClone(seed.programs.find(p=>p.id==='participation-review')!)
 next.order=(membership?.order||next.order||0)+1
 if(membership){next.active=membership.active;next.parentId=membership.parentId;next.group=membership.group}
 data.programs.push(next)
 const allowed=new Set(data.roles.filter(r=>r.family==='association'||r.family==='system').map(r=>r.id))
 for(const p of data.permissions.filter(p=>p.programId==='membership-review'&&allowed.has(p.roleId)))data.permissions.push({...p,programId:next.id,actions:[...p.actions],menuLabel:undefined})
 for(const p of data.organizationPermissionOverrides.filter(p=>p.programId==='membership-review'&&allowed.has(p.roleId)))data.organizationPermissionOverrides.push({...p,programId:next.id,actions:[...p.actions]})
}
export function saveData(data: PlatformData): boolean {
  try { localStorage.setItem(DATA_KEY, JSON.stringify({ version: 2, data })); return true } catch { return false }
}
