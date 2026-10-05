import { statusLabel, statusTone } from '../../data/workflowPresentation'
export default function WorkflowStatus({ code }: { code:string }) { return <span className={`workflow-status status-${statusTone(code)}`}>{statusLabel(code)}</span> }
