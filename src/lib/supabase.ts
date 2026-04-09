import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env vars:', { url: !!url, key: !!key })
}

export const supabase = createClient(url || '', key || '')

// Unique channel name generator to avoid Supabase realtime collisions
let _channelSeq = 0
export function channelName(prefix: string) {
  return `${prefix}-${++_channelSeq}`
}
