export type Theme = 'emerald' | 'arctic' | 'violet'

export const themes: { id: Theme; name: string; description: string }[] = [
  { id: 'emerald', name: 'Emerald Obsidian', description: 'Deep green, calm and focused' },
  { id: 'arctic', name: 'Arctic Blue', description: 'Bright, clear and understated' },
  { id: 'violet', name: 'Midnight Violet', description: 'Soft violet for late sessions' },
]

export function parseTheme(value: string | null): Theme {
  return value === 'arctic' || value === 'violet' ? value : 'emerald'
}

export function readTheme(): Theme {
  try { return parseTheme(window.localStorage.getItem('skillforge-theme')) }
  catch { return 'emerald' }
}

export function saveTheme(theme: Theme): void {
  try { window.localStorage.setItem('skillforge-theme', theme) }
  catch { /* The selected theme still applies for this session. */ }
}
