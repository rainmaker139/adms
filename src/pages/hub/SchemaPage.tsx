import { useState } from 'react'
import { useHub } from '../../state/useHub'
import { capabilities, schemaFields, schemaNames } from '../../data/hubCatalog'
import type { SchemaField } from '../../types/hub'
import { DataTable, DetailDialog, DetailList, PageHeader, StatusBadge } from '../../components/common/ui'
import { HubLinks } from '../../components/hub/HubUI'
import { Field } from '../../components/admin/AdminUI'

export default function SchemaPage() {
  const { params, select, pos } = useHub()
  const schema = schemaNames.includes(params.get('schema') ?? '') ? params.get('schema')! : 'SaleTransaction'
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SchemaField | null>(null)
  const fields = schemaFields.filter(f => f.schema === schema && `${f.name} ${f.label}`.includes(query.trim()))
  return <><PageHeader eyebrow="STANDARD DATA MODEL" title="표준 스키마" description="특정 POS나 사업에 종속되지 않는 ADMS 공통 Schema입니다. Capability와 연결되는 표준 필드·필수 여부·Sample을 확인합니다." /><div className="hub-schema-layout"><section className="panel hub-schema-list"><h2>표준 Schema</h2>{schemaNames.map(name => <button key={name} className={schema === name ? 'selected' : ''} onClick={() => { select('schema', name); setQuery('') }}>{name}<span>{schemaFields.filter(f => f.schema === name).length} Fields</span></button>)}</section><section className="panel admin-detail"><div className="section-heading"><h2>{schema}</h2><span>{fields.length}개 Field</span></div><div className="hub-controls"><Field label="표준 Field 검색"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="내부명 또는 표시명" /></Field></div><DataTable caption="표준 Schema Field" rows={fields} rowKey={f => f.id} columns={[
    { key: 'name', label: '내부 Field / 표시명', render: f => <button className="text-button" onClick={() => setSelected(f)}><code>{f.name}</code><span className="cell-sub">{f.label}</span></button> }, { key: 'type', label: '데이터형', render: f => f.type }, { key: 'required', label: '필수 여부', render: f => <StatusBadge tone={f.required ? 'warning' : 'neutral'}>{f.required ? '필수' : '선택'}</StatusBadge> }, { key: 'desc', label: '설명', render: f => <span className="hub-wrap">{f.description}</span> }, { key: 'cap', label: '사용 Capability', render: f => <span className="hub-wrap">{capabilities.filter(c => c.fieldIds.includes(f.id)).map(c => c.name).join(', ')}</span> },
  ]} /><HubLinks posId={pos.id} /></section></div>{selected && <DetailDialog title={`${selected.schema}.${selected.name}`} onClose={() => setSelected(null)}><DetailList items={[{ label: '표시명', value: selected.label }, { label: '데이터형', value: selected.type }, { label: '필수', value: selected.required ? '필수' : '선택' }, { label: '설명', value: selected.description }, { label: '내장 Sample', value: selected.sample || '빈 값 (조건부 필드)' }, { label: '사용 Capability', value: capabilities.filter(c => c.fieldIds.includes(selected.id)).map(c => c.name).join(', ') }]} /><p className="notice-box">표준 필드는 PRD 기반 Mock 기준입니다. 실제 POS 필드명 및 제출 필수조건은 기관/POS사 협의 후 확정합니다.</p></DetailDialog>}</>
}
