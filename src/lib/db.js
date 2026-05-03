import { supabase } from './supabase.js'
import { localDb }  from './localDb.js'

const url = import.meta.env.VITE_SUPABASE_URL
export const isLocalMode = !url || url.includes('placeholder') || url === 'https://DEIN-PROJEKT.supabase.co'

async function getUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id
}

// Sanitize a row before sending to Supabase:
// – empty strings on date fields become null
// – empty strings on text fields become null
function sanitize(row) {
  const DATE_FIELDS = ['stored_at', 'expires_at']
  const out = { ...row }
  for (const [k, v] of Object.entries(out)) {
    if (v === '') {
      out[k] = null
    } else if (DATE_FIELDS.includes(k) && typeof v === 'string') {
      // Only allow valid YYYY-MM-DD, otherwise null
      out[k] = v.match(/^\d{4}-\d{2}-\d{2}$/) ? v : null
    }
  }
  return out
}

export async function fetchItems() {
  if (isLocalMode) return localDb.select()
  const { data, error } = await supabase
    .from('items').select('*').order('created_at', { ascending: false })
  return { data, error }
}

export async function insertItem(row) {
  if (isLocalMode) return localDb.insert([row])
  const user_id = await getUserId()
  const { data, error } = await supabase
    .from('items').insert([{ ...sanitize(row), user_id }])
  return { data, error }
}

export async function updateItem(row, id) {
  if (isLocalMode) return localDb.update(row, id)
  const { data, error } = await supabase
    .from('items').update(sanitize(row)).eq('id', id)
  return { data, error }
}

export async function deleteItem(id) {
  if (isLocalMode) return localDb.delete(id)
  const { data, error } = await supabase.from('items').delete().eq('id', id)
  return { data, error }
}

export function subscribeToChanges(cb) {
  if (isLocalMode) return localDb.subscribe(cb)
  const ch = supabase.channel('items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, cb)
    .subscribe()
  return () => supabase.removeChannel(ch)
}
