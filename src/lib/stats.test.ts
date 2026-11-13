import { describe, expect, it } from 'vitest'
import { dailyMinutes, dayLevel, learningStats, periodActivity, shiftDate } from './stats'

describe('learning consistency', () => {
  const entry = (learning_date: string, minutes: number) => ({ learning_date, minutes })

  it('combines sessions before deciding whether a date is active', () => {
    const stats = learningStats([entry('2026-11-07', 2), entry('2026-11-07', 3)], '2026-11-07')
    expect(stats.totalDays).toBe(1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.todayMinutes).toBe(5)
  })

  it('keeps a streak through yesterday, then resets after a missed day', () => {
    const entries = [entry('2026-11-04', 5), entry('2026-11-05', 12)]
    expect(learningStats(entries, '2026-11-06').currentStreak).toBe(2)
    expect(learningStats(entries, '2026-11-07').currentStreak).toBe(0)
    expect(learningStats(entries, '2026-11-07').longestStreak).toBe(2)
  })

  it('uses correct day levels and calendar arithmetic', () => {
    expect([4, 5, 15, 16, 30, 31].map(dayLevel)).toEqual(['none', 'minimum', 'minimum', 'regular', 'regular', 'deep'])
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('does not mark a date active until its sessions total five minutes', () => {
    const entries = [entry('2026-11-11', 2), entry('2026-11-11', 2), entry('2026-11-12', 2), entry('2026-11-12', 3)]
    const totals = dailyMinutes(entries)
    expect(totals.get('2026-11-11')).toBe(4)
    expect(totals.get('2026-11-12')).toBe(5)
    expect(learningStats(entries, '2026-11-12').totalDays).toBe(1)
  })

  it('keeps the longest run but breaks the current streak after a gap', () => {
    const entries = [
      entry('2026-11-05', 5), entry('2026-11-06', 5),
      entry('2026-11-09', 10), entry('2026-11-10', 10), entry('2026-11-11', 10),
    ]
    const stats = learningStats(entries, '2026-11-13')
    expect(stats.totalDays).toBe(5)
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(3)
  })

  it('excludes future sessions from completed days, streaks, and learning time', () => {
    const entries = [
      entry('2026-11-12', 20),
      entry('2026-11-13', 2), entry('2026-11-13', 3),
      entry('2026-11-14', 60),
    ]
    const stats = learningStats(entries, '2026-11-13')
    expect(stats.totalDays).toBe(2)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.todayMinutes).toBe(5)
    expect(stats.totalMinutes).toBe(25)
  })

  it('shows only completed dates in the heatmap period summary', () => {
    const totals = dailyMinutes([
      entry('2026-10-31', 40), entry('2026-11-01', 2), entry('2026-11-01', 3),
      entry('2026-11-02', 4), entry('2026-11-14', 60),
    ])
    expect(periodActivity(totals, '2026-11-01', '2026-11-13')).toEqual({ activeDays: 1, minutes: 9 })
  })
})
