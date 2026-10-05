import { seed } from '../data/seed.ts'
import type { Account, Action, Business, Organization, Program, PlatformData } from '../types/platform.ts'

export function descendantIds(rootId: string, data: PlatformData = seed): Set<string> {
  const { organizations } = data
  const ids = new Set<string>([rootId])
  const pending = [rootId]
  while (pending.length) {
    const parent = pending.pop()
    for (const org of organizations) if (org.parentId === parent && !ids.has(org.id)) { ids.add(org.id); pending.push(org.id) }
  }
  return ids
}
export const getRole = (account: Account, data: PlatformData = seed) => data.roles.find((r) => r.id === account.roleId)!
export function availableBusinesses(account: Account, data: PlatformData = seed): Business[] {
  const { businesses, businessOrganizations } = data
  if (getRole(account, data).scope === 'all') return businesses
  const linked = new Set(businessOrganizations.filter((link) => link.organizationId === account.organizationId).map((link) => link.businessId))
  // 마트의 미참여 사업은 신청 안내를 위해 선택 가능하되 데이터/운영 권한을 부여하지 않는다.
  return businesses.filter((business) => linked.has(business.id) || (getRole(account, data).family === 'mart' && business.applicationOpen))
}
export function scopedStores(account: Account, businessId: string, data: PlatformData = seed) {
  const { stores, participations } = data
  if (!availableBusinesses(account, data).some((b) => b.id === businessId)) return []
  const organizationIds = descendantIds(account.organizationId, data)
  const base = stores.filter((store) => {
    if (getRole(account, data).scope === 'all' || getRole(account, data).scope === 'business') return true
    if (Array.isArray(account.storeAccess)) return store.companyId === account.companyId && account.storeAccess.includes(store.id)
    if (account.storeAccess === 'company') return store.companyId === account.companyId
    return organizationIds.has(store.organizationId)
  })
  return base.filter((store) => participations.some((p) => p.businessId === businessId && p.storeId === store.id && p.status !== 'none'))
}
export function scopedOrganizations(account: Account, businessId: string, data: PlatformData = seed): Organization[] {
  const { organizations, businessOrganizations } = data
  if (getRole(account, data).scope === 'all') return organizations
  if (getRole(account, data).scope === 'business') {
    const ids = new Set(businessOrganizations.filter((link) => link.businessId === businessId).map((link) => link.organizationId))
    return availableBusinesses(account, data).some((b) => b.id === businessId) ? organizations.filter((o) => ids.has(o.id)) : []
  }
  if (getRole(account, data).scope === 'stores') {
    const ids = new Set(scopedStores(account, businessId, data).map((s) => s.organizationId))
    ids.add(account.organizationId)
    return organizations.filter((o) => ids.has(o.id))
  }
  const ids = descendantIds(account.organizationId, data)
  return organizations.filter((o) => ids.has(o.id))
}
export const scopedCompanies = (account: Account, businessId: string, data: PlatformData = seed) => {
  const { companies } = data
  const ids = new Set(scopedStores(account, businessId, data).map((s) => s.companyId))
  return companies.filter((c) => ids.has(c.id))
}
export function actionsFor(account: Account, programId: string, data: PlatformData = seed): Action[] {
  const { organizationPermissionOverrides, permissions } = data
  if (!accountEnabled(account, data)) return []
  if (account.roleId === 'system') return data.programs.find(p => p.id === programId)?.actions ?? ['view']
  const override = organizationPermissionOverrides.find((p) => p.organizationId === account.organizationId && p.roleId === account.roleId && p.programId === programId)
  const grant = permissions.find((p) => p.roleId === account.roleId && p.programId === programId)
  return (account.roleId !== 'system' && override ? override.actions : grant?.actions) ?? []
}
export function canAccessProgram(account: Account, businessId: string, program: Program, data: PlatformData = seed): boolean {
  const { businessPrograms, participations } = data
  if (!programEnabled(program, data) || !actionsFor(account, program.id, data).includes('view')) return false
  if (!usesBusinessContext(program)) return true
  if (!availableBusinesses(account, data).some((b) => b.id === businessId)) return false
  if (program.scope !== 'business') return true
  if (!businessPrograms.some((m) => m.businessId === businessId && m.programId === program.id)) return false
  if (getRole(account, data).family !== 'mart') return true
  // 중지 이력도 조회 대상. 미참여/심사 단계에는 운영 화면을 노출하지 않는다.
  return scopedStores(account, businessId, data).some((store) => participations.some((p) => p.storeId === store.id && p.businessId === businessId && ['active', 'stopping', 'stopped'].includes(p.status)))
}
// scope는 메뉴/권한 영역, contextScope는 전역 관리 화면 안에서 사업을 조회하는 경우다.
export function usesBusinessContext(program: Program): boolean {
  return program.scope === 'business' || program.contextScope === 'business'
}
// 프로그램 마스터의 데이터 집합은 선택 사업에 의해 축소되지 않는다.
export function programCatalogFor(account: Account, data: PlatformData = seed): Program[] {
  const { programs } = data
  return programs.filter((program) => actionsFor(account, program.id, data).includes('view'))
}
export function navigationFor(account: Account, businessId: string, data: PlatformData = seed) {
  const { programs, permissions } = data
  return programs.filter((program) => canAccessProgram(account, businessId, program, data))
    // 시스템 메뉴의 기본 IA는 플랫폼 운영. 전체 프로그램은 공통 registry 화면에서 접근 가능.
    .filter((program) => getRole(account, data).family !== 'system' || program.scope === 'platform')
    .sort((a, b) => {
      const left = menuPath(a, data); const right = menuPath(b, data)
      for (let i = 0; i < Math.min(left.length, right.length); i++) {
        if (left[i].id !== right[i].id) return (left[i].order ?? 0) - (right[i].order ?? 0) || left[i].id.localeCompare(right[i].id)
      }
      return left.length - right.length
    })
    .map((program) => {
      const grant = permissions.find((p) => p.roleId === account.roleId && p.programId === program.id)
      const path = menuPath(program, data)
      return { ...program, depth: path.length - 1, name: grant?.menuLabel ?? program.name, group: grant?.menuGroup ?? path[0].group }
    })
}

function menuPath(program: Program, data: PlatformData): Program[] {
  const path = [program]; const seen = new Set([program.id])
  let parent = data.programs.find(p => p.id === program.parentId)
  while (parent && !seen.has(parent.id)) { path.unshift(parent); seen.add(parent.id); parent = data.programs.find(p => p.id === parent?.parentId) }
  return path
}

export function accountEnabled(account: Account, data: PlatformData = seed): boolean {
 if (account.status !== 'active' || !data.roles.some(r => r.id === account.roleId && r.active !== false)) return false
 let org = data.organizations.find(o => o.id === account.organizationId)
 const visited = new Set<string>()
 while (org) { if (!org.active || visited.has(org.id)) return false; visited.add(org.id); org = data.organizations.find(o => o.id === org?.parentId) }
 return visited.size > 0
}
export function programEnabled(program: Program, data: PlatformData): boolean {
 let item: Program | undefined = program; const seen = new Set<string>()
 while(item) { if (!item.active || seen.has(item.id)) return false; seen.add(item.id); item = data.programs.find(p => p.id === item?.parentId) }
 return true
}
