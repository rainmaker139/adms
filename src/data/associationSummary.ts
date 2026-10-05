import type { PlatformData } from '../types/platform'
export function companyFeeSummary(p:PlatformData, companyId:string, month='2026-10') {
 const dues=p.workflow.dues.filter(d=>d.companyId===companyId), paidFor=(id:string)=>p.workflow.receipts.filter(r=>r.dueId===id).reduce((s,r)=>s+r.amount,0), current=dues.filter(d=>d.month===month), billed=current.reduce((s,d)=>s+d.amount,0), paid=current.reduce((s,d)=>s+paidFor(d.id),0), overdue=dues.filter(d=>d.month<month && paidFor(d.id)<d.amount), arrears=overdue.reduce((s,d)=>s+d.amount-paidFor(d.id),0), prepaid=dues.filter(d=>d.month>month).reduce((s,d)=>s+paidFor(d.id),0)
 const status=overdue.length>=3?'장기 연체':overdue.length?'연체':billed && paid>=billed?prepaid?'선납':'정상 납부':paid?'부분납':'미납'
 const receiptIds=p.workflow.receipts.filter(r=>r.companyId===companyId && r.category==='회비').map(r=>r.depositId), lastPaid=p.workflow.deposits.filter(d=>receiptIds.includes(d.id)).sort((a,b)=>b.at.localeCompare(a.at))[0]?.at || '없음'
 return {billed,paid,unpaid:billed-paid,arrears,overdue:overdue.length,prepaid,status,lastPaid}
}
