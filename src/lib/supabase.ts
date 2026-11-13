import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key, {
  global: {
    fetch: (input, init) => {
      if (!String(input instanceof Request ? input.url : input).includes('/rest/v1/')) return fetch(input, init)
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
      headers.set('x-skillforge-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
      return fetch(input, { ...init, headers })
    },
  },
}) : null
