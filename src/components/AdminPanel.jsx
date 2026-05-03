import React, { useState, useEffect, useRef } from 'react'
import { locationStore, foodStore, unitStore, userStore, CATEGORIES, USER_ROLES } from '../lib/adminDb.js'

function useStore(store) {
  const [rows, setRows] = useState(() => store.getAll())
  useEffect(() => store.subscribe(() => setRows(store.getAll())), [])
  return rows
}

function EditCell({ value, onSave, type='text', options, mono=false }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)
  const ref = useRef()
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setVal(value) }, [value])
  const commit = () => { onSave(val); setEditing(false) }
  const cancel = () => { setVal(value); setEditing(false) }

  if (!editing) return (
    <span className={value ? 'edit-cell-view' : 'edit-cell-empty'}
      style={{ fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 12 : 13 }}
      onClick={() => setEditing(true)} title="Klicken zum Bearbeiten">
      {value || '–'}
    </span>
  )
  if (type === 'select') return (
    <select ref={ref} value={val} className="edit-cell-select"
      onChange={e => setVal(e.target.value)} onBlur={commit}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
  return (
    <input ref={ref} value={val} className="edit-cell-input"
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if(e.key==='Enter')commit(); if(e.key==='Escape')cancel() }}
      onBlur={commit} />
  )
}

function AddPanel({ title, children, onSave, onCancel }) {
  return (
    <div className="add-panel">
      <p className="add-panel-title">{title}</p>
      {children}
      <div className="add-panel-footer">
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
        <button className="btn btn-ghost"   onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  )
}

