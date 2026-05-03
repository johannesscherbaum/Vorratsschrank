const KEYS = {
  locations: 'vorrat_locations',
  foods:     'vorrat_foods',
  units:     'vorrat_units',
  users:     'vorrat_users',
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
  foods: [
    {id:1, name:'Hähnchenbrustfilet',icon:'🍗',category:'Fleisch & Fisch', default_unit:'',note:'',sort:1},
    {id:2, name:'Hackfleisch',       icon:'🥩',category:'Fleisch & Fisch', default_unit:'',note:'',sort:2},
    {id:3, name:'Lachs',             icon:'🐟',category:'Fleisch & Fisch', default_unit:'',note:'',sort:3},
    {id:4, name:'Vollmilch',         icon:'🥛',category:'Milchprodukte',   default_unit:'',note:'',sort:4},
    {id:5, name:'Butter',            icon:'🧈',category:'Milchprodukte',   default_unit:'',note:'',sort:5},
    {id:6, name:'Gouda',             icon:'🧀',category:'Milchprodukte',   default_unit:'',note:'',sort:6},
    {id:7, name:'Joghurt',           icon:'🫙',category:'Milchprodukte',   default_unit:'',note:'',sort:7},
    {id:8, name:'Spaghetti',         icon:'🍝',category:'Getreide & Brot', default_unit:'',note:'',sort:8},
    {id:9, name:'Reis',              icon:'🍚',category:'Getreide & Brot', default_unit:'',note:'',sort:9},
    {id:10,name:'Mehl',              icon:'🌾',category:'Backzutaten',     default_unit:'',note:'',sort:10},
    {id:11,name:'Passierte Tomaten', icon:'🍅',category:'Konserven',       default_unit:'',note:'',sort:11},
    {id:12,name:'Kichererbsen',      icon:'🫘',category:'Hülsenfrüchte',   default_unit:'',note:'',sort:12},
    {id:13,name:'Rote Linsen',       icon:'🫘',category:'Hülsenfrüchte',   default_unit:'',note:'',sort:13},
    {id:14,name:'Kartoffeln',        icon:'🥔',category:'Gemüse',          default_unit:'',note:'',sort:14},
    {id:15,name:'Zwiebeln',          icon:'🧅',category:'Gemüse',          default_unit:'',note:'',sort:15},
    {id:16,name:'Äpfel',             icon:'🍎',category:'Obst',            default_unit:'',note:'',sort:16},
    {id:17,name:'Erbsen TK',         icon:'🟢',category:'Tiefkühlware',    default_unit:'',note:'',sort:17},
    {id:18,name:'Mineralwasser',     icon:'💧',category:'Getränke',        default_unit:'',note:'',sort:18},
    {id:19,name:'Olivenöl',          icon:'🫒',category:'Gewürze & Saucen',default_unit:'',note:'',sort:19},
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

export const CATEGORIES = [
  'Fleisch & Fisch','Gemüse','Obst','Milchprodukte',
  'Getreide & Brot','Hülsenfrüchte','Konserven','Tiefkühlware',
  'Getränke','Gewürze & Saucen','Backzutaten','Sonstiges',
]
export const USER_ROLES = ['admin','user','readonly']

// Curated emoji sets for the icon picker
export const LOCATION_ICONS = [
  '❄️','🧊','🏠','🚪','📦','🗄️','🏪','🛒','🧺','🪣',
  '🍶','🫙','🥡','🍱','🫐','🥫','🪜','🏗️','🚗','🔒',
]
export const FOOD_ICONS = [
  '🥩','🍗','🐟','🦐','🥚','🧀','🥛','🧈','🍳',
  '🥦','🥕','🧅','🥔','🌽','🍅','🫑','🥒','🥬','🧄',
  '🍎','🍌','🍊','🍋','🍇','🍓','🫐','🍑','🥭','🍍',
  '🌾','🍞','🥐','🍝','🍚','🫘','🥜','🌰',
  '🥫','🫙','🍵','💧','🍷','🥤','🧃','☕',
  '🧂','🫒','🌶️','🧄','🍯','🫚','🧁','🍰','🍫','🍬',
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
      const src = d.find(r => r.id === id)
      if (!src) return
      const maxSort = d.reduce((m, r) => Math.max(m, r.sort || 0), 0)
      const copy = { ...src, id: Date.now(), sort: maxSort + 1, name: src.name + ' (Kopie)' }
      save(KEYS[type], [...d, copy]); notify(type)
    },

    // Accepts full ordered array of ids
    reorder(ids) {
      const map = Object.fromEntries(getOrInit(type).map(r => [r.id, r]))
      const n = ids.map((id, i) => ({ ...map[id], sort: i + 1 })).filter(Boolean)
      save(KEYS[type], n); notify(type)
    },
  }
}

export const locationStore = makeStore('locations')
export const foodStore     = makeStore('foods')
export const unitStore     = makeStore('units')
export const userStore     = makeStore('users')
