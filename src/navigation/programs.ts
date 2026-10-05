import type { Action, BusinessProgram, OrganizationPermissionOverride, Permission, Program, ProgramScope, RoleId } from '../types/platform.ts'

function section(group: string, scope: ProgramScope, rows: [string, string, string][], contextScope?: 'business'): Program[] {
  return rows.map(([id, name, description]) => ({ id, name, description, group, scope, contextScope: id==='participation-review'?'business':contextScope, active: true }))
}
export const programs: Program[] = [
  ...section('조직·계정 관리', 'platform', [
    ['organizations', '조직 관리', '사업과 독립된 조직 계층과 소속 관계를 관리합니다.'],
    ['accounts', '관리자 계정 관리', '조직과 Role에 따른 운영계정과 상태를 관리합니다.'],
    ['permissions', '권한 관리', 'Role별 메뉴·액션 권한과 조직 예외권한을 관리합니다.'],
  ]),
  ...section('사업 관리', 'platform', [
    ['businesses', '사업 마스터', '사업 기간·상태·참여정책을 관리합니다.'],
  ]),
  ...section('사업 관리', 'platform', [
    ['business-organizations', '참여 조직·역할', '사업과 조직의 연결 및 사업 내 역할을 관리합니다.'],
    ['business-programs', '사업-프로그램 매핑', '사업에서 사용할 프로그램을 연결합니다.'],
  ], 'business'),
  ...section('프로그램 관리', 'platform', [
    ['programs', '메뉴/프로그램 관리', '프로그램 목록과 접근 가능한 화면을 확인합니다.'],
    ['program-status', '사용·중지', '프로그램 변경이 관련 사업과 Role에 미치는 영향을 확인합니다.'],
  ]),
  ...section('POS 연동 HUB', 'platform', [
    ['pos-master', 'POS 마스터', 'POS 제품과 담당정보를 관리합니다.'],
    ['pos-capabilities', 'Capability', 'POS 기능별 지원 여부를 관리합니다.'],
    ['pos-interfaces', '데이터소스·인터페이스', '연동 프로파일과 입력 경로를 관리합니다.'],
    ['pos-schema', '표준 스키마', '업무에 필요한 표준 데이터 필드를 관리합니다.'],
    ['pos-mapping', '필드·코드 매핑', 'POS 원천과 표준 필드를 연결합니다.'],
    ['pos-connections', '점포 POS 연동', '점포 설정·연결테스트·데이터검증·활성화를 관리합니다.'],
    ['pos-history', '연동 현황·이력', '점포 연동 상태와 처리 이력을 확인합니다.'],
  ]),
  ...section('외부 연동', 'platform', [
    ['integration-at', 'AT', 'AT 송수신 상태와 Excel 대체 경로를 관리합니다.'],
    ['integration-public', '알뜰소비플랫폼', '공개 데이터의 전송 상태를 관리합니다.'],
    ['integration-finance', '금융', '이체파일 및 지급결과 연결을 관리합니다.'],
    ['integration-other', '기타 연동', '범용 외부 연동과 수동 처리 경로를 관리합니다.'],
  ]),
  ...section('시스템 운영', 'platform', [
    ['excel-templates', 'Excel 양식', '업무별 파일 양식과 버전을 관리합니다.'],
    ['jobs', '자동 작업 현황', '작업 결과와 오류, 다음 실행을 확인합니다.'],
    ['notifications', '알림 관리', '알림 대상·시점·임계값을 관리합니다.'],
    ['codes', '공통코드', '업무에서 공유할 코드와 표시명을 관리합니다.'],
    ['audit', '감사·변경 이력', '주요 작업과 변경 전후 이력을 확인합니다.'],
  ]),
  ...section('회원·조직 관리', 'organization', [
    ['membership-review', '회원가입 심사', '소속 운영기관의 회원가입 신청을 심사합니다.'],
    ['participation-review', '사업 참여 심사', '선택 사업의 회원사 신청과 참여점포를 심사합니다.'],
    ['companies', '회원사 관리', '회원사 공식정보와 점포·사업 관계를 확인합니다.'],
    ['operators', '관리자 계정 관리', '소속 운영자 계정과 상태를 확인합니다.'],
    ['branches', '지회 관리', '지회와 소속 회원사 관계를 관리합니다.'],
    ['fees', '회비·수납', '납부·미납과 입금 매칭을 확인합니다.'],
    ['branch-info', '지회 정보', '자기 지회 정보와 허용된 수정 항목을 확인합니다.'],
  ]),
  ...section('회원사 관리', 'organization', [
    ['company-profile', '회원사 정보', '공식정보와 운영정보의 수정 범위를 구분합니다.'],
    ['stores', '점포 운영 관리', '회원사에 속한 점포의 운영정보를 관리합니다.'],
    ['company-accounts', '관리자 계정 관리', '관리자 가입승인과 점포 접근범위를 관리합니다.'],
  ]),
  ...section('사업 참여 관리', 'participation', [
    ['join-nonghal', '농할 참여', '회원사 신청과 점포별 농할 참여 상태를 확인합니다.'],
    ['join-public', '알뜰소비 참여', '알뜰소비 참여 신청 및 철회 경로입니다.'],
    ['join-future', '향후 사업', '새로운 사업의 조건과 참여 안내를 확인합니다.'],
  ]),
  ...section('농할 운영', 'business', [
    ['budget', '예산 관리', '배정·예비비·회수·정산환원을 원장으로 관리합니다.'],
    ['week-plan', '주차별 계획', 'AT 원천 계획과 협회 운영값을 구분합니다.'],
    ['event-products', '행사상품 등록현황', '대표상품과 판매상품의 매핑·검증·확정을 확인합니다.'],
    ['execution', '집행 실적', '점포·품목·거래별 집행 현황을 확인합니다.'],
    ['anomalies', '이상 감지', '사전 위험과 원천 거래를 확인합니다.'],
  ]),
  ...section('농할 정산', 'business', [
    ['claims', '정산 청구', '정산 차수별 최초 청구와 제출 원본을 관리합니다.'],
    ['appeals', '불인정·재심사', '건별 소명과 검토·최종 판정의 이력을 확인합니다.'],
    ['settlement', '최종 정산·지급', '최종금액 확정과 협회 입금·점포 지급을 구분합니다.'],
  ]),
  ...section('알뜰소비플랫폼', 'business', [
    ['public-participation', '참여 관리', '공개사업 참여점포와 공개 현황을 확인합니다.'],
    ['public-data', '공개 데이터', '유효한 농할·행사상품만 선별하여 공개합니다.'],
    ['flyers', '전단 게시', '전단의 상품후보 확인과 게시기간을 관리합니다.'],
    ['consumer-preview', '소비자 노출 미리보기', '현재 공개 화면과 다음 반영 예정 화면을 비교합니다.'],
    ['public-history', '연동 현황·이력', '최근 성공·실패와 재전송 이력을 확인합니다.'],
  ]),
  ...section('홈페이지 관리', 'organization', [
    ['cms-posts', '게시판·게시물', '홈페이지 게시 콘텐츠를 관리합니다.'],
    ['cms-banners', '배너·팝업', '홈페이지의 배너와 팝업을 관리합니다.'],
    ['cms-content', '메뉴·콘텐츠', '홈페이지 메뉴와 콘텐츠를 관리합니다.'],
    ['cms-signup', '회원가입 안내', '회원사 가입 안내와 심사 연결을 관리합니다.'],
  ]),
  ...section('공통', 'organization', [
    ['notices', '공지사항', '소속 조직과 대상에 맞는 공지를 확인합니다.'],
    ['statistics', '종합 통계', '허용된 범위의 회원·농할·정산·공개 통계를 확인합니다.'],
    ['association-settings', '협회 설정', '소속 운영조직의 허용된 운영설정을 관리합니다.'],
  ]),
]

