import type { ChartPoint, Kpi } from '../types/demo'
export const kpis: Kpi[] = [
  { label: '참여마트 (mock)', value: '12개' },
  { label: '진행 행사 (mock)', value: '3개' },
  { label: '시연 집행액 (mock)', value: '450만원' },
]
export const chartData: ChartPoint[] = [
  { month: '1월', amount: 40 }, { month: '2월', amount: 65 },
  { month: '3월', amount: 50 }, { month: '4월', amount: 90 },
]
