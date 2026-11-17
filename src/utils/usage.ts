import type { DailyUsage } from '../types'

export function zeroFillDaily(daily: DailyUsage[], days: number): DailyUsage[] {
  const byDate = new Map(daily.map(d => [d.date, d.hours]))
  const result: DailyUsage[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    result.push({ date: dateStr, hours: byDate.get(dateStr) ?? 0 })
  }
  return result
}