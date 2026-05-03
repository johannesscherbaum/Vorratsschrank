const KEY = 'vorrat_items'

function load(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]} }
function persist(items){ localStorage.setItem(KEY,JSON.stringify(items)) }
function today(){ return new Date().toISOString().split('T')[0] }
function d(offset){ const dt=new Date(); dt.setDate(dt.getDate()+offset); return dt.toISOString().split('T')[0] }

function seed(){
  const items=[
    {id:1, name:'Hähnchenbrustfilets',qty:2,  unit:'kg',        location:'Gefrierschrank',stored_at:d(-30),expires_at:d(60), category:'Fleisch & Fisch',note:'',ean:''},
    {id:2, name:'Erbsen TK',          qty:500,unit:'g',         location:'Gefrierschrank',stored_at:d(-60),expires_at:d(120),category:'Tiefkühlware',   note:'',ean:''},
    {id:3, name:'Vollmilch',          qty:2,  unit:'L',         location:'Kühlschrank',   stored_at:d(-3), expires_at:d(4),  category:'Milchprodukte',  note:'',ean:''},
    {id:4, name:'Gouda',              qty:300,unit:'g',         location:'Kühlschrank',   stored_at:d(-5), expires_at:d(14), category:'Milchprodukte',  note:'',ean:''},
    {id:5, name:'Passierte Tomaten',  qty:6,  unit:'Dose/n',    location:'Vorratsschrank',stored_at:d(-90),expires_at:d(365),category:'Konserven',       note:'',ean:''},
    {id:6, name:'Spaghetti',          qty:3,  unit:'Packung/en',location:'Vorratsschrank',stored_at:d(-45),expires_at:d(300),category:'Getreide & Brot', note:'',ean:''},
    {id:7, name:'Kartoffeln',         qty:5,  unit:'kg',        location:'Keller',        stored_at:d(-7), expires_at:d(30), category:'Gemüse',          note:'Festkochend',ean:''},
    {id:8, name:'Butter',             qty:250,unit:'g',         location:'Kühlschrank',   stored_at:d(-2), expires_at:d(5),  category:'Milchprodukte',  note:'',ean:''},
    {id:9, name:'Rotwein',            qty:12, unit:'Stück',     location:'Keller',        stored_at:d(-200),expires_at:'',  category:'Getränke',        note:'Bordeaux 2021',ean:''},
  ]
  persist(items); return items
}

const listeners=new Set()
function notify(){ listeners.forEach(fn=>fn()) }

export const localDb={
  subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn) },
  async select(){ let items=load(); if(!items.length) items=seed(); return{data:items,error:null} },
  async insert(rows){
    const items=load()
    const newItems=rows.map(r=>({...r,id:Date.now()+Math.random(),created_at:new Date().toISOString(),stored_at:r.stored_at||today()}))
    persist([...items,...newItems]); notify(); return{data:newItems,error:null}
  },
  async update(row,id){
    persist(load().map(i=>i.id===id?{...i,...row}:i)); notify(); return{data:null,error:null}
  },
  async delete(id){
    persist(load().filter(i=>i.id!==id)); notify(); return{data:null,error:null}
  },
}
