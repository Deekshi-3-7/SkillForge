import { shiftDate } from './stats'

export type CircleMember = {
  name: string
  current_streak: number
  active_days: number
  week_minutes: number
  month_days: Record<string, number>
}

export type CircleSnapshot = {
  members: CircleMember[]
  community_minutes: number
  community_active_days: number
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.length ? words.slice(0, 2).map(word => word[0].toLocaleUpperCase()).join('') : '?'
}

export function monthCalendar(today: string): { date: string; outside: boolean }[] {
  const [year, month] = today.split('-').map(Number)
  const start = `${today.slice(0, 7)}-01`
  const end = `${today.slice(0, 7)}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`
  const first = shiftDate(start, -new Date(year, month - 1, 1).getDay())
  const days: { date: string; outside: boolean }[] = []
  for (let date = first; date <= end; date = shiftDate(date, 1)) {
    days.push({ date, outside: date < start || date > today })
  }
  return days
}
