import { createSystemCatalog } from '../data/systemCatalog.ts'
import { createOperationsSeed, notificationTypes } from '../data/operations.ts'
import type { AuditEvent, OperationsCommand, OperationsData } from '../types/operations.ts'
const ensure = (ok: unknown, message: string) => { if (!ok) throw Error(message) }
export function applyOperations(source: OperationsData, command: OperationsCommand, actor: Pick<AuditEvent, 'actor' | 'organizationId' | 'role'>): OperationsData {
  const data = structuredClone(source), at = new Date().toISOString(), id = () => crypto.randomUUID()
  let before: unknown = null, after: unknown = null, menu = '', entity = '', action = '변경', reason = '', related = '', result: 'success' | 'failure' = 'success'
  if (command.kind==='code') {
    menu='공통코드';const v={...command.value,group:command.value.group.trim(),code:command.value.code.trim(),label:command.value.label.trim()},old=data.codes.find(c=>c.id===v.id);entity=v.id;
    ensure(v.group && /^[A-Za-z0-9._-]+$/.test(v.code) && v.label && Number.isSafeInteger(v.order) && v.order>=0 && typeof v.active==='boolean','코드그룹·코드(영문/숫자/._-)·표시명·0 이상 정수 순서를 확인해 주세요.');
    ensure(!data.codes.some(c=>c.id!==v.id && c.group.toLowerCase()===v.group.toLowerCase() && c.code.toLowerCase()===v.code.toLowerCase()),'같은 그룹의 코드가 중복됩니다.');ensure(!old || (old.group===v.group && old.code===v.code),'기존 코드그룹과 코드키는 유지됩니다.');
    before=old||null;after=v;action=old?'수정':'등록';data.codes=old?data.codes.map(c=>c.id===v.id?v:c):[...data.codes,v]
  } else if(command.kind==='externalRun') {
    const integration=data.integrations.find(i=>i.id===command.integrationId);ensure(integration && integration.status!=='stopped','활성 연동 대상을 확인해 주세요.');ensure(command.confirmed && command.reason.trim(),'대상 확인과 처리 사유가 필요합니다.');ensure(integration!.runs.at(-1)?.id===command.runId,'이미 처리한 이력입니다. 최신 이력을 확인해 주세요.');ensure(['재처리','재검증'].includes(command.action),'처리 작업을 확인해 주세요.');
    menu=data.integrations.find(i=>i.id===command.integrationId)!.target+' 외부 연동';entity=command.integrationId;action=command.action;reason=command.reason;before=structuredClone(integration);result=command.fail?'failure':'success';
    const latest=integration!.runs.at(-1)!;const run={id:id(),at,action:command.action,result,sent:command.fail||command.action==='재검증'?0:latest.sent|| (integration!.direction==='수신'?0:12),received:command.fail||command.action==='재검증'?0:latest.received|| (integration!.direction==='송신'?0:12),message:command.fail?'Mock 검증 실패 · 입력 자료 확인 필요':command.action==='재검증'?'Mock 재검증 완료 · 실제 규격은 TBD':'Mock 재처리 완료 · 동일 대상 중복 제외',related:command.runId};
    integration!.runs.push(run);integration!.status=command.fail?'failed':'healthy';after=integration;related=run.id;
  } else if (command.kind === 'template' || command.kind === 'version' || command.kind === 'versionStatus') {
    menu = 'Excel 양식'
    if (command.kind === 'template') {
      const v = command.value
      ensure(v.name.trim() && v.area.trim() && v.usage.trim() && v.description.trim(), '양식명·업무영역·설명·사용처는 필수입니다.')
      ensure(!data.templates.some(t => t.id === v.id || t.name.trim() === v.name.trim()), '이미 등록된 양식입니다.')
      ensure(v.versions.length === 0, '신규 양식 등록 후 새 Version을 추가해 주세요.')
      data.templates.push(v); after = v; entity = v.id; action = '등록'
    } else {
      const t = data.templates.find(t => t.id === command.templateId); ensure(t, '양식을 찾을 수 없습니다.'); entity = t!.id
      if (command.kind === 'version') {
        const v = command.value
        ensure(v.version.trim() && /^\d{4}-\d{2}-\d{2}$/.test(v.startsOn) && Number.isFinite(Date.parse(v.startsOn)) && (!v.endsOn || v.endsOn >= v.startsOn), 'Version과 올바른 적용기간을 입력해 주세요.')
        ensure(v.required.length && [...v.required, ...v.optional].every(c => c.trim()) && new Set([...v.required, ...v.optional]).size === v.required.length + v.optional.length, '필수 Column이 필요하며 중복/빈 Column은 허용하지 않습니다.')
        ensure(v.parserRef.trim(), '파싱 규칙 참조를 입력해 주세요.')
        ensure(!t!.versions.some(old => old.id === v.id || old.version === v.version), '동일 Version은 수정하지 않고 새 Version으로 등록합니다.')
        ensure(v.status === 'stopped', '새 Version은 중지 상태로 등록한 뒤 활성화합니다.')
        t!.versions.push({ ...v, modifiedAt: at }); after = v; action = '새 Version'
      } else {
        const v = t!.versions.find(v => v.id === command.versionId); ensure(v, 'Version을 확인해 주세요.'); before = structuredClone(v)
        ensure(v!.status !== 'expired', '만료 Version은 이력 조회만 가능합니다.')
        if (command.status === 'active') {
          ensure(!v!.endsOn || v!.endsOn >= at.slice(0, 10), '적용기간이 지난 Version은 활성화할 수 없습니다.')
          ensure(!t!.versions.some(other => other.id !== v!.id && other.status === 'active' && other.startsOn <= (v!.endsOn || '9999-12-31') && (other.endsOn || '9999-12-31') >= v!.startsOn), '적용기간이 겹치는 활성 Version을 먼저 중지해 주세요.')
        }
        v!.status = command.status; v!.modifiedAt = at; after = v
      }
    }
  } else if (command.kind === 'notification') {
    menu = '알림 관리'; entity = command.value.id
    const type = notificationTypes.find(t => t.id === entity), old = data.notifications.find(n => n.id === entity), v = command.value
    ensure(type && old, '개발자가 등록한 알림 유형만 설정할 수 있습니다.')
    ensure(v.roleIds.length && v.channels.length && v.channels.every(c => ['시스템 알림', 'SMS', '알림톡'].includes(c)) && v.timing.trim(), '수신 Role·채널·발송시점을 지정해 주세요.')
    ensure(type!.unit ? Number.isFinite(v.threshold) && v.threshold! >= type!.min && v.threshold! <= type!.max : v.threshold === null, `기준값 범위: ${type!.min}~${type!.max} ${type!.unit}`)
    before = old; data.notifications = data.notifications.map(n => n.id === entity ? v : n); after = v
  } else if (command.kind === 'retry') {
    menu = '자동 작업 현황'; entity = command.jobId; action = '재실행'; reason = command.reason
    const job = data.jobs.find(j => j.id === entity); ensure(job && job.status !== 'stopped', '중지된 작업은 재실행할 수 없습니다.')
    ensure(command.confirmed && reason.trim(), '중복 방지 범위 확인과 재실행 사유가 필요합니다.')
    ensure(job!.runs.at(-1)?.id === command.runId, '이미 재실행한 이전 실행입니다. 최신 이력을 확인해 주세요.')
    before = structuredClone(job)
    const run = { id: id(), at, result: command.fail ? 'failure' as const : 'success' as const, count: command.fail ? 0 : 12, seconds: 2, message: command.fail ? 'MOCK_RETRY_ERROR: 재실행 실패 시나리오' : '동일 대상·중복 제외 Mock 재실행 완료', retryOf: command.runId }
    job!.runs.push(run); job!.status = command.fail ? 'failed' : 'healthy'; after = job; related = run.id; result = run.result
  } else { menu = command.menu; entity = command.entity; action = '다운로드'; related = command.related; after = { 파일: related }; reason = 'Mock CSV · Excel에서 열기 가능' }
  data.events.push({ id: id(), at, ...actor, businessId: '', menu, entity, action, summary: `${menu} ${action}`, result, before, after, reason, related })
  return data
}
export const OPERATIONS_KEY = 'adms.demo.operations.v1'
export function readOperations(): OperationsData {
  try { const v = JSON.parse(localStorage.getItem(OPERATIONS_KEY) || 'null'); if (v?.version === 1 && ['templates', 'jobs', 'notifications', 'events'].every(k => Array.isArray(v[k])) && v.templates.every((t: { versions?: unknown[] }) => Array.isArray(t.versions)) && v.jobs.every((j: { runs?: unknown[] }) => Array.isArray(j.runs)) && notificationTypes.every(t => v.notifications.some((n: { id: string }) => n.id === t.id))) return { ...v, codes:Array.isArray(v.codes)?v.codes:createSystemCatalog().codes, integrations:Array.isArray(v.integrations)?v.integrations:createSystemCatalog().integrations } } catch { /* memory fallback */ }
  return createOperationsSeed()
}
