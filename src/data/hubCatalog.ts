import type { Capability, Method, SchemaField, StepId } from '../types/hub.ts'

export const methods: Method[] = ['API', 'DB', 'Agent', 'File', 'Excel']
export const directionLabels = { read: 'Read · 수신', write: 'Write · 송신', both: '양방향' }
export const stepLabels: Record<StepId, string> = { connect: '연결 테스트', identity: '점포 식별 확인', sample: 'Sample 데이터 수신', mapping: 'Schema Mapping 검증', capabilities: 'Capability별 데이터 검증' }
export const stepOrder = Object.keys(stepLabels) as StepId[]
export const testLabels = { waiting: '대기', success: '성공', failure: '실패' }
export const mappingLabels = { complete: '완료', unmapped: '미매핑', review: '검증필요', error: '오류' }
export const schemaNames = ['Store', 'Product', 'Event', 'Budget', 'SaleTransaction', 'SettlementTransaction', 'Member']
type Definition = [string, string, SchemaField['type'], boolean, string, string, string?]
const fields = (schema: string, definitions: Definition[]): SchemaField[] => definitions.map(([name, label, type, required, source, sample, description]) => ({ id: `${schema}.${name}`, schema, name, label, type, required, source, sample, description: description ?? `${label} · 시연 표준 필드` }))
const transactionFields: Definition[] = [
  ['store_id', '점포 식별자', 'string', true, 'STORE_CD', 'DEMO-MAIN'],
  ['member_id', '회원/고객 ID', 'string', true, 'MEMBER_NO', 'M***102'],
  ['transaction_id', '거래번호', 'string', true, 'SALE_NO', 'TX-DEMO-1001'],
  ['receipt_no', '승인번호 또는 영수증번호', 'string', true, 'RECEIPT_NO', 'R-DEMO-1001', 'POS별 승인번호/영수증번호 대체 관계는 실제 규격 협의 대상'],
  ['transaction_at', '거래일시', 'datetime', true, 'SALE_DATE', '2026-10-05T10:20:00'],
  ['product_code', '상품코드', 'string', true, 'ITEM_CD', 'APPLE-001'],
  ['product_name', '상품명', 'string', true, 'ITEM_NM', '사과 1봉'],
  ['quantity', '수량', 'number', true, 'QTY', '2'],
  ['normal_price', '정상판매가', 'number', true, 'SALE_AMT', '12000'],
  ['store_discount', '자체할인금액', 'number', true, 'DISCOUNT_AMT', '1000'],
  ['support_amount', '농할지원금', 'number', true, 'SUPPORT_AMT', '2000'],
  ['net_amount', '순결제금액', 'number', true, 'NET_AMT', '9000'],
  ['sale_type', '정상/취소/반품 구분', 'enum', true, 'SALE_TYPE', '0', 'NORMAL / CANCEL / RETURN 표준 코드'],
  ['original_transaction_id', '원거래번호', 'string', false, 'ORIGINAL_NO', '', '정상 거래는 선택, 취소·반품은 필수인 조건부 검증 예시'],
]
export const schemaFields: SchemaField[] = [
  ...fields('Store', [['store_id', '점포 식별자', 'string', true, 'STORE_CD', 'DEMO-MAIN'], ['store_name', '점포명', 'string', true, 'STORE_NM', '한빛마트 본점']]),
  ...fields('Product', [['product_code', '상품코드', 'string', true, 'ITEM_CD', 'APPLE-001'], ['product_name', '상품명', 'string', true, 'ITEM_NM', '사과 1봉'], ['price', '판매가격', 'number', true, 'PRICE', '12000']]),
  ...fields('Event', [['event_id', '행사 식별자', 'string', true, 'EVENT_NO', 'EV-DEMO'], ['starts_on', '행사 시작일', 'datetime', true, 'START_DATE', '2026-10-08'], ['ends_on', '행사 종료일', 'datetime', true, 'END_DATE', '2026-10-14'], ['store_id', '점포 식별자', 'string', true, 'STORE_CD', 'DEMO-MAIN']]),
  ...fields('Budget', [['store_id', '점포 식별자', 'string', true, 'STORE_CD', 'DEMO-MAIN'], ['amount', '배정 예산', 'number', true, 'BUDGET_AMT', '1000000']]),
  ...fields('SaleTransaction', transactionFields), ...fields('SettlementTransaction', transactionFields),
  ...fields('Member', [['member_id', '회원 식별자', 'string', true, 'MEMBER_NO', 'M***102'], ['member_key', '마스킹 회원정보', 'string', false, 'MEMBER_KEY', '010-****-1020']]),
]
const all = (schema: string) => schemaFields.filter(f => f.schema === schema).map(f => f.id)
const cap = (id: string, group: string, name: string, schemas: string[], direction: 'read' | 'write' = 'read'): Capability => ({ id, group, name, fieldIds: schemas.flatMap(all), direction })
export const capabilities: Capability[] = [
  ...[['store', '점포정보 조회', 'Store'], ['member', '회원정보 조회', 'Member'], ['product', '상품정보 조회', 'Product'], ['price', '가격정보 조회', 'Product']].map(([id, name, schema]) => cap(id, '기본 데이터', name, [schema])),
  ...[['event', '농할 행사 조회', 'Event'], ['event-create', '농할 행사 자동생성', 'Event'], ['event-edit', '농할 행사 수정', 'Event'], ['event-product', '농할 상품 조회', 'Product'], ['event-product-edit', '농할 상품 등록/수정', 'Product'], ['budget', '농할 예산 조회', 'Budget'], ['budget-edit', '농할 예산 입력/수정', 'Budget']].map(([id, name, schema]) => cap(id, '농할 계획/행사', name, [schema], id.endsWith('edit') || id.endsWith('create') ? 'write' : 'read')),
  ...[['sales', '농할 판매실적 수집'], ['transaction', '거래상세 조회'], ['returns', '취소/반품 조회'], ['original', '원거래 연결']].map(([id, name]) => cap(id, '농할 집행', name, ['SaleTransaction'])),
  ...[['realtime', '실시간 수집'], ['batch', '배치 수집']].map(([id, name]) => ({ id, group: '농할 집행', name, fieldIds: [], technical: true })),
  ...[['settlement', '정산 거래데이터 수집'], ['member-identity', '회원 식별정보 제공'], ['support', '지원금/할인금액 제공'], ['settlement-fields', '정산 필수필드 제공']].map(([id, name]) => cap(id, '정산', name, [id === 'member-identity' ? 'Member' : 'SettlementTransaction'])),
  ...[['promotion', '일반 행사/특매 조회', 'Event'], ['promotion-product', '행사상품 조회', 'Product'], ['promotion-price', '행사 가격 조회', 'Product'], ['publication', '소비자 플랫폼 공개데이터 제공', 'Product']].map(([id, name, schema]) => cap(id, '일반 행사 / 소비자 플랫폼', name, [schema])),
  ...[...methods, '단방향', '양방향'].map(name => ({ id: `transport-${name}`, group: '연동 특성', name, fieldIds: [], technical: true })),
]
export interface ConnectionField { key: string; label: string; secret?: boolean; required?: boolean; example: string }
const common: ConnectionField[] = [{ key: 'storeCode', label: '매장 코드', required: true, example: 'DEMO-MAIN' }]
const local: ConnectionField[] = [{ key: 'host', label: 'Server IP / Host', required: true, example: 'demo-local' }, { key: 'port', label: 'Port', required: true, example: '1433' }, { key: 'database', label: 'DB / Instance', required: true, example: 'DEMO_DB' }, { key: 'agentId', label: 'Agent ID', example: 'DEMO-AGENT' }, { key: 'credential', label: '인증정보', secret: true, required: true, example: '새 Mock 인증정보' }, { key: 'interval', label: '동기화 주기(분)', required: true, example: '30' }]
export const connectionFields: Record<Method, ConnectionField[]> = {
  API: [...common, { key: 'tenant', label: 'Tenant ID', required: true, example: 'DEMO-TENANT' }, { key: 'apiKey', label: 'API Key', secret: true, required: true, example: '새 Mock API Key' }, { key: 'secret', label: 'Secret', secret: true, required: true, example: '새 Mock Secret' }, { key: 'endpoint', label: 'Endpoint', required: true, example: 'mock://cloud/sales' }],
  DB: [...common, ...local], Agent: [...common, ...local.map(f => f.key === 'agentId' ? { ...f, required: true } : f)],
  File: [...common, { key: 'pattern', label: '파일 패턴', required: true, example: 'sales_*.csv' }, { key: 'encoding', label: '문자 인코딩', required: true, example: 'UTF-8' }],
  Excel: [...common, { key: 'sheet', label: '시트명', required: true, example: '판매실적' }, { key: 'template', label: '양식 버전', required: true, example: 'DEMO-v1' }],
}

export const hubTitles: Record<string, string> = { 'pos-master': 'POS 마스터', 'pos-capabilities': 'Capability', 'pos-interfaces': '데이터소스·인터페이스', 'pos-schema': '표준 스키마', 'pos-mapping': '필드·코드 매핑', 'pos-connections': '점포 POS 연동', 'pos-history': '연동 현황·이력' }
