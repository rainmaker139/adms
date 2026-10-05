import assert from 'node:assert/strict'
import { createOperationsSeed } from '../src/data/operations.ts'
import { applyOperations, readOperations } from '../src/state/operationsStore.ts'
let data = createOperationsSeed()
const actor = { actor: '시연 관리자', organizationId: 'platform', role: '시스템 관리자' }
const run = c => { data = applyOperations(data, c, actor) }
const original = structuredClone(data)
const version = { id: 'test-v3', version: '3.0', startsOn: '2026-10-05', endsOn: '', status: 'stopped', required: ['A'], optional: ['B'], parserRef: 'mock-parser-v3', modifiedAt: '' }
run({ kind: 'version', templateId: 'template-0', value: version })
assert.deepEqual(data.templates[0].versions.slice(0, 2), original.templates[0].versions)
assert.throws(() => run({ kind: 'version', templateId: 'template-0', value: version }), /동일 Version/)
assert.throws(() => run({ kind: 'versionStatus', templateId: 'template-0', versionId: version.id, status: 'active' }), /겹치는/)
run({ kind: 'versionStatus', templateId: 'template-0', versionId: 'version-0-2', status: 'stopped' })
run({ kind: 'versionStatus', templateId: 'template-0', versionId: version.id, status: 'active' })
assert.throws(() => run({ kind: 'versionStatus', templateId: 'template-0', versionId: 'version-0-1', status: 'active' }), /만료/)
const budget = data.notifications.find(n => n.id === 'budget')
assert.throws(() => run({ kind: 'notification', value: { ...budget, threshold: 101 } }), /범위/)
run({ kind: 'notification', value: { ...budget, threshold: 85, active: false } })
assert.equal(data.notifications.find(n => n.id === 'budget').threshold, 85)
assert.throws(() => run({ kind: 'notification', value: { ...budget, id: 'custom-rule' } }), /등록한/)
const job = data.jobs[2], runId = job.runs.at(-1).id
assert.throws(() => run({ kind: 'retry', jobId: job.id, runId, reason: '', confirmed: false, fail: false }), /사유/)
run({ kind: 'retry', jobId: job.id, runId, reason: '시연', confirmed: true, fail: true })
assert.equal(data.events.at(-1).result, 'failure')
assert.throws(() => run({ kind: 'retry', jobId: job.id, runId, reason: '중복', confirmed: true, fail: false }), /이미 재실행/)
run({ kind: 'retry', jobId: job.id, runId: data.jobs[2].runs.at(-1).id, reason: '복구', confirmed: true, fail: false })
assert.equal(data.jobs[2].status, 'healthy'); assert.deepEqual(data.jobs[2].runs.slice(0, 2), original.jobs[2].runs)
assert.equal(data.jobs[2].frequency, original.jobs[2].frequency)
assert.throws(() => run({ kind: 'retry', jobId: 'job-4', runId: 'run-4-last', reason: '중지', confirmed: true, fail: false }), /중지/)
assert.deepEqual(data.events.slice(0, original.events.length), original.events)
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('blocked') } })
assert.equal(readOperations().templates.length, 8)
console.log('시스템 운영 모델 검증 통과: 이전 Version/감사/실행 이력 보존, 중복/만료/기간중복 가드, 등록된 유형/임계값, 안전 재실행/중지/실패/복구, 스케줄 불변, 저장소 차단 fallback')
