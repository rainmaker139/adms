import type { StatusCode } from './status.ts'

export type Method = 'API' | 'DB' | 'Agent' | 'File' | 'Excel'
export type Direction = 'read' | 'write' | 'both'
export type FieldType = 'string' | 'number' | 'datetime' | 'enum'
export interface SchemaField { id: string; schema: string; name: string; label: string; type: FieldType; required: boolean; description: string; sample: string; source: string }
export interface Capability { id: string; group: string; name: string; fieldIds: string[]; technical?: boolean; direction?: 'read' | 'write' }
export interface PosMaster { id: string; code: string; company: string; name: string; responsible: string; contact: string; phone: string; email: string; website: string; description: string; notes: string; active: boolean; capabilityIds: string[] }
export interface PosInterface { id: string; posId: string; name: string; method: Method; direction: Direction; capabilityIds: string[]; active: boolean; description: string }
export interface SourceField { name: string; type: FieldType; sample: string }
export type MappingStatus = 'complete' | 'unmapped' | 'review' | 'error'
export interface FieldMapping { interfaceId: string; fieldId: string; source: string; rule: 'identity' | 'number' | 'string' | 'codes'; codes: Record<string, string>; status: MappingStatus; message: string }
export type StepId = 'connect' | 'identity' | 'sample' | 'mapping' | 'capabilities'
export type TestState = 'waiting' | 'success' | 'failure'
export interface TestResult { status: TestState; message: string }
export interface StoreConnection {
  storeId: string; posId: string | null; interfaceId: string | null; status: StatusCode<'posConnection'>;
  config: Record<string, string>; secretSet: Record<string, boolean>;
  steps: Record<StepId, TestResult>; capabilityResults: Record<string, TestResult>;
  lastReceived: string | null; lastCount: number; lastError: string; revision: number;
}
export interface IntegrationRun { id: string; storeId: string; posId: string | null; interfaceId: string | null; at: string; action: string; result: 'success' | 'failure' | 'info'; count: number; message: string; revision: number }
export interface HubData { version: 1; poses: PosMaster[]; interfaces: PosInterface[]; mappings: FieldMapping[]; sources: Record<string, SourceField[]>; connections: StoreConnection[]; runs: IntegrationRun[] }
export type HubCommand =
  | { kind: 'pos'; value: PosMaster; confirmed?: boolean }
  | { kind: 'capabilities'; posId: string; ids: string[]; confirmed?: boolean }
  | { kind: 'interface'; value: PosInterface; confirmed?: boolean }
  | { kind: 'mapping'; value: FieldMapping; confirmed?: boolean }
  | { kind: 'validateMappings'; interfaceId: string }
  | { kind: 'autoMap'; interfaceId: string; confirmed?: boolean }
  | { kind: 'connection'; storeId: string; posId: string; interfaceId: string | null; config: Record<string, string>; replaceSecrets: string[]; confirmed?: boolean }
  | { kind: 'step'; storeId: string; step: StepId; simulate?: 'connection' | 'identity' | 'sample' | 'sales' }
  | { kind: 'activate' | 'stop' | 'reset' | 'collect'; storeId: string }
