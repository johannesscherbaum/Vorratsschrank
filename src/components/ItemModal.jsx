import React, { useState, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner.jsx'
import { lookupEAN }  from '../lib/eanLookup.js'
import { locationStore, foodStore, unitStore, CATEGORIES } from '../lib/adminDb.js'

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
  const [locations, setLocations] = useState(() => locationStore.getAll())
  const [foods,     setFoods]     = useState(() => foodStore.getAll())
  const [units,     setUnits]     = useState(() => unitStore.getAll())

  useEffect(() => {
    const u1 = locationStore.subscribe(() => setLocations(locationStore.getAll()))
    const u2 = foodStore.subscribe(()     => setFoods(foodStore.getAll()))
    const u3 = unitStore.subscribe(()     => setUnits(unitStore.getAll()))
    return () => { u1(); u2(); u3() }
  }, [])

  const unitNames = units.map(u => u.name)

  const [form, setForm] = useState({
    name:'', qty:'', unit:'', location:'',
    stored_at:today(), expires_at:'', category:'', note:'', ean:'',
  })
  const [scanning, setScanning]         = useState(false)
  const [looking,  setLooking]          = useState(false)
  const [scanMsg,  setScanMsg]          = useState('')
  const [saving,   setSaving]           = useState(false)
  const [errors,   setErrors]           = useState({})
  const [foodQ,    setFoodQ]            = useState('')
  const [showSug,  setShowSug]          = useState(false)

  useEffect(() => {
    if (item) {
      setForm({ name:item.name||'', qty:item.qty??'', unit:item.unit||'',
        location:item.location||'', stored_at:item.stored_at||today(),
        expires_at:item.expires_at||'', category:item.category||'', note:item.note||'', ean:item.ean||'' })
      setFoodQ(item.name || '')
    }
  }, [item]) // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const suggestions = foodQ.length >= 1
    ? foods.filter(f => f.name.toLowerCase().includes(foodQ.toLowerCase())).slice(0, 8)
    : []

  const pickFood = (food) => {
    setForm(f => ({ ...f, name:food.name, category:food.category||f.category, unit:food.default_unit||f.unit||'' }))
    setFoodQ(food.name); setShowSug(false)
  }

  const handleEAN = async (ean) => {
    setScanning(false); setLooking(true); setScanMsg(''); set('ean', ean)
    const p = await lookupEAN(ean)
    setLooking(false)
    if (!p?.name) { setScanMsg(`EAN ${ean} – kein Produkt gefunden.`); return }
    setForm(f => ({ ...f, ean, name:p.name||f.name, category:p.category||f.category,
      qty:p.qty!==''?p.qty:f.qty, unit:p.unit||f.unit }))
    setFoodQ(p.name || '')
    setScanMsg(`✓ „${p.name}" gefunden`)
  }

  const submit = async () => {
    const e = {}
    if (!form.name.trim()) e.name     = 'Name erforderlich'
    if (!form.location)    e.location = 'Standort erforderlich'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    await onSave({ ...form, qty: form.qty !== '' ? Number(form.qty) : null })
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

          {/* Name + autocomplete */}
          <Field label="Name *" error={errors.name}>
            <div className="autocomplete">
              <input className="form-input" value={foodQ} autoComplete="off"
                placeholder="Tippen oder aus Liste wählen…"
                onChange={e => { setFoodQ(e.target.value); set('name', e.target.value); setShowSug(true) }}
                onFocus={() => setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)} />
              {showSug && suggestions.length > 0 && (
                <div className="autocomplete-list">
                  {suggestions.map(f => (
                    <div key={f.id} className="autocomplete-item" onMouseDown={() => pickFood(f)}>
                      <span className="name">{f.name}</span>
                      <span className="cat">{f.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

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

          <Field label="Standort *" error={errors.location}>
            <select className="form-select" value={form.location} onChange={e => set('location', e.target.value)}>
              <option value="">Bitte wählen…</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.icon ? l.icon+' ' : ''}{l.name}</option>)}
            </select>
          </Field>

          <div className="form-grid-2">
            <Field label="Eingelagert am">
              <input className="form-input" type="date" value={form.stored_at} onChange={e => set('stored_at', e.target.value)} />
            </Field>
            <Field label="MHD">
              <input className="form-input" type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
            </Field>
          </div>

          <Field label="Kategorie">
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">–</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Notiz">
            <input className="form-input" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Optionale Bemerkung…" />
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
