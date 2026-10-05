import type { Organization, MemberCompany, Store, Account, Business, StoreParticipation } from './platform.ts'
export type OperatingOrganization = Organization
export type Branch = Organization
export type WorkflowMemberCompany = MemberCompany
export type WorkflowStore = Store
export type AdminAccount = Account
export type AgriculturalBusiness = Business
export type BusinessParticipation = StoreParticipation
export type ConsumerPlatformParticipation = StoreParticipation
export interface ExecutionSummary { roundId: string; storeId: string; allocated: number; executed: number; remaining: number; rate: number; transactionCount: number; lastReceived: string; status: 'running' | 'near-limit' | 'exhausted' | 'no-sales' }
export interface Scope { operatorId: string; businessId: string }
export interface MembershipApplication { id: string; operatorId: string; name: string; registrationNo: string; representative: string; phone: string; email: string; address: string; posId: string | null; document: string; appliedAt: string; status: 'pending' | 'reviewing' | 'approved' | 'rejected'; reason: string; companyId?: string }
export interface ParticipationApplication extends Scope { id: string; companyId: string; storeIds: string[]; status: 'pending' | 'approved' | 'rejected'; reason: string }
export interface CompanyProfile { companyId: string; registrationNo: string; phone: string; address: string; document: string; bankVerified: boolean }
export interface StoreProfile { storeId: string; address: string; phone: string; hours: string; holiday: string; delivery: boolean; pickup: boolean }
export interface WeeklyRound extends Scope { id: string; name: string; startsOn: string; endsOn: string; status: 'draft' | 'confirmed' | 'executing' | 'ended'; official: { items: string[]; discount: number; personalLimit: number; conditions: string; source: string }; operating: { budget: number; reserveRate: number; mode: 'direct' | 'branch'; deadline: string } }
export interface AnnualBudget extends Scope { total: number }
export interface BudgetAllocation { roundId: string; storeId: string; amount: number; branchId: string | null }
export interface ReserveLedger extends Scope { id: string; roundId: string; storeId: string; at: string; type: string; before: number; delta: number; after: number; reason: string; actor: string }
export interface RepresentativeProduct { id: string; name: string; unit: string }
export interface StoreEventProduct { id: string; roundId: string; storeId: string; representativeId: string; name: string; price: number; photo: boolean; override: '' | 'name-change' | 'not-running'; source: 'POS' | 'manual' | 'Excel'; status: 'draft' | 'review' | 'confirmed' | 'exception'; confirmedAt: string }
export interface SaleTransaction { id: string; roundId: string; storeId: string; productId: string; at: string; quantity: number; price: number; support: number; source: 'POS' | 'manual' | 'Excel'; valid: boolean; exclusion: string }
export interface AnomalyCase { id: string; roundId: string; storeId: string; kind: string; status: 'new' | 'checking' | 'resolved' | 'watching'; note: string; source: 'cumulative' | 'latest-file' }
export interface SettlementBatch extends Scope { id: string; name: string; roundIds: string[]; status: 'draft' | 'claimed' | 'reviewing' | 'final' }
export interface SettlementTransaction { transactionId: string; storeId: string; roundId: string; productName: string; quantity: number; amount: number }
export interface SettlementClaimSnapshot { id: string; batchId: string; at: string; rows: SettlementTransaction[]; total: number; excluded: number; submissions: { at: string; method: 'API' | 'Excel'; reference: string }[] }
export interface RejectionCase { id: string; batchId: string; transactionId: string; storeId: string; amount: number; reason: string; status: 'mart-review' | 'accepted' | 'appealed' | 'association-review' | 'at-review' | 'approved' | 'rejected'; martOpinion: string; associationOpinion: string; evidence: string[]; history: { at: string; status: string; note: string }[] }
export interface AppealCase { id: string; caseId: string; opinion: string; evidence: string; at: string }
export interface FinalSettlement { id: string; batchId: string; initial: number; accepted: number; rejected: number; refunded: number; at: string }
export interface Payout { id: string; batchId: string; storeId: string; amount: number; status: 'government-wait' | 'received' | 'ready' | 'processing' | 'failed' | 'paid'; paymentKey: string; history: string[] }
export interface Due { id: string; operatorId: string; companyId: string; month: string; amount: number; source: string }
export interface Deposit { id: string; operatorId: string; at: string; payer: string; amount: number; candidateId: string; confidence: number; status: 'suggested' | 'confirmed'; category: string; source: string }
export interface Receipt { id: string; depositId: string; dueId: string; companyId: string; amount: number; category: string; memo: string }
export interface PublicProduct extends Scope { id: string; storeId: string; productId: string; name: string; price: number; startsOn: string; endsOn: string; visible: boolean; source: 'POS' | 'flyer' }
export interface FlyerPublication extends Scope { id: string; storeId: string; name: string; sourceName: string; status: 'uploaded' | 'processed' | 'confirmed' | 'published'; startsOn: string; endsOn: string; candidates: { name: string; price: number; checked: boolean }[] }
export interface IntegrationStatus extends Scope { storeId: string; lastSuccess: string; nextAt: string; error: string; currentProductIds: string[]; attempts: { at: string; result: string; message: string }[] }
export interface Notice { id: string; operatorId: string; title: string; body: string; audience: string; startsOn: string; endsOn: string; important: boolean; kind: string; active: boolean }
export interface WorkflowData { version: 1; applications: MembershipApplication[]; participationApplications: ParticipationApplication[]; companyProfiles: CompanyProfile[]; storeProfiles: StoreProfile[]; rounds: WeeklyRound[]; annualBudgets: AnnualBudget[]; allocations: BudgetAllocation[]; ledger: ReserveLedger[]; representatives: RepresentativeProduct[]; products: StoreEventProduct[]; transactions: SaleTransaction[]; anomalies: AnomalyCase[]; batches: SettlementBatch[]; claims: SettlementClaimSnapshot[]; rejections: RejectionCase[]; appeals: AppealCase[]; finals: FinalSettlement[]; payouts: Payout[]; dues: Due[]; deposits: Deposit[]; receipts: Receipt[]; aliases: { operatorId: string; payer: string; companyId: string }[]; publicProducts: PublicProduct[]; flyers: FlyerPublication[]; integrations: IntegrationStatus[]; notices: Notice[]; settings: { operatorId: string; deputyLimit: number; brand: string }[] }
export interface WorkflowCommand { kind: 'download' | 'membership' | 'participation' | 'company' | 'storePos' | 'account' | 'branch' | 'deposit' | 'annual' | 'round' | 'confirmRound' | 'endRound' | 'allocate' | 'budgetMove' | 'product' | 'confirmProduct' | 'sale' | 'anomaly' | 'batch' | 'claim' | 'submitClaim' | 'receiveRejections' | 'appeal' | 'reviewAppeal' | 'receiveDecision' | 'finalize' | 'payout' | 'publicParticipation' | 'publicToggle' | 'flyer' | 'publishFlyer' | 'publicSend' | 'notice' | 'settings'; operatorId: string; businessId: string; representatives?: RepresentativeProduct[]; id?: string; storeId?: string; amount?: number; reason?: string; status?: string; confirmed?: boolean; method?: string; ids?: string[]; value?: unknown }
