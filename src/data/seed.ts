import { expandAssociationDemo } from './associationDemo.ts'
import { createHubSeed } from './hubSeed.ts'
import { createWorkflowSeed } from './workflowSeed.ts'
import { grantWorkflow } from './workflowPermissions.ts'
import * as master from './platform.ts'
import * as navigation from '../navigation/programs.ts'
import type { Action, PlatformData } from '../types/platform.ts'

export const actionLabels: Record<Action, string> = { view: '조회', create: '등록', edit: '수정', deactivate: '삭제(비활성)', allocate: '예산 배정', reserve: '예비비 조정', recover: '예산 회수', judge: '최종 판정', pay: '지급 처리', approve: '승인', reject: '반려', submit: '정산 상신', review: '재심사 처리' }
export const basicActions: Action[] = ['view', 'create', 'edit', 'deactivate']
const special: Record<string, Action[]> = { 'membership-review': ['approve', 'reject'], 'participation-review': ['approve', 'reject'], operators: ['approve'], budget: ['allocate', 'reserve', 'recover'], 'week-plan': ['approve', 'reject'], claims: ['submit'], appeals: ['review', 'judge'], settlement: ['judge', 'pay'] }
export const corePrograms = ['organizations', 'accounts', 'permissions', 'businesses', 'business-organizations', 'business-programs', 'programs', 'program-status']
const hub = createHubSeed(master.stores)
export const seed: PlatformData = {
  workflow: createWorkflowSeed(master),
  hub,
  businessOrganizations: master.businessOrganizations,
  companies: master.companies,
  stores: master.stores.map(s => { const c = hub.connections.find(c => c.storeId === s.id)!; return { ...s, posId: c.posId, posConnectionStatus: c.status } }),
  participations: master.participations,
  businessPrograms: navigation.businessPrograms,
  organizationPermissionOverrides: navigation.organizationPermissionOverrides,
  roles: master.roles.map(r => ({ ...r, active: true, protected: r.id === 'system' })),
  organizations: [...master.organizations.map((o, i) => ({ ...o, code: `ORG-${String(i + 1).padStart(3, '0')}`, contactName: i === 5 ? '김한빛' : '시연 담당자', phone: '02-0000-0000' })), { id: 'dormant-org', parentId: null, code: 'ORG-013', name: '휴면 유통조직', type: '기업', active: false, contactName: '이담당', phone: '02-0000-0000' }],
  businesses: [...master.businesses.map(b => ({ ...b, applicationRequired: true, approvalRequired: true, applicationUnit: '점포', participationPolicy: '신청 후 심사·승인', withdrawalPolicy: '철회 신청 후 미처리 업무 확인' })), { id: 'fish-2025', code: 'FISH-2025', name: '2025 수산대전', description: '종료 사업의 이력 조회 예시', status: 'ended', startsOn: '2025-01-01', endsOn: '2025-12-31', applicationOpen: false, approvalRequired: true, applicationUnit: '점포', participationPolicy: '승인 후 참여', withdrawalPolicy: '미처리 업무 확인' }],
  accounts: [...master.accounts.map(a => ({ ...a, phone: '010-0000-0000', lastLogin: '2026-10-05 09:00' })),
    { id: 'account-deputy', loginId: 'mart.deputy', name: '한빛 부관리자', organizationId: 'hanbit-org', roleId: 'martDeputy', companyId: 'hanbit', status: 'pending', storeAccess: ['main', 'gangseo'] },
    { id: 'account-staff', loginId: 'mart.staff', name: '강서점 운영자', organizationId: 'hanbit-org', roleId: 'martStaff', companyId: 'hanbit', status: 'suspended', storeAccess: ['gangseo'] },
    { id: 'account-former', loginId: 'mart.former', name: '이전 마곡점 운영자', organizationId: 'hanbit-org', roleId: 'martStaff', companyId: 'hanbit', status: 'inactive', storeAccess: ['magok'] }],
  programs: navigation.programs.map((p, i) => ({ ...p, code: p.id.toUpperCase(), parentId: null, order: (i + 1) * 10, actions: [...basicActions, ...(special[p.id] ?? [])], protected: corePrograms.includes(p.id) })),
  permissions: grantWorkflow(navigation.permissions.map(p => ({ ...p, actions: p.roleId === 'system' ? [...basicActions, ...(special[p.programId] ?? [])] : p.actions })), master.roles),
  changes: [],
}

expandAssociationDemo(seed, true)

export const businessRoleLabels = { supervisor: '관리감독기관', operator: '운영기관', participant: '참여조직', store: '실행점포' }
