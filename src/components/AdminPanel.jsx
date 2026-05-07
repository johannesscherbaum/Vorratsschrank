import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import {
  locationStore, foodGroupStore, unitStore, userStore,
  USER_ROLES, LOCATION_ICONS, FOOD_ICONS,
} from '../lib/adminDb.js'

/* ── Helpers ─────────────────────────────────────────── */
function useStore(store) {
  const [rows, setRows] = useState(() => store.getAll())
  useEffect(() => {
    const unsub = store.subscribe(() => setRows(store.getAll()))
    // Trigger immediately so Supabase async data populates on mount
    setRows(store.getAll())
    return unsub
  }, []) // eslint-disable-line
  return [...rows].sort((a, b) => (a.sort_order || a.sort || 0) - (b.sort_order || b.sort || 0))
}

function Lbl({ children }) {
  return <label className="form-label" style={{ marginBottom: 4 }}>{children}</label>
}

/* ── Icon Picker ─────────────────────────────────────── */
function IconPickerPopup({ icons, value, onChange, onClose, anchorRef }) {
  const popupRef = React.useRef()
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popupH = 230
    const popupW = 260
    const spaceBelow = window.innerHeight - rect.bottom
    const top  = spaceBelow >= popupH ? rect.bottom + 6 : rect.top - popupH - 6
    const left = Math.min(rect.left, window.innerWidth - popupW - 8)
    setPos({ top: top + window.scrollY, left: left + window.scrollX })
  }, [anchorRef])

  React.useEffect(() => {
    const h = e => {
      if (!popupRef.current?.contains(e.target) && !anchorRef.current?.contains(e.target))
        onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose, anchorRef])

  return ReactDOM.createPortal(
    <div ref={popupRef} style={{
      position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999,
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
      padding: 10, width: 260,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 2, maxHeight: 200, overflowY: 'auto',
      }}>
        {icons.map(ic => (
          <button key={ic} type="button"
            className={`icon-option${value === ic ? ' selected' : ''}`}
            onMouseDown={e => { e.preventDefault(); onChange(ic); onClose() }}>
            {ic}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}

function IconPicker({ value, onChange, icons }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef()
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button ref={btnRef} type="button" className="icon-btn-trigger"
        onClick={() => setOpen(o => !o)} title="Icon wählen">
        {value || '❓'}
      </button>
      {open && (
        <IconPickerPopup icons={icons} value={value} onChange={onChange}
          onClose={() => setOpen(false)} anchorRef={btnRef} />
      )}
    </div>
  )
}

/* ── Inline editable cell ────────────────────────────── */
function EditCell({ value, onSave, type = 'text', options, mono = false, placeholder = '' }) {
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
      {value || (placeholder || '–')}
    </span>
  )
  if (type === 'select') return (
    <select ref={ref} value={val} className="edit-cell-select"
      onChange={e => setVal(e.target.value)} onBlur={commit}>
      <option value="">–</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
  if (type === 'number') return (
    <input ref={ref} type="number" min="1" value={val ?? ''} className="edit-cell-input"
      style={{ width: 72 }} placeholder="–"
      onChange={e => setVal(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={e => { if (e.key==='Enter')commit(); if (e.key==='Escape')cancel() }}
      onBlur={commit} />
  )
  return (
    <input ref={ref} value={val} className="edit-cell-input" placeholder={placeholder}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key==='Enter')commit(); if (e.key==='Escape')cancel() }}
      onBlur={commit} />
  )
}

/* ── Add Panel ───────────────────────────────────────── */
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

/* ── Drag reorder ────────────────────────────────────── */
function useDrag(rows, store) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const onDragStart = useCallback(id => setDragId(id), [])
  const onDragOver  = useCallback((e, id) => { e.preventDefault(); setOverId(id) }, [])
  const onDrop      = useCallback(() => {
    if (dragId == null || overId == null || dragId === overId) { setDragId(null); setOverId(null); return }
    const ids = rows.map(r => r.id)
    const from = ids.indexOf(dragId), to = ids.indexOf(overId)
    const r = [...ids]; r.splice(from, 1); r.splice(to, 0, dragId)
    store.reorder(r); setDragId(null); setOverId(null)
  }, [dragId, overId, rows, store])
  const onDragEnd = useCallback(() => { setDragId(null); setOverId(null) }, [])
  return { overId, onDragStart, onDragOver, onDrop, onDragEnd }
}

/* ══════════════════════════════════════════════════════
   LAGERORTE
══════════════════════════════════════════════════════ */
function LocationsTab() {
  const rows = useStore(locationStore)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'📦', note:'' })
  const drag = useDrag(rows, locationStore)
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
  const add = () => {
    if (!form.name.trim()) return
    locationStore.add({ name:form.name.trim(), icon:form.icon||'📦', note:form.note })
    setForm({ name:'', icon:'📦', note:'' }); setAdding(false)
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
          <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 2fr', gap:10 }}>
            <div><Lbl>Icon</Lbl>
              <IconPicker value={form.icon} icons={LOCATION_ICONS} onChange={ic => setForm(f=>({...f,icon:ic}))} />
            </div>
            <div><Lbl>Name *</Lbl>
              <input className="form-input" value={form.name} placeholder="z.B. Speisekeller"
                onChange={e => setForm(f=>({...f,name:e.target.value}))}
                onKeyDown={e => e.key==='Enter'&&add()} />
            </div>
            <div><Lbl>Notiz</Lbl>
              <input className="form-input" value={form.note} placeholder="Optional"
                onChange={e => setForm(f=>({...f,note:e.target.value}))} />
            </div>
          </div>
        </AddPanel>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr>
            <th style={{width:32}}></th>
            <th style={{width:52}}>Icon</th>
            <th>Name</th>
            <th>Notiz</th>
            <th style={{width:110}}></th>
          </tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Keine Lagerorte.</td></tr>}
            {filtered.map(r => (
              <tr key={r.id} className={`drag-row${drag.overId===r.id?' drag-over':''}`}
                draggable onDragStart={()=>drag.onDragStart(r.id)}
                onDragOver={e=>drag.onDragOver(e,r.id)} onDrop={drag.onDrop} onDragEnd={drag.onDragEnd}>
                <td><span className="drag-handle">⠿</span></td>
                <td><IconPicker value={r.icon} icons={LOCATION_ICONS} onChange={ic=>locationStore.update(r.id,{icon:ic})} /></td>
                <td><EditCell value={r.name} onSave={v=>v.trim()&&locationStore.update(r.id,{name:v.trim()})} /></td>
                <td className="td-muted"><EditCell value={r.note||''} placeholder="Notiz…" onSave={v=>locationStore.update(r.id,{note:v})} /></td>
                <td><div className="row-actions">
                  <button className="row-btn" title="Duplizieren" onClick={()=>locationStore.duplicate(r.id)}>⧉</button>
                  <button className="row-btn danger" onClick={()=>window.confirm(`„${r.name}" löschen?`)&&locationStore.remove(r.id)}>✕</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">{rows.length} Lagerort{rows.length!==1?'e':''} · ⠿ ziehen zum Sortieren · Icon klicken zum Ändern · ⧉ = Duplizieren</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   LEBENSMITTEL
══════════════════════════════════════════════════════ */
function FoodsTab() {
  const rows = useStore(foodGroupStore)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'📦', note:'', default_days:'' })
  const drag = useDrag(rows, foodGroupStore)
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
  const add = () => {
    if (!form.name.trim()) return
    const days = form.default_days !== '' ? Number(form.default_days) : null
    foodGroupStore.add({ ...form, name:form.name.trim(), default_days: days || null })
    setForm({ name:'', icon:'📦', note:'', default_days:'' }); setAdding(false)
  }
  return (
    <div>
      <div className="toolbar">
        <input className="form-input" style={{ maxWidth:200 }} placeholder="Suchen…"
          value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setAdding(a=>!a)}>
          {adding ? '✕ Abbrechen' : '+ Gruppe'}
        </button>
      </div>
      {adding && (
        <AddPanel title="Neue Lebensmittelgruppe" onCancel={() => setAdding(false)} onSave={add}>
          <div style={{ display:'grid', gridTemplateColumns:'44px 2fr 2fr 100px', gap:10, alignItems:'end' }}>
            <div><Lbl>Icon</Lbl>
              <IconPicker value={form.icon} icons={FOOD_ICONS} onChange={ic => setForm(f=>({...f,icon:ic}))} />
            </div>
            <div><Lbl>Name *</Lbl>
              <input className="form-input" value={form.name} placeholder="z.B. Fleisch"
                onChange={e => setForm(f=>({...f,name:e.target.value}))}
                onKeyDown={e => e.key==='Enter'&&add()} />
            </div>
            <div><Lbl>Notiz</Lbl>
              <input className="form-input" value={form.note} placeholder="Optional"
                onChange={e => setForm(f=>({...f,note:e.target.value}))} />
            </div>
            <div><Lbl>MHD-Standard (Tage)</Lbl>
              <input className="form-input" type="number" min="1" value={form.default_days} placeholder="–"
                onChange={e => setForm(f=>({...f,default_days:e.target.value}))} />
            </div>
          </div>
        </AddPanel>
      )}
      {filtered.length===0 && <p style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Keine Gruppen.</p>}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr>
            <th style={{width:32}}></th>
            <th style={{width:52}}>Icon</th>
            <th>Gruppenname</th>
            <th>Notiz</th>
            <th style={{width:130}} title="Standard-Haltbarkeit in Tagen – wird beim Einlagern als MHD-Vorschlag verwendet">MHD-Standard (Tage)</th>
            <th style={{width:110}}></th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className={`drag-row${drag.overId===r.id?' drag-over':''}`}
                draggable onDragStart={()=>drag.onDragStart(r.id)}
                onDragOver={e=>drag.onDragOver(e,r.id)} onDrop={drag.onDrop} onDragEnd={drag.onDragEnd}>
                <td><span className="drag-handle">⠿</span></td>
                <td><IconPicker value={r.icon||'📦'} icons={FOOD_ICONS} onChange={ic=>foodGroupStore.update(r.id,{icon:ic})} /></td>
                <td><EditCell value={r.name} onSave={v=>v.trim()&&foodGroupStore.update(r.id,{name:v.trim()})} /></td>
                <td className="td-muted"><EditCell value={r.note||''} placeholder="Notiz…" onSave={v=>foodGroupStore.update(r.id,{note:v})} /></td>
                <td style={{textAlign:'right'}}>
                  <EditCell type="number" value={r.default_days ?? null} placeholder="–"
                    onSave={v=>foodGroupStore.update(r.id,{default_days:v||null})} />
                </td>
                <td><div className="row-actions">
                  <button className="row-btn" title="Duplizieren" onClick={()=>foodGroupStore.duplicate(r.id)}>⧉</button>
                  <button className="row-btn danger" onClick={()=>window.confirm(`„${r.name}" löschen?`)&&foodGroupStore.remove(r.id)}>✕</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">{rows.length} Gruppen · ⠿ ziehen zum Sortieren · ⧉ = Duplizieren · MHD-Standard = Tage Haltbarkeit ab Einlagerungsdatum</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   EINHEITEN
══════════════════════════════════════════════════════ */
function UnitsTab() {
  const rows = useStore(unitStore)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', abbr:'', note:'' })
  const drag = useDrag(rows, unitStore)
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
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 3fr', gap:10 }}>
            {[{l:'Name *',f:'name',p:'Flasche/n'},{l:'Abk.',f:'abbr',p:'Fl.'},{l:'Beschreibung',f:'note',p:'Optional'}].map(({l,f,p})=>(
              <div key={f}><Lbl>{l}</Lbl>
                <input className="form-input" value={form[f]} placeholder={p}
                  onChange={e => setForm(x=>({...x,[f]:e.target.value}))}
                  onKeyDown={e => e.key==='Enter'&&add()} />
              </div>
            ))}
          </div>
        </AddPanel>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr>
            <th style={{width:32}}></th>
            <th>Name</th><th style={{width:100}}>Abk.</th><th>Beschreibung</th><th style={{width:60}}></th>
          </tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Keine Einheiten.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className={`drag-row${drag.overId===r.id?' drag-over':''}`}
                draggable onDragStart={()=>drag.onDragStart(r.id)}
                onDragOver={e=>drag.onDragOver(e,r.id)} onDrop={drag.onDrop} onDragEnd={drag.onDragEnd}>
                <td><span className="drag-handle">⠿</span></td>
                <td style={{fontWeight:500}}><EditCell value={r.name} onSave={v=>v.trim()&&unitStore.update(r.id,{name:v.trim()})} /></td>
                <td><EditCell value={r.abbr||''} onSave={v=>unitStore.update(r.id,{abbr:v})} mono /></td>
                <td className="td-muted"><EditCell value={r.note||''} onSave={v=>unitStore.update(r.id,{note:v})} /></td>
                <td><div className="row-actions">
                  <button className="row-btn danger" onClick={()=>window.confirm(`„${r.name}" löschen?`)&&unitStore.remove(r.id)}>✕</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">⠿ ziehen zum Sortieren · Reihenfolge = Anzeigereihenfolge in Formularen</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   BENUTZER
══════════════════════════════════════════════════════ */
function UsersTab() {
  const rows = useStore(userStore)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', role:'user', note:'' })
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
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 3fr', gap:10 }}>
            <div><Lbl>Name *</Lbl>
              <input className="form-input" value={form.name} placeholder="z.B. Maria"
                onChange={e => setForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} />
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
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr>
            <th>Benutzer</th><th style={{width:140}}>Rolle</th><th>Notiz</th><th style={{width:60}}></th>
          </tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={4} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Keine Benutzer.</td></tr>}
            {rows.map(r => {
              const hue = [...r.name].reduce((a,c)=>a+c.charCodeAt(0),0)%360
              return (
                <tr key={r.id}>
                  <td><div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="avatar" style={{ background:`hsl(${hue},50%,88%)`, color:`hsl(${hue},50%,30%)` }}>{initials(r.name)}</div>
                    <EditCell value={r.name} onSave={v=>v.trim()&&userStore.update(r.id,{name:v.trim()})} />
                  </div></td>
                  <td><span className={`badge role-${r.role}`}>
                    <EditCell value={r.role} type="select" options={USER_ROLES} onSave={v=>userStore.update(r.id,{role:v})} />
                  </span></td>
                  <td className="td-muted"><EditCell value={r.note||''} onSave={v=>userStore.update(r.id,{note:v})} /></td>
                  <td><div className="row-actions" style={{opacity:1}}>
                    <button className="row-btn danger" onClick={()=>{
                      if(rows.length<=1){alert('Mind. 1 Benutzer erforderlich.');return}
                      if(window.confirm(`„${r.name}" löschen?`))userStore.remove(r.id)
                    }}>✕</button>
                  </div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">admin = voll · user = normal · readonly = nur lesen</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Main
══════════════════════════════════════════════════════ */
const TABS = [
  { id:'locations', label:'Lagerorte',    icon:'📍' },
  { id:'foods',     label:'Lebensmittelgruppen', icon:'🥦' },
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
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span>{t.icon}</span><span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      {tab==='locations' && <LocationsTab />}
      {tab==='foods'     && <FoodsTab />}
      {tab==='units'     && <UnitsTab />}
      {tab==='users'     && <UsersTab />}
    </div>
  )
}
