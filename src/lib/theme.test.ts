import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseTheme, readTheme, saveTheme, themes } from './theme'

afterEach(() => { vi.unstubAllGlobals() })

describe('theme selection', () => {
  it('accepts the three supported themes and falls back safely', () => {
    expect(themes.map(theme => theme.id)).toEqual(['emerald', 'arctic', 'violet'])
    expect(parseTheme('arctic')).toBe('arctic')
    expect(parseTheme('violet')).toBe('violet')
    expect(parseTheme('emerald')).toBe('emerald')
    expect(parseTheme('unknown')).toBe('emerald')
    expect(parseTheme(null)).toBe('emerald')
  })

  it('persists a selection in browser storage', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    } })
    expect(readTheme()).toBe('emerald')
    saveTheme('violet')
    expect(readTheme()).toBe('violet')
  })
})
