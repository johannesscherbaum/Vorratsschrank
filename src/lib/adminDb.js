/**
 * Stammdaten-Store – dual mode
 * • Supabase wenn VITE_SUPABASE_URL gesetzt (Produktionsmodus)
 * • localStorage wenn nicht gesetzt (lokaler Testmodus)
 *
 * API identisch in beiden Modi:
 *   store.getAll()         → Row[]
 *   store.subscribe(fn)    → unsubscribe()
 *   store.add(item)
 *   store.update(id, patch)
 *   store.remove(id)
 *   store.duplicate(id)
 *   store.reorder(ids[])
 */

import { supabase } from './supabase.js'

const url = import.meta.env.VITE_SUPABASE_URL
export const isLocalMode =
  !url || url.includes('placeholder') || url === 'https://DEIN-PROJEKT.supabase.co'

/* ── Icon sets for picker ──────────────────────────────── */
export const LOCATION_ICONS = [
  '❄️','🧊','🏠','🚪','📦','🗄️','🏪','🛒','🧺','🪣',
  '🍶','🫙','🥡','🍱','🫐','🥫','🪜','🏗️','🚗','🔒',
]
export const FOOD_ICONS = [
  '🥩','🍗','🐟','🦐','🥚','🧀','🥛','🧈','🍳',
  '🌭','🍖','🦴','🥓','🍱','🫕',
  '🥦','🥕','🧅','🥔','🌽','🍅','🫑','🥒','🥬','🧄','🥗',
  '🍎','🍌','🍊','🍋','🍇','🍓','🫐','🍑','🥭','🍍','🍒',
  '🌾','🍞','🥐','🥖','🍝','🍚','🍜','🫘','🥜','🌰',
  '🥫','🫙','💧','🍵','☕','🍷','🥤','🧃','🫖',
  '🧂','🫒','🌶️','🍯','🫚',
  '🧁','🍰','🍫','🍬','🍭','🍿','📦','❓',
]
export const USER_ROLES = ['admin', 'user', 'readonly']

/* ══════════════════════════════════════════════════════════
   LOCAL STORE (localStorage fallback)
══════════════════════════════════════════════════════════ */

const LOCAL_DEFAULTS = {
  locations: [
    {id:1,name:'Kühlschrank',   icon:'❄️',note:'',sort_order:1},
    {id:2,name:'Kühlschrank 2', icon:'❄️',note:'',sort_order:2},
    {id:3,name:'Gefrierschrank',icon:'🧊',note:'',sort_order:3},
    {id:4,name:'Gefrierkombi',  icon:'🧊',note:'',sort_order:4},
    {id:5,name:'Keller',        icon:'🏠',note:'',sort_order:5},
    {id:6,name:'Vorratsschrank',icon:'🚪',note:'',sort_order:6},
    {id:7,name:'Lagerregal',    icon:'📦',note:'',sort_order:7},
    {id:8,name:'Speisekammer',  icon:'🚪',note:'',sort_order:8},
    {id:9,name:'Sonstiges',     icon:'•', note:'',sort_order:9},
  ],
  food_groups: [
    {id:1, name:'Fleisch',               icon:'🥩',note:'',sort_order:1},
    {id:2, name:'Geflügel',              icon:'🍗',note:'',sort_order:2},
    {id:3, name:'Fisch & Meeresfrüchte', icon:'🐟',note:'',sort_order:3},
    {id:4, name:'Wurst & Aufschnitt',    icon:'🌭',note:'',sort_order:4},
    {id:5, name:'Milch & Sahne',         icon:'🥛',note:'',sort_order:5},
    {id:6, name:'Käse',                  icon:'🧀',note:'',sort_order:6},
    {id:7, name:'Butter & Fette',        icon:'🧈',note:'',sort_order:7},
    {id:8, name:'Joghurt & Quark',       icon:'🫙',note:'',sort_order:8},
    {id:9, name:'Eier',                  icon:'🥚',note:'',sort_order:9},
    {id:10,name:'Gemüse',                icon:'🥦',note:'',sort_order:10},
    {id:11,name:'Kartoffeln & Wurzeln',  icon:'🥔',note:'',sort_order:11},
    {id:12,name:'Obst',                  icon:'🍎',note:'',sort_order:12},
    {id:13,name:'Brot & Backwaren',      icon:'🍞',note:'',sort_order:13},
    {id:14,name:'Nudeln & Reis',         icon:'🍝',note:'',sort_order:14},
    {id:15,name:'Mehl & Backzutaten',    icon:'🌾',note:'',sort_order:15},
    {id:16,name:'Hülsenfrüchte',         icon:'🫘',note:'',sort_order:16},
    {id:17,name:'Konserven',             icon:'🥫',note:'',sort_order:17},
    {id:18,name:'Tiefkühlware',          icon:'🧊',note:'',sort_order:18},
    {id:19,name:'Getränke',              icon:'💧',note:'',sort_order:19},
    {id:20,name:'Saucen & Gewürze',      icon:'🫒',note:'',sort_order:20},
    {id:21,name:'Süßes & Snacks',        icon:'🍫',note:'',sort_order:21},
    {id:22,name:'Sonstiges',             icon:'📦',note:'',sort_order:22},
  ],
  units: [
    {id:1, name:'Stück',      abbr:'St.', note:'Einzelne Einheiten',sort_order:1},
    {id:2, name:'kg',         abbr:'kg',  note:'Kilogramm',         sort_order:2},
    {id:3, name:'g',          abbr:'g',   note:'Gramm',             sort_order:3},
    {id:4, name:'L',          abbr:'l',   note:'Liter',             sort_order:4},
    {id:5, name:'ml',         abbr:'ml',  note:'Milliliter',        sort_order:5},
    {id:6, name:'Dose/n',     abbr:'Ds.', note:'',                  sort_order:6},
    {id:7, name:'Glas/Gläser',abbr:'Gl.', note:'',                  sort_order:7},
    {id:8, name:'Beutel',     abbr:'Btl.',note:'',                  sort_order:8},
    {id:9, name:'Packung/en', abbr:'Pkg.',note:'',                  sort_order:9},
    {id:10,name:'Portion/en', abbr:'Por.',note:'',                  sort_order:10},
  ],
}

