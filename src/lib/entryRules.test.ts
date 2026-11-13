import { afterEach, describe, expect, it, vi } from 'vitest'
import { canManageEntry, createDate, validCreateDate, validEditDate, watchLocalDate } from './entryRules'
import { learningStats } from './stats'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('daily entry rules', () => {
  it('accepts today and rejects past and future dates', () => {
    const now = new Date(2026, 10, 13, 12)
    expect(createDate(now)).toBe('2026-11-13')
    expect(validCreateDate('2026-11-13', now)).toBe(true)
    expect(validCreateDate('2026-11-12', now)).toBe(false)
    expect(validCreateDate('2026-11-14', now)).toBe(false)
  })

  it('notifies an open app after local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 13, 23, 59, 55))
    const browserWindow = new EventTarget() as EventTarget & { setInterval: typeof setInterval; clearInterval: typeof clearInterval }
    browserWindow.setInterval = setInterval
    browserWindow.clearInterval = clearInterval
    vi.stubGlobal('window', browserWindow)
    vi.stubGlobal('document', new EventTarget())
    const onDate = vi.fn()
    const stop = watchLocalDate(onDate, 5_000)
    vi.advanceTimersByTime(10_000)
    expect(onDate).toHaveBeenCalledWith('2026-11-14')
    stop()
  })

  it('allows management only for the existing owner role', () => {
    expect(canManageEntry('member')).toBe(false)
    expect(canManageEntry('owner')).toBe(true)
    expect(canManageEntry('admin')).toBe(false)
  })

  it('never permits an edit to change the saved date', () => {
    expect(validEditDate('2026-11-10', '2026-11-10')).toBe(true)
    expect(validEditDate('2026-11-10', '2026-11-09')).toBe(false)
    expect(validEditDate('2026-11-10', '2026-11-14')).toBe(false)
  })

  it('keeps historical learning in statistics without counting future rows', () => {
    const entries = [
      { learning_date: '2026-11-10', minutes: 10 },
      { learning_date: '2026-11-13', minutes: 5 },
      { learning_date: '2026-11-14', minutes: 60 },
    ]
    const stats = learningStats(entries, '2026-11-13')
    expect(stats.totalDays).toBe(2)
    expect(stats.totalMinutes).toBe(15)
    expect(stats.totals.get('2026-11-10')).toBe(10)
  })
})
