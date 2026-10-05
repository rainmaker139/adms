import PosMasterPage from './PosMasterPage'
import CapabilitiesPage from './CapabilitiesPage'
import InterfacesPage from './InterfacesPage'
import SchemaPage from './SchemaPage'
import MappingPage from './MappingPage'
import ConnectionsPage from './ConnectionsPage'

export default function HubPage({ programId }: { programId: string }) {
  if (programId === 'pos-master') return <PosMasterPage />
  if (programId === 'pos-capabilities') return <CapabilitiesPage />
  if (programId === 'pos-interfaces') return <InterfacesPage />
  if (programId === 'pos-schema') return <SchemaPage />
  if (programId === 'pos-mapping') return <MappingPage />
  return <ConnectionsPage key={programId} history={programId === 'pos-history'} />
}
