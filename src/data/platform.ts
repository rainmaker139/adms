import type { Account, Business, BusinessOrganization, MemberCompany, Organization, Role, Store, StoreParticipation } from '../types/platform.ts'

export const roles: Role[] = [
  { id: 'system', family: 'system', name: '시스템 관리자', scope: 'all' },
  { id: 'at', family: 'at', name: 'AT / 관리감독기관', scope: 'business' },
  { id: 'association', family: 'association', name: '협회 / 운영기관', scope: 'organization' },
  { id: 'branch', family: 'branch', name: '지회 관리자', scope: 'organization' },
  { id: 'martOwner', family: 'mart', name: '마트 대표 관리자', scope: 'company' },
  { id: 'martDeputy', family: 'mart', name: '마트 부관리자', scope: 'stores' },
  { id: 'martStaff', family: 'mart', name: '마트 일반 관리자', scope: 'stores' },
]
export const organizations: Organization[] = [
  { id: 'platform', parentId: null, name: 'ADMS 플랫폼 운영', type: '플랫폼', active: true },
  { id: 'at-org', parentId: null, name: 'aT', type: '공공기관', active: true },
  { id: 'assn-org', parentId: null, name: '한국마트협회', type: '협회', active: true },
  { id: 'gyeonggi', parentId: 'assn-org', name: '경기지회', type: '지회', active: true },
  { id: 'gangwon', parentId: 'assn-org', name: '강원지회', type: '지회', active: true },
  { id: 'hanbit-org', parentId: 'gyeonggi', name: '한빛유통(주)', type: '회원사', active: true },
  { id: 'main-org', parentId: 'hanbit-org', name: '한빛마트 본점', type: '점포', active: true },
  { id: 'gangseo-org', parentId: 'hanbit-org', name: '한빛마트 강서점', type: '점포', active: true },
  { id: 'magok-org', parentId: 'hanbit-org', name: '한빛마트 마곡점', type: '점포', active: true },
  { id: 'other-org', parentId: null, name: '지역유통연합 (확장 예시)', type: '운영기관', active: true },
  { id: 'other-company-org', parentId: 'other-org', name: '새봄유통 (예시)', type: '회원사', active: true },
  { id: 'other-store-org', parentId: 'other-company-org', name: '새봄마트 (예시)', type: '점포', active: true },
]
export const businesses: Business[] = [
  { id: 'nonghal-2026', code: 'NH-2026', name: '2026 농축산물 할인지원', description: '주차별 계획부터 집행·정산·지급까지 연결하는 할인지원 사업', status: 'active', startsOn: '2026-01-01', endsOn: '2026-12-31', applicationOpen: true },
  { id: 'public-2026', code: 'PC-2026', name: '알뜰소비플랫폼', description: '참여점포의 농할·행사상품과 전단을 선별 공개하는 사업', status: 'active', startsOn: '2026-01-01', endsOn: '2026-12-31', applicationOpen: true },
  { id: 'pilot-2027', code: 'DEMO-2027', name: '지역 상생사업 (확장 예시)', description: '다른 운영기관과 준비 상태를 확인하기 위한 가상 사업', status: 'planned', startsOn: '2027-01-01', endsOn: '2027-12-31', applicationOpen: true },
]
// 사업 연결은 조직 트리와 독립된 N:M 레코드다. 기관 이름으로 권한을 판정하지 않는다.
export const businessOrganizations: BusinessOrganization[] = [
  ...['nonghal-2026', 'public-2026'].flatMap((businessId): BusinessOrganization[] => [
    { businessId, organizationId: 'at-org', role: 'supervisor' },
    { businessId, organizationId: 'assn-org', role: 'operator' },
    ...['gyeonggi', 'gangwon', 'hanbit-org'].map((organizationId) => ({ businessId, organizationId, role: 'participant' as const })),
    ...['main-org', 'gangseo-org', 'magok-org'].map((organizationId) => ({ businessId, organizationId, role: 'store' as const })),
  ]),
  { businessId: 'pilot-2027', organizationId: 'other-org', role: 'operator' },
  { businessId: 'pilot-2027', organizationId: 'other-company-org', role: 'participant' },
  { businessId: 'pilot-2027', organizationId: 'other-store-org', role: 'store' },
]
export const companies: MemberCompany[] = [
  { id: 'hanbit', organizationId: 'hanbit-org', legalName: '한빛유통(주)', representativeName: '김*빛' },
  { id: 'saebom', organizationId: 'other-company-org', legalName: '새봄유통 (예시)', representativeName: '이*봄' },
]
export const stores: Store[] = [
  { id: 'main', organizationId: 'main-org', companyId: 'hanbit', name: '한빛마트 본점', region: '경기', posId: 'hipos', posConnectionStatus: 'active' },
  { id: 'gangseo', organizationId: 'gangseo-org', companyId: 'hanbit', name: '한빛마트 강서점', region: '서울', posId: 'sample-pos', posConnectionStatus: 'validating' },
  { id: 'magok', organizationId: 'magok-org', companyId: 'hanbit', name: '한빛마트 마곡점', region: '서울', posId: null, posConnectionStatus: 'unset' },
  { id: 'saebom-store', organizationId: 'other-store-org', companyId: 'saebom', name: '새봄마트 (예시)', region: '강원', posId: null, posConnectionStatus: 'unset' },
]
export const participations: StoreParticipation[] = [
  ...['nonghal-2026', 'public-2026'].flatMap((businessId): StoreParticipation[] => ['main', 'gangseo', 'magok'].map((storeId) => ({ businessId, storeId, status: 'active' }))),
  { businessId: 'pilot-2027', storeId: 'saebom-store', status: 'scheduled' },
]
export const accounts: Account[] = [
  { id: 'account-admin', loginId: 'admin', name: '플랫폼 관리자', organizationId: 'platform', roleId: 'system', status: 'active', storeAccess: 'organization' },
  { id: 'account-at', loginId: 'at', name: '사업 감독 담당자', organizationId: 'at-org', roleId: 'at', status: 'active', storeAccess: 'organization' },
  { id: 'account-assn', loginId: 'assn', name: '협회 운영 담당자', organizationId: 'assn-org', roleId: 'association', status: 'active', storeAccess: 'organization' },
  { id: 'account-mart', loginId: 'mart', name: '한빛유통 대표 관리자', organizationId: 'hanbit-org', roleId: 'martOwner', companyId: 'hanbit', status: 'active', storeAccess: 'company' },
]
// 공개 시연 전용 자격정보. 운영용 인증 또는 실제 비밀번호 보관 방식이 아니다.
export const demoCredentials = accounts.map((account) => ({ accountId: account.id, loginId: account.loginId, password: '1234' }))
