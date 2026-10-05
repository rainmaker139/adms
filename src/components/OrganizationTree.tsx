import { Building2, ChevronRight } from 'lucide-react'
import type { Organization } from '../types/platform'

export default function OrganizationTree({ items }: { items: Organization[] }) {
  function branch(parentId: string | null, ancestors: Set<string>) {
    return items.filter((org) => parentId === null ? !items.some((p) => p.id === org.parentId) : org.parentId === parentId).map((org) => {
      if (ancestors.has(org.id)) return null
      const seen = new Set([...ancestors, org.id])
      const children = branch(org.id, seen)
      return <li key={org.id}><div><Building2 size={15} /><span>{org.name}</span><small>{org.type}</small></div>{children.length > 0 && <ul>{children}</ul>}</li>
    })
  }
  return <details className="panel organization-tree"><summary><ChevronRight size={18} />조직 계층 보기 <span className="muted">{items.length}개 조직 · 현재 접근 범위</span></summary><ul>{branch(null, new Set())}</ul></details>
}