function DataTable({ cols, children, empty }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{cols.map((c,i) => <th key={i} style={c.w?{width:c.w}:{}}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {children}
          {empty && <tr><td colSpan={cols.length} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Lbl({ children }) {
  return <label className="form-label" style={{ marginBottom:4 }}>{children}</label>
}

/* ── Tabs ─────────────────────────────────────────────── */

function LocationsTab() {
  const rows = useStore(locationStore)
  const [q, setQ]           = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ name:'', icon:'', note:'' })
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
  const add = () => {
    if (!form.name.trim()) return
    locationStore.add({ name:form.name.trim(), icon:form.icon||'📦', note:form.note })
    setForm({ name:'', icon:'', note:'' }); setAdding(false)
  }
  return (
    <div>
      <div className="toolbar">
        <input className="form-input" style={{ maxWidth:240 }} placeholder="Suchen…"
          value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setAdding(a=>!a)}>
          {adding ? '✕ Abbrechen' : '+ Lagerort'}
        </button>
      </div>
      {adding && (
        <AddPanel title="Neuen Lagerort anlegen" onCancel={() => setAdding(false)} onSave={add}>
          <div className="add-panel-grid" style={{ gridTemplateColumns:'56px 1fr 2fr' }}>
            {[{l:'Icon',f:'icon',p:'📦'},{l:'Name *',f:'name',p:'Speisekeller'},{l:'Notiz',f:'note',p:'Optional'}].map(({l,f,p}) => (
              <div key={f}><Lbl>{l}</Lbl>
                <input className="form-input" value={form[f]} placeholder={p}
                  onChange={e => setForm(x=>({...x,[f]:e.target.value}))}
                  onKeyDown={e => e.key==='Enter' && add()} />
              </div>
            ))}
          </div>
        </AddPanel>
      )}
      <DataTable cols={[{label:'',w:44},{label:'Name'},{label:'Notiz'},{label:'',w:44}]}
        empty={filtered.length===0 ? 'Keine Lagerorte.' : null}>
        {filtered.map(r => (
          <tr key={r.id}>
            <td><EditCell value={r.icon} onSave={v => locationStore.update(r.id,{icon:v})} /></td>
            <td><EditCell value={r.name} onSave={v => v.trim()&&locationStore.update(r.id,{name:v.trim()})} /></td>
            <td className="td-muted"><EditCell value={r.note||''} onSave={v => locationStore.update(r.id,{note:v})} /></td>
            <td style={{textAlign:'right'}}>
              <button className="btn-danger-ghost btn" onClick={() => window.confirm(`„${r.name}" löschen?`)&&locationStore.remove(r.id)}>✕</button>
            </td>
          </tr>
        ))}
      </DataTable>
      <p className="hint">{rows.length} Lagerort{rows.length!==1?'e':''} · Felder direkt klickbar</p>
    </div>
  )
}

function FoodsTab({ units }) {
  const rows = useStore(foodStore)
  const [q, setQ]           = useState('')
  const [catF, setCatF]     = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ name:'', category:CATEGORIES[0], default_unit:'Stück', note:'' })
  const uNames = units.map(u => u.name)
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) && (!catF||r.category===catF))
  const byCat = {}
  filtered.forEach(r => { if(!byCat[r.category]) byCat[r.category]=[]; byCat[r.category].push(r) })
  const add = () => {
    if (!form.name.trim()) return
    foodStore.add({...form, name:form.name.trim()})
    setForm({ name:'', category:CATEGORIES[0], default_unit:'Stück', note:'' }); setAdding(false)
  }
  return (
    <div>
      <div className="toolbar">
        <input className="form-input" style={{ maxWidth:200 }} placeholder="Suchen…"
          value={q} onChange={e => setQ(e.target.value)} />
        <select className="form-select" style={{ width:'auto' }} value={catF} onChange={e => setCatF(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setAdding(a=>!a)}>
          {adding ? '✕ Abbrechen' : '+ Lebensmittel'}
        </button>
      </div>
      {adding && (
        <AddPanel title="Neues Lebensmittel" onCancel={() => setAdding(false)} onSave={add}>
          <div className="add-panel-grid" style={{ gridTemplateColumns:'2fr 2fr 1fr 2fr' }}>
            {[{l:'Name *',f:'name',t:'text',p:'z.B. Mozzarella'},
              {l:'Kategorie',f:'category',t:'sel',opts:CATEGORIES},
              {l:'Einheit',f:'default_unit',t:'sel',opts:uNames},
              {l:'Notiz',f:'note',t:'text',p:'Optional'}].map(({l,f,t,p,opts}) => (
              <div key={f}><Lbl>{l}</Lbl>
                {t==='sel'
                  ? <select className="form-select" value={form[f]} onChange={e => setForm(x=>({...x,[f]:e.target.value}))}>
                      {opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input className="form-input" value={form[f]} placeholder={p}
                      onChange={e => setForm(x=>({...x,[f]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter'&&add()} />
                }
              </div>
            ))}
          </div>
        </AddPanel>
      )}
      {filtered.length===0 && <p style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>Keine Lebensmittel.</p>}
      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0 8px' }}>
            <span style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em' }}>{cat}</span>
            <span style={{ fontSize:11,color:'var(--text-muted)',background:'var(--gray-light)',borderRadius:999,padding:'1px 8px' }}>{items.length}</span>
          </div>
          <DataTable cols={[{label:'Name'},{label:'Einheit',w:130},{label:'Notiz'},{label:'',w:44}]}>
            {items.map(r => (
              <tr key={r.id}>
                <td><EditCell value={r.name} onSave={v => v.trim()&&foodStore.update(r.id,{name:v.trim()})} /></td>
                <td><EditCell value={r.default_unit} type="select" options={uNames} onSave={v => foodStore.update(r.id,{default_unit:v})} /></td>
                <td className="td-muted"><EditCell value={r.note||''} onSave={v => foodStore.update(r.id,{note:v})} /></td>
                <td style={{textAlign:'right'}}>
                  <button className="btn-danger-ghost btn" onClick={() => window.confirm(`„${r.name}" löschen?`)&&foodStore.remove(r.id)}>✕</button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      ))}
      <p className="hint">{rows.length} Lebensmittel gesamt · Felder direkt klickbar</p>
    </div>
  )
}

function UnitsTab() {
  const rows = useStore(unitStore)
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ name:'', abbr:'', note:'' })
  const add = () => {
    if (!form.name.trim()) return
    unitStore.add({ name:form.name.trim(), abbr:form.abbr.trim(), note:form.note })
    setForm({ name:'', abbr:'', note:'' }); setAdding(false)
  }
  return (
    <div>
      <div className="toolbar">
        <span style={{ color:'var(--text-secondary)', fontSize:13 }}>{rows.length} Einheiten</span>
        <button className="btn btn-primary" onClick={() => setAdding(a=>!a)}>
          {adding ? '✕ Abbrechen' : '+ Einheit'}
        </button>
      </div>
      {adding && (
        <AddPanel title="Neue Mengeneinheit" onCancel={() => setAdding(false)} onSave={add}>
          <div className="add-panel-grid" style={{ gridTemplateColumns:'2fr 1fr 3fr' }}>
            {[{l:'Name *',f:'name',p:'Flasche/n'},{l:'Abk.',f:'abbr',p:'Fl.'},{l:'Beschreibung',f:'note',p:'Optional'}].map(({l,f,p}) => (
              <div key={f}><Lbl>{l}</Lbl>
                <input className="form-input" value={form[f]} placeholder={p}
                  onChange={e => setForm(x=>({...x,[f]:e.target.value}))}
                  onKeyDown={e => e.key==='Enter'&&add()} />
              </div>
            ))}
          </div>
        </AddPanel>
      )}
      <DataTable cols={[{label:'Name'},{label:'Abk.',w:100},{label:'Beschreibung'},{label:'',w:44}]}
        empty={rows.length===0 ? 'Keine Einheiten.' : null}>
        {rows.map(r => (
          <tr key={r.id}>
            <td style={{ fontWeight:500 }}><EditCell value={r.name} onSave={v => v.trim()&&unitStore.update(r.id,{name:v.trim()})} /></td>
            <td><EditCell value={r.abbr||''} onSave={v => unitStore.update(r.id,{abbr:v})} mono /></td>
            <td className="td-muted"><EditCell value={r.note||''} onSave={v => unitStore.update(r.id,{note:v})} /></td>
            <td style={{textAlign:'right'}}>
              <button className="btn-danger-ghost btn" onClick={() => window.confirm(`„${r.name}" löschen?`)&&unitStore.remove(r.id)}>✕</button>
            </td>
          </tr>
        ))}
      </DataTable>
      <p className="hint">Reihenfolge bestimmt Anzeigereihenfolge in Formularen</p>
    </div>
  )
}

function UsersTab() {
  const rows = useStore(userStore)
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ name:'', role:'user', note:'' })
  const add = () => {
    if (!form.name.trim()) return
    userStore.add({ name:form.name.trim(), role:form.role, note:form.note })
    setForm({ name:'', role:'user', note:'' }); setAdding(false)
  }
  const initials = n => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return (
    <div>
      <div className="toolbar">
        <span style={{ color:'var(--text-secondary)', fontSize:13 }}>{rows.length} Benutzer</span>
        <button className="btn btn-primary" onClick={() => setAdding(a=>!a)}>
          {adding ? '✕ Abbrechen' : '+ Benutzer'}
        </button>
      </div>
      {adding && (
        <AddPanel title="Neuen Benutzer anlegen" onCancel={() => setAdding(false)} onSave={add}>
          <div className="add-panel-grid" style={{ gridTemplateColumns:'2fr 1fr 3fr' }}>
            <div><Lbl>Name *</Lbl>
              <input className="form-input" value={form.name} placeholder="z.B. Maria"
                onChange={e => setForm(f=>({...f,name:e.target.value}))} onKeyDown={e => e.key==='Enter'&&add()} />
            </div>
            <div><Lbl>Rolle</Lbl>
              <select className="form-select" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                {USER_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><Lbl>Notiz</Lbl>
              <input className="form-input" value={form.note} placeholder="Optional"
                onChange={e => setForm(f=>({...f,note:e.target.value}))} />
            </div>
          </div>
        </AddPanel>
      )}
      <DataTable cols={[{label:'Benutzer'},{label:'Rolle',w:140},{label:'Notiz'},{label:'',w:44}]}
        empty={rows.length===0 ? 'Keine Benutzer.' : null}>
        {rows.map(r => {
          const hue = [...r.name].reduce((a,c)=>a+c.charCodeAt(0),0) % 360
          return (
            <tr key={r.id}>
              <td>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="avatar" style={{ background:`hsl(${hue},50%,88%)`, color:`hsl(${hue},50%,30%)` }}>
                    {initials(r.name)}
                  </div>
                  <EditCell value={r.name} onSave={v => v.trim()&&userStore.update(r.id,{name:v.trim()})} />
                </div>
              </td>
              <td>
                <span className={`badge role-${r.role}`}>
                  <EditCell value={r.role} type="select" options={USER_ROLES} onSave={v => userStore.update(r.id,{role:v})} />
                </span>
              </td>
              <td className="td-muted"><EditCell value={r.note||''} onSave={v => userStore.update(r.id,{note:v})} /></td>
              <td style={{textAlign:'right'}}>
                <button className="btn-danger-ghost btn" onClick={() => {
                  if (rows.length<=1) { alert('Mind. 1 Benutzer erforderlich.'); return }
                  if (window.confirm(`„${r.name}" löschen?`)) userStore.remove(r.id)
                }}>✕</button>
              </td>
            </tr>
          )
        })}
      </DataTable>
      <p className="hint">admin = voll · user = normal · readonly = nur lesen</p>
    </div>
  )
}

const TABS = [
  { id:'locations', label:'Lagerorte',    icon:'📍' },
  { id:'foods',     label:'Lebensmittel', icon:'🥦' },
  { id:'units',     label:'Einheiten',    icon:'⚖️' },
  { id:'users',     label:'Benutzer',     icon:'👤' },
]

export default function AdminPanel() {
  const [tab, setTab] = useState('locations')
  const units = useStore(unitStore)
  return (
    <div>
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      {tab==='locations' && <LocationsTab />}
      {tab==='foods'     && <FoodsTab units={units} />}
      {tab==='units'     && <UnitsTab />}
      {tab==='users'     && <UsersTab />}
    </div>
  )
}
