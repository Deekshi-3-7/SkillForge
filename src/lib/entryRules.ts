import { localDate } from './stats'

export function isOwner(role: string): boolean {
  return role === 'owner'
}

export function canManageEntry(role: string): boolean {
  return isOwner(role)
}

export function createDate(now = new Date()): string {
  return localDate(now)
}

export function validCreateDate(date: string, now = new Date()): boolean {
  return date === createDate(now)
}

export function validEditDate(original: string, updated: string): boolean {
  return original === updated
}

export function watchLocalDate(onDate: (date: string) => void, intervalMs = 15_000): () => void {
  let previous = createDate()
  const check = () => {
    const current = createDate()
    if (current !== previous) { previous = current; onDate(current) }
  }
  const timer = window.setInterval(check, intervalMs)
  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', check)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', check)
    document.removeEventListener('visibilitychange', check)
  }
}
