import type { LearningEntry } from './types'

export function localDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function shiftDate(day: string, offset: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const value = new Date(y, m - 1, d)
  value.setDate(value.getDate() + offset)
  return localDate(value)
}

export type DayLevel = 'none' | 'minimum' | 'regular' | 'deep'

export function dayLevel(minutes: number): DayLevel {
  if (minutes < 5) return 'none'
  if (minutes <= 15) return 'minimum'
  if (minutes <= 30) return 'regular'
  return 'deep'
}

export function dailyMinutes(entries: Pick<LearningEntry, 'learning_date' | 'minutes'>[]) {
  const days = new Map<string, number>()
  for (const entry of entries) {
    days.set(entry.learning_date, (days.get(entry.learning_date) ?? 0) + entry.minutes)
  }
  return days
}

export function periodActivity(totals: Map<string, number>, start: string, today: string) {
  const periodDays = [...totals.entries()].filter(([date]) => date >= start && date <= today)
  return {
    activeDays: periodDays.filter(([, minutes]) => minutes >= 5).length,
    minutes: periodDays.reduce((sum, [, minutes]) => sum + minutes, 0),
  }
}

export function learningStats(entries: Pick<LearningEntry, 'learning_date' | 'minutes'>[], today = localDate()) {
  const totals = dailyMinutes(entries)
  const activeDates = [...totals.entries()]
    .filter(([date, minutes]) => date <= today && minutes >= 5)
    .map(([date]) => date)
    .sort()
  let longestStreak = 0
  let run = 0
  for (let i = 0; i < activeDates.length; i++) {
    run = i > 0 && activeDates[i - 1] === shiftDate(activeDates[i], -1) ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  }
  const latest = activeDates[activeDates.length - 1]
  let currentStreak = 0
  if (latest === today || latest === shiftDate(today, -1)) {
    const active = new Set(activeDates)
    for (let date = latest; date && active.has(date); date = shiftDate(date, -1)) currentStreak++
  }
  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.learning_date <= today ? entry.minutes : 0), 0)
  return {
    totals,
    currentStreak,
    longestStreak,
    totalDays: activeDates.length,
    totalMinutes,
    todayMinutes: totals.get(today) ?? 0,
    todayLevel: dayLevel(totals.get(today) ?? 0),
  }
}
