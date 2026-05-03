const KEYS = {
  locations:  'vorrat_locations',
  foodGroups: 'vorrat_food_groups',
  units:      'vorrat_units',
  users:      'vorrat_users',
}

const DEFAULTS = {
  locations: [
    {id:1,name:'Kühlschrank',    icon:'❄️',note:'',sort:1},
    {id:2,name:'Kühlschrank 2',  icon:'❄️',note:'',sort:2},
    {id:3,name:'Gefrierschrank', icon:'🧊',note:'',sort:3},
    {id:4,name:'Gefrierkombi',   icon:'🧊',note:'',sort:4},
    {id:5,name:'Keller',         icon:'🏠',note:'',sort:5},
    {id:6,name:'Vorratsschrank', icon:'🚪',note:'',sort:6},
    {id:7,name:'Lagerregal',     icon:'📦',note:'',sort:7},
    {id:8,name:'Speisekammer',   icon:'🚪',note:'',sort:8},
    {id:9,name:'Sonstiges',      icon:'•', note:'',sort:9},
  ],
  foodGroups: [
    {id:1,  name:'Fleisch',          icon:'🥩',note:'',sort:1},
    {id:2,  name:'Geflügel',         icon:'🍗',note:'',sort:2},
    {id:3,  name:'Fisch & Meeresfrüchte',icon:'🐟',note:'',sort:3},
    {id:4,  name:'Wurst & Aufschnitt',icon:'🌭',note:'',sort:4},
    {id:5,  name:'Milch & Sahne',    icon:'🥛',note:'',sort:5},
    {id:6,  name:'Käse',             icon:'🧀',note:'',sort:6},
    {id:7,  name:'Butter & Fette',   icon:'🧈',note:'',sort:7},
    {id:8,  name:'Joghurt & Quark',  icon:'🫙',note:'',sort:8},
    {id:9,  name:'Eier',             icon:'🥚',note:'',sort:9},
    {id:10, name:'Gemüse',           icon:'🥦',note:'',sort:10},
    {id:11, name:'Kartoffeln & Wurzeln',icon:'🥔',note:'',sort:11},
    {id:12, name:'Obst',             icon:'🍎',note:'',sort:12},
    {id:13, name:'Brot & Backwaren', icon:'🍞',note:'',sort:13},
    {id:14, name:'Nudeln & Reis',    icon:'🍝',note:'',sort:14},
    {id:15, name:'Mehl & Backzutaten',icon:'🌾',note:'',sort:15},
    {id:16, name:'Hülsenfrüchte',    icon:'🫘',note:'',sort:16},
    {id:17, name:'Konserven',        icon:'🥫',note:'',sort:17},
    {id:18, name:'Tiefkühlware',     icon:'🧊',note:'',sort:18},
    {id:19, name:'Getränke',         icon:'💧',note:'',sort:19},
    {id:20, name:'Saucen & Gewürze', icon:'🫒',note:'',sort:20},
    {id:21, name:'Süßes & Snacks',   icon:'🍫',note:'',sort:21},
    {id:22, name:'Sonstiges',        icon:'📦',note:'',sort:22},
  ],
  units: [
    {id:1, name:'Stück',      abbr:'St.', note:'Einzelne Einheiten',sort:1},
    {id:2, name:'kg',         abbr:'kg',  note:'Kilogramm',         sort:2},
    {id:3, name:'g',          abbr:'g',   note:'Gramm',             sort:3},
    {id:4, name:'L',          abbr:'l',   note:'Liter',             sort:4},
    {id:5, name:'ml',         abbr:'ml',  note:'Milliliter',        sort:5},
    {id:6, name:'Dose/n',     abbr:'Ds.', note:'',                  sort:6},
    {id:7, name:'Glas/Gläser',abbr:'Gl.', note:'',                  sort:7},
    {id:8, name:'Beutel',     abbr:'Btl.',note:'',                  sort:8},
    {id:9, name:'Packung/en', abbr:'Pkg.',note:'',                  sort:9},
    {id:10,name:'Portion/en', abbr:'Por.',note:'',                  sort:10},
  ],
  users: [
    {id:1,name:'Admin',role:'admin',note:''},
  ],
}

export const USER_ROLES = ['admin','user','readonly']

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
  '🧂','🫒','🌶️','🍯','🫚','🥫',
  '🧁','🍰','🍫','🍬','🍭','🍿','🧇','🥞',
  '📦','❓',
]

function load(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)) }
function getOrInit(type) {
  const d = load(KEYS[type]); if (d) return d
  save(KEYS[type], DEFAULTS[type]); return DEFAULTS[type]
}

const listeners = {}
Object.keys(KEYS).forEach(k => { listeners[k] = new Set() })
function notify(type) { listeners[type]?.forEach(fn => fn()) }

function makeStore(type) {
  return {
    getAll()      { return getOrInit(type) },
    subscribe(fn) { listeners[type].add(fn); return () => listeners[type].delete(fn) },
    add(item) {
      const d = getOrInit(type)
      const maxSort = d.reduce((m, r) => Math.max(m, r.sort || 0), 0)
      const n = [...d, { ...item, id: Date.now(), sort: maxSort + 1 }]
      save(KEYS[type], n); notify(type); return n.at(-1)
    },
    update(id, patch) {
      const n = getOrInit(type).map(r => r.id === id ? { ...r, ...patch } : r)
      save(KEYS[type], n); notify(type)
    },
    remove(id) {
      const n = getOrInit(type).filter(r => r.id !== id)
      save(KEYS[type], n); notify(type)
    },
    duplicate(id) {
      const d = getOrInit(type)
      const src = d.find(r => r.id === id); if (!src) return
      const maxSort = d.reduce((m, r) => Math.max(m, r.sort || 0), 0)
      const copy = { ...src, id: Date.now(), sort: maxSort + 1, name: src.name + ' (Kopie)' }
      save(KEYS[type], [...d, copy]); notify(type)
    },
    reorder(ids) {
      const map = Object.fromEntries(getOrInit(type).map(r => [r.id, r]))
      const n = ids.map((id, i) => ({ ...map[id], sort: i + 1 })).filter(Boolean)
      save(KEYS[type], n); notify(type)
    },
  }
}

export const locationStore  = makeStore('locations')
export const foodGroupStore = makeStore('foodGroups')
export const unitStore      = makeStore('units')
export const userStore      = makeStore('users')

// Legacy alias so existing imports don't break immediately
export const foodStore = foodGroupStore
