const KEYS = {
  locations: 'vorrat_locations',
  foods:     'vorrat_foods',
  units:     'vorrat_units',
  users:     'vorrat_users',
}

const DEFAULTS = {
  locations: [
    {id:1,name:'Kühlschrank',    icon:'❄️',note:''},
    {id:2,name:'Kühlschrank 2',  icon:'❄️',note:''},
    {id:3,name:'Gefrierschrank', icon:'🧊',note:''},
    {id:4,name:'Gefrierkombi',   icon:'🧊',note:''},
    {id:5,name:'Keller',         icon:'🏠',note:''},
    {id:6,name:'Vorratsschrank', icon:'🚪',note:''},
    {id:7,name:'Lagerregal',     icon:'📦',note:''},
    {id:8,name:'Speisekammer',   icon:'🚪',note:''},
    {id:9,name:'Sonstiges',      icon:'•', note:''},
  ],
  foods: [
    {id:1, name:'Hähnchenbrustfilet',category:'Fleisch & Fisch', default_unit:'kg',       note:''},
    {id:2, name:'Hackfleisch',       category:'Fleisch & Fisch', default_unit:'kg',       note:''},
    {id:3, name:'Lachs',             category:'Fleisch & Fisch', default_unit:'g',        note:''},
    {id:4, name:'Vollmilch',         category:'Milchprodukte',   default_unit:'L',        note:''},
    {id:5, name:'Butter',            category:'Milchprodukte',   default_unit:'g',        note:''},
    {id:6, name:'Gouda',             category:'Milchprodukte',   default_unit:'g',        note:''},
    {id:7, name:'Joghurt',           category:'Milchprodukte',   default_unit:'g',        note:''},
    {id:8, name:'Spaghetti',         category:'Getreide & Brot', default_unit:'Packung/en',note:''},
    {id:9, name:'Reis',              category:'Getreide & Brot', default_unit:'kg',       note:''},
    {id:10,name:'Mehl',              category:'Backzutaten',     default_unit:'kg',       note:''},
    {id:11,name:'Passierte Tomaten', category:'Konserven',       default_unit:'Dose/n',   note:''},
    {id:12,name:'Kichererbsen',      category:'Hülsenfrüchte',   default_unit:'Dose/n',   note:''},
    {id:13,name:'Rote Linsen',       category:'Hülsenfrüchte',   default_unit:'kg',       note:''},
    {id:14,name:'Kartoffeln',        category:'Gemüse',          default_unit:'kg',       note:''},
    {id:15,name:'Zwiebeln',          category:'Gemüse',          default_unit:'kg',       note:''},
    {id:16,name:'Äpfel',             category:'Obst',            default_unit:'kg',       note:''},
    {id:17,name:'Erbsen TK',         category:'Tiefkühlware',    default_unit:'g',        note:''},
    {id:18,name:'Mineralwasser',     category:'Getränke',        default_unit:'L',        note:''},
    {id:19,name:'Olivenöl',          category:'Gewürze & Saucen',default_unit:'ml',       note:''},
  ],
  units: [
    {id:1, name:'Stück',      abbr:'St.', note:'Einzelne Einheiten'},
    {id:2, name:'kg',         abbr:'kg',  note:'Kilogramm'},
    {id:3, name:'g',          abbr:'g',   note:'Gramm'},
    {id:4, name:'L',          abbr:'l',   note:'Liter'},
    {id:5, name:'ml',         abbr:'ml',  note:'Milliliter'},
    {id:6, name:'Dose/n',     abbr:'Ds.', note:''},
    {id:7, name:'Glas/Gläser',abbr:'Gl.', note:''},
    {id:8, name:'Beutel',     abbr:'Btl.',note:''},
    {id:9, name:'Packung/en', abbr:'Pkg.',note:''},
    {id:10,name:'Portion/en', abbr:'Por.',note:''},
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

function load(key) {
  try { const r=localStorage.getItem(key); return r?JSON.parse(r):null } catch{return null}
}
function save(key,data) { localStorage.setItem(key,JSON.stringify(data)) }
function getOrInit(type) {
  const d=load(KEYS[type]); if(d) return d
  save(KEYS[type],DEFAULTS[type]); return DEFAULTS[type]
}

const listeners={}
Object.keys(KEYS).forEach(k=>{listeners[k]=new Set()})
function notify(type){listeners[type]?.forEach(fn=>fn())}

function makeStore(type){
  return {
    getAll(){ return getOrInit(type) },
    subscribe(fn){ listeners[type].add(fn); return ()=>listeners[type].delete(fn) },
    add(item){ const d=getOrInit(type); const n=[...d,{...item,id:Date.now()}]; save(KEYS[type],n); notify(type); return n.at(-1) },
    update(id,patch){ const n=getOrInit(type).map(r=>r.id===id?{...r,...patch}:r); save(KEYS[type],n); notify(type) },
    remove(id){ const n=getOrInit(type).filter(r=>r.id!==id); save(KEYS[type],n); notify(type) },
  }
}

export const locationStore=makeStore('locations')
export const foodStore=makeStore('foods')
export const unitStore=makeStore('units')
export const userStore=makeStore('users')
