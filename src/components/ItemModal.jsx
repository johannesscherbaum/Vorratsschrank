import React, { useState, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner.jsx'
import { lookupEAN }  from '../lib/eanLookup.js'
import { locationStore, foodGroupStore, unitStore } from '../lib/adminDb.js'

const today = () => new Date().toISOString().split('T')[0]

function Field({ label, error, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export default function ItemModal({ item, onSave, onClose }) {
  const [locations,   setLocations]   = useState(() => locationStore.getAll())
  const [foodGroups,  setFoodGroups]  = useState(() => [...foodGroupStore.getAll()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)))
  const [units,       setUnits]       = useState(() => [...unitStore.getAll()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)))

  useEffect(() => {
    const refresh1 = () => setLocations([...locationStore.getAll()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)))
    const refresh2 = () => setFoodGroups([...foodGroupStore.getAll()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)))
    const refresh3 = () => setUnits([...unitStore.getAll()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)))
    const u1 = locationStore.subscribe(refresh1)
    const u2 = foodGroupStore.subscribe(refresh2)
    const u3 = unitStore.subscribe(refresh3)
    // Trigger immediately in case Supabase data already loaded
    refresh1(); refresh2(); refresh3()
    return () => { u1(); u2(); u3() }
  }, [])

  const unitNames = [...units].sort((a,b)=>(a.sort||0)-(b.sort||0)).map(u => u.name)

  const [form, setForm] = useState({
    name:'', qty:'', unit:'', location:'',
    food_group:'', stored_at:today(), expires_at:'', note:'', ean:'',
  })
  const [scanning, setScanning] = useState(false)
  const [looking,  setLooking]  = useState(false)
  const [scanMsg,  setScanMsg]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  useEffect(() => {
    if (item) {
      // dateOrNull: only accept valid YYYY-MM-DD strings
      const dn = v => (v && String(v).match(/^\d{4}-\d{2}-\d{2}$/)) ? v : ''
      setForm({
        name:       item.name       || '',
        qty:        item.qty        ?? '',
        unit:       item.unit       || '',
        location:   item.location   || '',
        food_group: item.food_group || '',
        stored_at:  dn(item.stored_at) || today(),
        expires_at: dn(item.expires_at),
        note:       item.note       || '',
        ean:        item.ean        || '',
      })
    }
  }, [item]) // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Selected group object (for icon preview)
  const selectedGroup = foodGroups.find(g => g.name === form.food_group)

  const handleEAN = async (ean) => {
    setScanning(false); setLooking(true); setScanMsg(''); set('ean', ean)
    const p = await lookupEAN(ean)
    setLooking(false)
    if (!p?.name) { setScanMsg(`EAN ${ean} – kein Produkt gefunden.`); return }
    setForm(f => ({
      ...f, ean,
      name: p.name || f.name,
      qty:  p.qty !== '' ? p.qty : f.qty,
      unit: p.unit || f.unit,
    }))
    setScanMsg(`✓ „${p.name}" gefunden`)
  }

  const submit = async () => {
    const e = {}
    if (!form.name.trim()) e.name     = 'Name erforderlich'
    if (!form.location)    e.location = 'Standort erforderlich'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    // Clean payload: empty strings → null (especially for date fields)
    const strOrNull  = v => (v && v.trim()) ? v.trim() : null
    const dateOrNull = v => (v && v.match(/^\d{4}-\d{2}-\d{2}$/)) ? v : null
    const payload = {
      name:       form.name.trim(),
      location:   form.location,
      qty:        form.qty !== '' && form.qty !== null ? Number(form.qty) : null,
      unit:       strOrNull(form.unit),
      food_group: strOrNull(form.food_group),
      stored_at:  dateOrNull(form.stored_at),
      expires_at: dateOrNull(form.expires_at),
      note:       strOrNull(form.note),
      ean:        strOrNull(form.ean),
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <>
      {scanning && <BarcodeScanner onDetected={handleEAN} onClose={() => setScanning(false)} />}

      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-handle" />

          <div className="modal-header">
            <h2 className="modal-title">{item?.id ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}</h2>
            <button className="btn btn-ghost" onClick={onClose} style={{ padding:'6px 10px' }}>✕</button>
          </div>

          {/* EAN */}
          <div className="ean-section">
            <div className="ean-row">
              <button className="btn btn-ghost" onClick={() => setScanning(true)} disabled={looking}>
                {looking ? '⟳' : '▦'} Barcode
              </button>
              <input className="form-input" style={{ flex:1 }} placeholder="EAN manuell…"
                value={form.ean} onChange={e => set('ean', e.target.value)}
                onBlur={e => e.target.value.length >= 8 && handleEAN(e.target.value.trim())} />
            </div>
            {scanMsg && (
              <div className={`scan-feedback ${scanMsg.startsWith('✓') ? 'ok' : 'err'}`}>{scanMsg}</div>
            )}
          </div>

          <hr className="modal-divider" />

          {/* Lebensmittelgruppe */}
          <Field label="Lebensmittelgruppe">
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {/* Icon preview */}
              <div style={{
                width:42, height:42, flexShrink:0,
                background:'var(--gray-light)', borderRadius:'var(--radius-sm)',
                border:'1px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22,
              }}>
                {selectedGroup?.icon || '❓'}
              </div>
              <select className="form-select" style={{ flex:1 }}
                value={form.food_group} onChange={e => set('food_group', e.target.value)}>
                <option value="">– Gruppe wählen (optional) –</option>
                {foodGroups.map(g => (
                  <option key={g.id} value={g.name}>{g.icon} {g.name}</option>
                ))}
              </select>
            </div>
          </Field>

          {/* Name – Freitext */}
          <Field label="Bezeichnung *" error={errors.name}>
            <input className="form-input" value={form.name} autoComplete="off"
              placeholder="z.B. Hähnchenbrustfilet, Steak vom Metzger…"
              onChange={e => set('name', e.target.value)} />
          </Field>

          {/* Menge + Einheit */}
          <div className="form-grid-2">
            <Field label="Menge">
              <input className="form-input" type="number" min="0" step="0.1"
                value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="1" />
            </Field>
            <Field label="Einheit">
              <select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                <option value="">– bitte wählen –</option>
                {unitNames.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          {/* Standort */}
          <Field label="Standort *" error={errors.location}>
            <select className="form-select" value={form.location} onChange={e => set('location', e.target.value)}>
              <option value="">Bitte wählen…</option>
              {[...locations].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(l => (
                <option key={l.id} value={l.name}>{l.icon ? l.icon+' ' : ''}{l.name}</option>
              ))}
            </select>
          </Field>

          {/* Datum */}
          <div className="form-grid-2">
            <Field label="Eingelagert am">
              <input className="form-input" type="date" value={form.stored_at}
                onChange={e => set('stored_at', e.target.value)} />
            </Field>
            <Field label="MHD">
              <input className="form-input" type="date" value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)} />
            </Field>
          </div>

          {/* Notiz */}
          <Field label="Notiz">
            <input className="form-input" value={form.note}
              onChange={e => set('note', e.target.value)} placeholder="Optionale Bemerkung…" />
          </Field>

          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Speichern…' : item?.id ? 'Speichern' : 'Einlagern'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
