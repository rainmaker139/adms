import TemplatesPage from './TemplatesPage'
import JobsPage from './JobsPage'
import NotificationsPage from './NotificationsPage'
import AuditPage from './AuditPage'
export default function SystemPage({ programId }: { programId: string }) {
  if (programId === 'excel-templates') return <TemplatesPage />
  if (programId === 'jobs') return <JobsPage />
  if (programId === 'notifications') return <NotificationsPage />
  return <AuditPage />
}
