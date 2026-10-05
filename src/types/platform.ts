import type { HubData } from './hub.ts'
import type { WorkflowData } from './workflow.ts'
import type { StatusCode } from './status.ts'

export type RoleId = string
export type RoleFamily = 'system' | 'at' | 'association' | 'branch' | 'mart'
export type Action = 'view' | 'create' | 'edit' | 'deactivate' | 'allocate' | 'reserve' | 'recover' | 'judge' | 'pay' | 'approve' | 'reject' | 'submit' | 'review'
export interface Role { active?: boolean; protected?: boolean; id: RoleId; family: RoleFamily; name: string; scope: 'all' | 'business' | 'organization' | 'company' | 'stores' }
export interface Organization { code?: string; contactName?: string; phone?: string; id: string; parentId: string | null; name: string; type: string; active: boolean }
export interface Business { applicationRequired?: boolean; approvalRequired?: boolean; applicationUnit?: string; participationPolicy?: string; withdrawalPolicy?: string; id: string; code: string; name: string; description: string; status: StatusCode<'business'>; startsOn: string; endsOn: string; applicationOpen: boolean }
export interface BusinessOrganization { businessId: string; organizationId: string; role: 'supervisor' | 'operator' | 'participant' | 'store' }
export interface MemberCompany { id: string; organizationId: string; legalName: string; representativeName: string }
export interface Store { id: string; organizationId: string; companyId: string; name: string; region: string; posId: string | null; posConnectionStatus: StatusCode<'posConnection'> }
export interface StoreParticipation { businessId: string; storeId: string; status: StatusCode<'participation'> }
export interface Account { phone?: string; lastLogin?: string; id: string; loginId: string; name: string; organizationId: string; roleId: RoleId; status: StatusCode<'account'>; companyId?: string; storeAccess: 'organization' | 'company' | string[] }
export type ProgramScope = 'platform' | 'organization' | 'business' | 'participation'
export interface Program { code?: string; parentId?: string | null; order?: number; actions?: Action[]; protected?: boolean; id: string; name: string; group: string; scope: ProgramScope; description: string; active: boolean; contextScope?: 'business' }
export interface BusinessProgram { businessId: string; programId: string }
export interface Permission { roleId: RoleId; programId: string; actions: Action[]; menuLabel?: string; menuGroup?: string }
export interface OrganizationPermissionOverride { organizationId: string; roleId: RoleId; programId: string; actions: Action[] }

export interface PlatformData {
  workflow: WorkflowData
  hub: HubData
  roles: Role[]; organizations: Organization[]; businesses: Business[]; businessOrganizations: BusinessOrganization[];
  companies: MemberCompany[]; stores: Store[]; participations: StoreParticipation[]; accounts: Account[];
  programs: Program[]; businessPrograms: BusinessProgram[]; permissions: Permission[];
  organizationPermissionOverrides: OrganizationPermissionOverride[];
  changes: { id: string; at: string; actorId: string; entity: string; before: unknown; after: unknown }[];
}