function localLoad(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null }
}
function localSave(key, data) { localStorage.setItem(key, JSON.stringify(data)) }
function localGetOrInit(table) {
  const d = localLoad('vorrat_' + table)
  if (d) return d
  localSave('vorrat_' + table, LOCAL_DEFAULTS[table])
  return LOCAL_DEFAULTS[table]
}

const localListeners = {}
function localNotify(table) { localListeners[table]?.forEach(fn => fn()) }

function makeLocalStore(table) {
  if (!localListeners[table]) localListeners[table] = new Set()
  return {
    getAll() { return localGetOrInit(table) },
    subscribe(fn) {
      localListeners[table].add(fn)
      return () => localListeners[table].delete(fn)
    },
    add(item) {
      const rows = localGetOrInit(table)
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0)
      const newRow = { ...item, id: Date.now(), sort_order: maxSort + 1 }
      localSave('vorrat_' + table, [...rows, newRow])
      localNotify(table)
    },
    update(id, patch) {
      localSave('vorrat_' + table, localGetOrInit(table).map(r => r.id === id ? { ...r, ...patch } : r))
      localNotify(table)
    },
    remove(id) {
      localSave('vorrat_' + table, localGetOrInit(table).filter(r => r.id !== id))
      localNotify(table)
    },
    duplicate(id) {
      const rows = localGetOrInit(table)
      const src = rows.find(r => r.id === id); if (!src) return
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0)
      localSave('vorrat_' + table, [...rows, { ...src, id: Date.now(), sort_order: maxSort + 1, name: src.name + ' (Kopie)' }])
      localNotify(table)
    },
    reorder(ids) {
      const map = Object.fromEntries(localGetOrInit(table).map(r => [r.id, r]))
      localSave('vorrat_' + table, ids.map((id, i) => ({ ...map[id], sort_order: i + 1 })).filter(Boolean))
      localNotify(table)
    },
  }
}

/* ══════════════════════════════════════════════════════════
   SUPABASE STORE
══════════════════════════════════════════════════════════ */

// In-memory cache so components don't need to await on every render
const cache = { locations: null, food_groups: null, units: null }
const sbListeners = {}

async function sbLoad(table) {
  const { data } = await supabase
    .from(table).select('*').order('sort_order', { ascending: true })
  if (data) cache[table] = data
  return cache[table] || []
}

function sbNotify(table) { sbListeners[table]?.forEach(fn => fn()) }

function makeSupabaseStore(table) {
  if (!sbListeners[table]) sbListeners[table] = new Set()

  // Bootstrap cache immediately
  sbLoad(table)

  // Realtime subscription
  supabase.channel('admin_' + table)
    .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
      await sbLoad(table)
      sbNotify(table)
    })
    .subscribe()

  return {
    getAll() { return cache[table] || [] },

    subscribe(fn) {
      sbListeners[table].add(fn)
      // If cache already loaded, call immediately so UI populates
      if (cache[table]) fn()
      return () => sbListeners[table].delete(fn)
    },

    async add(item) {
      const rows = cache[table] || []
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0)
      await supabase.from(table).insert([{ ...item, sort_order: maxSort + 1 }])
      await sbLoad(table); sbNotify(table)
    },

    async update(id, patch) {
      await supabase.from(table).update(patch).eq('id', id)
      await sbLoad(table); sbNotify(table)
    },

    async remove(id) {
      await supabase.from(table).delete().eq('id', id)
      await sbLoad(table); sbNotify(table)
    },

    async duplicate(id) {
      const rows = cache[table] || []
      const src = rows.find(r => r.id === id); if (!src) return
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0)
      const { id: _id, created_at, updated_at, ...rest } = src
      await supabase.from(table).insert([{ ...rest, sort_order: maxSort + 1, name: src.name + ' (Kopie)' }])
      await sbLoad(table); sbNotify(table)
    },

    async reorder(ids) {
      const map = Object.fromEntries((cache[table] || []).map(r => [r.id, r]))
      const updates = ids.map((id, i) => ({ id, sort_order: i + 1 })).filter(u => map[u.id])
      await Promise.all(updates.map(u => supabase.from(table).update({ sort_order: u.sort_order }).eq('id', u.id)))
      await sbLoad(table); sbNotify(table)
    },
  }
}

/* ══════════════════════════════════════════════════════════
   EXPORTS – same API regardless of mode
══════════════════════════════════════════════════════════ */

const make = (table) => isLocalMode ? makeLocalStore(table) : makeSupabaseStore(table)

export const locationStore  = make('locations')
export const foodGroupStore = make('food_groups')
export const unitStore      = make('units')

// Legacy alias
export const foodStore = foodGroupStore

