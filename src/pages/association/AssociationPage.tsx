import MembershipPage from './MembershipPage'
import AgriculturePage from './AgriculturePage'
import SettlementPage from './SettlementPage'
import PublicPage from './PublicPage'
import SupportingPage from './SupportingPage'
export default function AssociationPage({ programId }: { programId: string }) {
  if (['membership-review', 'participation-review', 'companies', 'operators', 'branches', 'fees'].includes(programId)) return <div className="association-screen"><MembershipPage key={programId} mode={programId} /></div>
  if (['budget', 'week-plan', 'event-products', 'execution', 'anomalies'].includes(programId)) return <div className="association-screen"><AgriculturePage key={programId} mode={programId} /></div>
  if (['claims', 'appeals', 'settlement'].includes(programId)) return <div className="association-screen"><SettlementPage key={programId} mode={programId} /></div>
  if (['public-participation', 'public-data', 'flyers', 'public-history'].includes(programId)) return <div className="association-screen"><PublicPage key={programId} mode={programId} /></div>
  return <div className="association-screen"><SupportingPage key={programId} mode={programId} /></div>
}
