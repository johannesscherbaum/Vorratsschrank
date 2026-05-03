import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { fetchItems, insertItem, updateItem, deleteItem, subscribeToChanges, isLocalMode } from './lib/db.js'
import { foodGroupStore, locationStore } from './lib/adminDb.js'
const ItemModal  = lazy(() => import('./components/ItemModal.jsx'))
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'))
const LoginPage  = lazy(() => import('./components/LoginPage.jsx'))
import { useAuth } from './components/AuthProvider.jsx'
import { signOut } from './lib/auth.js'

function daysUntil(d) {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}
function expiryStatus(item) {
  const d = daysUntil(item.expires_at)
  if (d === null) return 'ok'
  if (d < 0)      return 'expired'
  if (d <= 7)     return 'soon'
  return 'ok'
}
function fmt(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}.${m}.${y}`
}

// Build lookup maps from stammdaten – reactive via useState
function useIconMaps() {
  const [groupIcons, setGroupIcons] = React.useState(() => {
    const map = {}
    foodGroupStore.getAll().forEach(g => { if (g.icon) map[g.name] = g.icon })
    return map
  })
  const [locIcons, setLocIcons] = React.useState(() => {
    const map = {}
    locationStore.getAll().forEach(l => { if (l.icon) map[l.name] = l.icon })
    return map
  })
  React.useEffect(() => {
    const u1 = foodGroupStore.subscribe(() => {
      const map = {}
      foodGroupStore.getAll().forEach(g => { if (g.icon) map[g.name] = g.icon })
      setGroupIcons(map)
    })
    const u2 = locationStore.subscribe(() => {
      const map = {}
      locationStore.getAll().forEach(l => { if (l.icon) map[l.name] = l.icon })
      setLocIcons(map)
    })
    return () => { u1(); u2() }
  }, [])
  return { groupIcons, locIcons }
}

const SORT_OPTIONS = [
  { value:'stored_desc', label:'Eingelagert ↓' },
  { value:'stored_asc',  label:'Eingelagert ↑' },
  { value:'expiry',      label:'Ablauf bald'   },
  { value:'name',        label:'Name A–Z'      },
  { value:'location',    label:'Standort'      },
]

export default function App() {
  const { session, loading: authLoading } = useAuth()

  if (authLoading) return <div className="loading" style={{ paddingTop:80 }}>Lade…</div>

  if (!isLocalMode && !session) {
    return (
      <Suspense fallback={<div className="loading" style={{ paddingTop:80 }}>Lade…</div>}>
        <LoginPage />
      </Suspense>
    )
  }

  return <AppInner session={session} />
}

function ChangePasswordForm({ onDone }) {
  const [pw,      setPw]      = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error,   setError]   = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (pw.length < 8)  { setError('Mindestens 8 Zeichen.'); return }
    if (pw !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    setLoading(true)
    const { updatePassword } = await import('./lib/auth.js')
    const { error } = await updatePassword(pw)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(onDone, 1500)
  }

  return (
    <div className="card">
      {success
        ? <p style={{ color:'var(--green)', fontWeight:500 }}>✓ Passwort erfolgreich geändert.</p>
        : <form onSubmit={submit}>
            {error && <div className="auth-error" style={{ marginBottom:16 }}>{error}</div>}
            <div className="form-field">
              <label className="form-label">Neues Passwort</label>
              <input className="form-input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Mindestens 8 Zeichen" autoComplete="new-password" />
            </div>
            <div className="form-field">
              <label className="form-label">Passwort bestätigen</label>
              <input className="form-input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Wiederholen" autoComplete="new-password" />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
              <button type="button" className="btn btn-ghost" onClick={onDone}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Speichern…':'Passwort speichern'}</button>
            </div>
          </form>
      }
    </div>
  )
}

function AppInner({ session }) {
  const { groupIcons, locIcons } = useIconMaps()
  const [view,      setView]      = useState('vorrat')
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [sort,      setSort]      = useState('expiry')
  const [locFilter, setLocFilter] = useState('all')
  const [modal,     setModal]     = useState(false)
  const [editItem,  setEditItem]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchItems()
    if (error) setError(error.message || String(error))
    else setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribeToChanges(load), [load])

  const save = async (form) => {
    let err
    if (editItem?.id) ({ error: err } = await updateItem(form, editItem.id))
    else              ({ error: err } = await insertItem(form))
    if (err) { alert('Fehler: ' + (err.message || err)); return }
    await load(); setModal(false); setEditItem(null)
  }

  const remove = async (id) => {
    if (!window.confirm('Artikel wirklich entfernen?')) return
    await deleteItem(id); await load()
  }

  const openAdd  = () => { setEditItem(null); setModal(true) }
  const openEdit = (item) => { setEditItem(item); setModal(true) }

  const locations = ['all', ...new Set(items.map(i => i.location).filter(Boolean))].sort((a,b) => a==='all'?-1:a.localeCompare(b))

  const filtered = items
    .filter(i => locFilter==='all' || i.location===locFilter)
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return [i.name,i.location,i.category,i.note,i.ean].some(f=>f?.toLowerCase().includes(q))
    })
    .sort((a,b) => {
      if (sort==='name')       return a.name.localeCompare(b.name)
      if (sort==='location')   return a.location.localeCompare(b.location)
      if (sort==='expiry')     return (daysUntil(a.expires_at)??99999)-(daysUntil(b.expires_at)??99999)
      if (sort==='stored_asc') return (a.stored_at||'').localeCompare(b.stored_at||'')
      return (b.stored_at||'').localeCompare(a.stored_at||'')
    })

  const stats = {
    total:   items.length,
    locs:    new Set(items.map(i=>i.location)).size,
    soon:    items.filter(i=>expiryStatus(i)==='soon').length,
    expired: items.filter(i=>expiryStatus(i)==='expired').length,
  }

  return (
    <div className="app-shell">
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="logo">
            <div className="logo-icon">🥫</div>
            <span>Vorratsverwaltung</span>
            {isLocalMode && <span className="local-badge">Lokal</span>}
          </div>

          <div className="topbar-nav">
            <button className={`nav-tab ${view==='vorrat'?'active':''}`} onClick={() => setView('vorrat')}>
              Vorrat
            </button>
            <button className={`nav-tab ${view==='admin'?'active':''}`} onClick={() => setView('admin')}>
              Stammdaten
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="btn btn-primary" onClick={openAdd}>
              + Artikel
            </button>
            {session && (
              <div className="user-menu">
                <div className="user-avatar" title={session.user.email}>
                  {session.user.email[0].toUpperCase()}
                </div>
                <div className="user-dropdown">
                  <div className="user-email">{session.user.email}</div>
                  <hr className="user-divider" />
                  <button className="user-action" onClick={() => { setView('profile') }}>
                    🔑 Passwort ändern
                  </button>
                  <button className="user-action danger" onClick={async () => { await signOut() }}>
                    ↩ Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page ── */}
      <div className="page">

        {/* ── PROFILE / change password ── */}
        {view === 'profile' && (
          <div style={{ maxWidth:480 }}>
            <div className="page-header">
              <h1 className="page-title">Passwort ändern</h1>
              <p className="page-sub">Wähle ein neues, sicheres Passwort für dein Konto.</p>
            </div>
            <ChangePasswordForm onDone={() => setView('vorrat')} />
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === 'admin' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Stammdaten</h1>
              <p className="page-sub">Lagerorte, Lebensmittel, Einheiten und Benutzer pflegen</p>
            </div>
            <div className="admin-card" style={{ padding:24 }}>
              <Suspense fallback={<div className="loading">Lade…</div>}>
                <AdminPanel />
              </Suspense>
            </div>
          </>
        )}

        {/* ── VORRAT ── */}
        {view === 'vorrat' && (
          <>
            {/* Alert */}
            {(stats.soon > 0 || stats.expired > 0) && (
              <div className="alert alert-amber">
                <span style={{ fontSize:18 }}>⚠️</span>
                <span>
                  {[stats.expired>0&&`${stats.expired} Artikel abgelaufen`, stats.soon>0&&`${stats.soon} bald ablaufend`].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Artikel gesamt</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.locs}</div>
                <div className="stat-label">Standorte</div>
              </div>
              <div className="stat-card">
                <div className={`stat-value ${stats.soon>0?'warn':''}`}>{stats.soon}</div>
                <div className="stat-label">Bald ablaufend</div>
              </div>
              <div className="stat-card">
                <div className={`stat-value ${stats.expired>0?'danger':''}`}>{stats.expired}</div>
                <div className="stat-label">Abgelaufen</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="form-input" type="text" placeholder="Suchen…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-select" style={{ width:'auto' }}
                value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Location chips */}
            <div className="chips">
              {locations.map(l => (
                <button key={l} className={`chip ${locFilter===l?'active':''}`}
                  onClick={() => setLocFilter(l)}>
                  {l==='all' ? 'Alle Standorte' : l}
                </button>
              ))}
            </div>

            {error   && <div className="error-msg">{error}</div>}
            {loading && <div className="loading">Lade Vorräte…</div>}
            {!loading && !filtered.length && (
              <div className="empty-state">
                <div className="empty-icon">🥫</div>
                <p>Keine Artikel gefunden</p>
                <small>Filter anpassen oder neuen Artikel einlagern</small>
              </div>
            )}

            {/* Items */}
            <div className="items-grid">
              {filtered.map(item => {
                const st = expiryStatus(item)
                const d  = daysUntil(item.expires_at)
                return (
                  <div key={item.id} className={`item-card ${st!=='ok'?st:''}`} onClick={() => openEdit(item)}>

                    {/* Food icon – large, top of card */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ fontSize:40, lineHeight:1 }}>
                        {item.food_group ? (groupIcons[item.food_group] || '📦') : '📦'}
                      </div>
                      <div className="item-actions" style={{ opacity:1 }}>
                        <button className="btn btn-icon" onClick={e=>{e.stopPropagation();openEdit(item)}}>✎</button>
                        <button className="btn btn-icon" onClick={e=>{e.stopPropagation();remove(item.id)}}
                          style={{ color:'var(--text-muted)' }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>✕</button>
                      </div>
                    </div>

                    <div className="item-header" style={{ marginBottom:8 }}>
                      <span className="item-name">{item.name}</span>
                    </div>

                    <div className="item-badges">
                      <span className="badge badge-blue">
                        {locIcons[item.location] && <span style={{marginRight:3}}>{locIcons[item.location]}</span>}
                        {item.location}
                      </span>
                      {item.category && <span className="badge badge-gray">{item.category}</span>}
                      {st==='expired' && <span className="badge badge-red">Abgelaufen</span>}
                      {st==='soon'    && <span className="badge badge-amber">Noch {d} Tag{d!==1?'e':''}</span>}
                    </div>

                    <div className="item-meta">
                      {item.qty ? `${item.qty} ${item.unit}` : ''}
                      {item.note ? (item.qty?' · ':'')+item.note : ''}
                    </div>
                    <div className="item-dates">
                      {item.stored_at  ? `Eingelagert: ${fmt(item.stored_at)}`  : ''}
                      {item.expires_at ? ` · MHD: ${fmt(item.expires_at)}` : ''}
                    </div>
                    {item.ean && <div className="item-ean">EAN {item.ean}</div>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {modal && (
        <Suspense fallback={null}>
          <ItemModal item={editItem} onSave={save} onClose={() => { setModal(false); setEditItem(null) }} />
        </Suspense>
      )}
    </div>
  )
}
