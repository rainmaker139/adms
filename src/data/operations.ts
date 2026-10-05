import { createSystemCatalog } from './systemCatalog.ts'
import type { OperationsData } from '../types/operations.ts'
export const notificationTypes = [
  { id: 'registration', name: '행사상품 등록 D-1 미완료', area: '농할 운영', trigger: '마감 전 미확정 점포', unit: '일 전', min: 1, max: 30 },
  { id: 'budget', name: '예산 소진율 임계값 초과', area: '예산', trigger: '소진율 ≥ 기준값', unit: '%', min: 1, max: 100 },
  { id: 'no-sales', name: 'N시간 무실적', area: '농할 운영', trigger: '집행중 마지막 실적 경과', unit: '시간', min: 1, max: 168 },
  { id: 'pos-delay', name: 'POS 데이터 수집 지연', area: 'POS HUB', trigger: '마지막 수집 경과', unit: '분', min: 1, max: 1440 },
  { id: 'disallowance', name: '불인정 발생', area: '정산', trigger: '불인정건 생성', unit: '', min: 0, max: 0 },
  { id: 'review', name: '재심사 결과', area: '정산', trigger: '재심사 최종 판정', unit: '', min: 0, max: 0 },
  { id: 'payment', name: '지급 완료', area: '지급', trigger: '지급건 완료', unit: '', min: 0, max: 0 },
]
export const jobStatus = { healthy: '정상', delayed: '지연', failed: '실패', stopped: '중지' }
export const versionStatus = { active: '활성', stopped: '중지', expired: '만료' }
export function createOperationsSeed(): OperationsData {
  const at = '2026-10-05T00:00:00Z'
  const templateSpecs = [
    ['회원사 초기 데이터', '회원', '회원사코드,법인명,지회코드', '대표자,연락처', '회원사 초기이관'],
    ['농할 행사상품 등록', '농할 운영', '점포코드,주차,대표상품코드,POS상품명', '규격,원산지', '행사상품 등록'],
    ['예산 배정', '예산', '사업코드,점포코드,배정금액', '가중치,사유', '예산 가중배분'],
    ['주간 실적', '농할 운영', '점포코드,거래ID,거래일시,수량,지원금', '원거래ID', '판매실적 결과보고'],
    ['정산 청구', '정산', '정산차수,점포코드,청구금액', '메모', '최초 정산청구'],
    ['불인정/재심사', '정산', '불인정ID,거래ID,판정,사유', '증빙ID', 'AT 결과/재심사 결과'],
    ['소비자 플랫폼 전단/상품', '소비자 플랫폼', '점포코드,상품명,시작일,종료일', '전단ID', '공개 데이터'],
    ['기타 외부기관 제출양식', '외부 연동', '기관코드,제출ID', '비고', '외부 제출'],
  ]
  const templates = templateSpecs.map(([name, area, required, optional, usage], i) => ({ id: `template-${i}`, name, area, usage, description: '공식 Interface 관리 시연용 예시. 기관별 실제 컬럼과 파싱 규격은 협의 후 확정합니다.', versions: [
    { id: `version-${i}-1`, version: '1.0', startsOn: '2025-01-01', endsOn: '2025-12-31', status: 'expired' as const, required: required.split(','), optional: optional.split(','), parserRef: `mock-parser-${i}-v1`, modifiedAt: at },
    { id: `version-${i}-2`, version: '2.0', startsOn: '2026-01-01', endsOn: '', status: i === 7 ? 'stopped' as const : 'active' as const, required: required.split(','), optional: optional.split(','), parserRef: `mock-parser-${i}-v2`, modifiedAt: at },
  ] }))
  const names = ['POS 판매데이터 수집', '농할 예외 재검증', '소비자 플랫폼 데이터 전송', '정산 데이터 취합', '입금내역 확인', '알림 발송']
  const jobs = names.map((name, i) => ({ id: `job-${i}`, name, area: ['POS HUB', '농할 운영', '소비자 플랫폼', '정산', '금융', '알림'][i], frequency: ['15분마다', '1시간마다', '30분마다', '매일 09:00', '1시간마다', '5분마다'][i], status: (['healthy', 'delayed', 'failed', 'healthy', 'stopped', 'healthy'] as const)[i], nextAt: i === 4 ? '중지 · 예정 없음' : '2026-10-05 10:00 (Mock)', runs: [
    { id: `run-${i}-old`, at: '2026-10-04T00:00:00Z', result: 'success' as const, count: 24, seconds: 3, message: '내장 Mock 처리 완료' },
    { id: `run-${i}-last`, at, result: i === 2 ? 'failure' as const : 'success' as const, count: i === 2 ? 0 : 12, seconds: 4, message: i === 2 ? 'MOCK_TIMEOUT: 소비자 플랫폼 응답 지연' : i === 1 ? '다음 작업 실행 지연 감지' : '내장 Mock 처리 완료' },
  ] }))
  const notifications = notificationTypes.map((t, i) => ({ id: t.id, active: i !== 2, roleIds: ['association'], organizationIds: [], channels: ['시스템 알림'], timing: '조건 충족 시', repeat: i < 4, threshold: t.unit ? [1, 80, 6, 30][i] : null }))
  const examples = ['조직 변경', '관리자 계정/Role 변경', '권한 변경', '사업 설정 변경', '프로그램 변경', 'POS 및 연동설정 변경', '예산/예비비 변경', '정산 확정', '불인정/재심사', '지급 처리', 'Excel Upload/반영', '외부연동 재처리']
  const events = examples.map((menu, i) => ({ id: `audit-sample-${i}`, at, actor: '시연 관리자', organizationId: 'platform', role: '시스템 관리자', businessId: i >= 6 && i <= 10 ? 'nonghal-2026' : '', menu, action: i === 11 ? '재처리' : '변경', entity: `sample-entity-${i}`, summary: `${menu} · 내장 예시 이력`, result: i === 11 ? 'failure' as const : 'success' as const, before: { 상태: '변경 전 예시' }, after: { 상태: i === 11 ? '실패' : '변경 후 예시' }, reason: '시연용 Seed · 실제 업무 처리 기록 아님', related: i === 10 ? 'mock-upload-001.csv' : `mock-link-${i}` }))
  return { ...createSystemCatalog(), version: 1, templates, jobs, notifications, events }
}
