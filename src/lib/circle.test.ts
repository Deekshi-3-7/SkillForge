import { describe, expect, it } from 'vitest'
import { initials, monthCalendar } from './circle'

describe('Learning Circle presentation', () => {
  it('uses readable initials for one, two, or empty names', () => {
    expect(initials('Aditi Rao')).toBe('AR')
    expect(initials('  Deekshith  ')).toBe('D')
    expect(initials(' ')).toBe('?')
  })

  it('lays out the current month without showing future dates as completed', () => {
    const days = monthCalendar('2026-11-13')
    expect(days[0]).toEqual({ date: '2026-11-01', outside: false })
    expect(days.find(day => day.date === '2026-11-13')?.outside).toBe(false)
    expect(days.find(day => day.date === '2026-11-14')?.outside).toBe(true)
    expect(days[days.length - 1]?.date).toBe('2026-11-30')
  })

  it('includes leading calendar cells without counting them in the month', () => {
    const days = monthCalendar('2026-12-10')
    expect(days[0]).toEqual({ date: '2026-11-29', outside: true })
    expect(days.find(day => day.date === '2026-12-10')?.outside).toBe(false)
  })
})