// 업무 연결은 표시용 메뉴 그룹과 독립적이다. 메뉴를 재배치해도 사업 연결은 유지한다.
const settlementProgramIds = ['claims', 'appeals', 'settlement']
export const businessPrograms: BusinessProgram[] = [
  ...['budget', 'week-plan', 'event-products', 'execution', 'anomalies', ...settlementProgramIds].map((programId) => ({ businessId: 'nonghal-2026', programId })),
  ...['public-participation', 'public-data', 'flyers', 'consumer-preview', 'public-history'].map((programId) => ({ businessId: 'public-2026', programId })),
]
const nonghal = ['week-plan', 'event-products', 'execution', 'claims', 'appeals', 'settlement']
const publicView = ['public-participation', 'public-data', 'flyers', 'public-history']
const mart = ['company-profile', 'stores', 'join-nonghal', 'join-public', 'join-future', 'event-products', 'execution', 'anomalies', 'claims', 'appeals', 'settlement', 'public-data', 'flyers', 'consumer-preview', 'public-history', 'notices']
const viewLists: Record<RoleId, string[]> = {
  system: programs.map((p) => p.id),
  at: [...nonghal.filter((id) => id !== 'event-products'), ...publicView, 'statistics'],
  association: ['membership-review', 'participation-review', 'companies', 'operators', 'branches', 'fees', 'budget', ...nonghal, 'anomalies', ...publicView, 'notices', 'statistics', 'cms-posts', 'cms-banners', 'cms-content', 'cms-signup', 'association-settings'],
  branch: ['companies', 'branch-info', 'fees', ...nonghal, ...publicView, 'notices'],
  martOwner: [...mart, 'company-accounts'],
  martDeputy: mart,
  martStaff: mart.filter((id) => id !== 'company-profile'),
}
const labels: Partial<Record<RoleId, Record<string, string>>> = {
  at: { 'week-plan': '주차별 계획 관리', execution: '운영 현황', claims: '청구 내역 관리', settlement: '최종 정산', 'public-participation': '참여 현황' },
  martOwner: { 'event-products': '행사상품 등록' }, martDeputy: { 'event-products': '행사상품 등록' }, martStaff: { 'event-products': '행사상품 등록' },
  branch: { companies: '회원사 관리', 'event-products': '행사상품', claims: '정산 청구', settlement: '최종 정산' },
}
// 상세 업무 액션은 구현 전까지 기본 거부. 이번 단계에서는 조회만 제공한다.
export const permissions: Permission[] = Object.entries(viewLists).flatMap(([roleId, ids]) => ids.map((programId) => ({
  roleId: roleId as RoleId, programId, actions: ['view' as Action], menuLabel: labels[roleId as RoleId]?.[programId],
  menuGroup: settlementProgramIds.includes(programId) ? (roleId === 'at' ? '정산 관리' : roleId === 'branch' ? '농할 운영' : undefined) : undefined,
})))
export const organizationPermissionOverrides: OrganizationPermissionOverride[] = []
