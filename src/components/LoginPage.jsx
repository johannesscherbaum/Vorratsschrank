import React, { useState, useEffect } from 'react'
import { signIn, signUp, resetPassword, updatePassword } from '../lib/auth.js'

/* Which view to show */
function detectView() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset') === '1') return 'new-password'
  return 'login'
}

function FormField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
    </div>
  )
}

/* ── Login ────────────────────────────────────────────── */
function LoginForm({ onSwitch }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <h2 className="auth-title">Anmelden</h2>
      <p className="auth-sub">Melde dich an, um auf deine Vorräte zuzugreifen.</p>

      {error && <div className="auth-error">{error}</div>}

      <FormField label="E-Mail" type="email" value={email} onChange={setEmail}
        placeholder="name@beispiel.de" autoComplete="email" />
      <FormField label="Passwort" type="password" value={password} onChange={setPassword}
        placeholder="Dein Passwort" autoComplete="current-password" />

      <div className="auth-forgot">
        <button type="button" className="auth-link" onClick={() => onSwitch('forgot')}>
          Passwort vergessen?
        </button>
      </div>

      <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
        {loading ? 'Anmelden…' : 'Anmelden'}
      </button>

      <p className="auth-switch">
        Noch kein Konto?{' '}
        <button type="button" className="auth-link" onClick={() => onSwitch('register')}>
          Jetzt registrieren
        </button>
      </p>
    </form>
  )
}

/* ── Register ─────────────────────────────────────────── */
function RegisterForm({ onSwitch }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) return (
    <div className="auth-form">
      <div className="auth-success-icon">✉️</div>
      <h2 className="auth-title">Fast geschafft!</h2>
      <p className="auth-sub">
        Wir haben eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet.
        Bitte klicke auf den Link darin, um dein Konto zu aktivieren.
      </p>
      <button className="btn btn-ghost auth-submit" onClick={() => onSwitch('login')}>
        Zurück zur Anmeldung
      </button>
    </div>
  )

  return (
    <form onSubmit={submit} className="auth-form">
      <h2 className="auth-title">Konto erstellen</h2>
      <p className="auth-sub">Erstelle ein Konto, um die Vorratsverwaltung zu nutzen.</p>

      {error && <div className="auth-error">{error}</div>}

      <FormField label="E-Mail" type="email" value={email} onChange={setEmail}
        placeholder="name@beispiel.de" autoComplete="email" />
      <FormField label="Passwort" type="password" value={password} onChange={setPassword}
        placeholder="Mindestens 8 Zeichen" autoComplete="new-password" />
      <FormField label="Passwort bestätigen" type="password" value={confirm} onChange={setConfirm}
        placeholder="Passwort wiederholen" autoComplete="new-password" />

      <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
        {loading ? 'Konto erstellen…' : 'Konto erstellen'}
      </button>

      <p className="auth-switch">
        Bereits registriert?{' '}
        <button type="button" className="auth-link" onClick={() => onSwitch('login')}>
          Anmelden
        </button>
      </p>
    </form>
  )
}

/* ── Forgot password ──────────────────────────────────── */
function ForgotForm({ onSwitch }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) return (
    <div className="auth-form">
      <div className="auth-success-icon">📬</div>
      <h2 className="auth-title">E-Mail gesendet</h2>
      <p className="auth-sub">
        Falls ein Konto mit <strong>{email}</strong> existiert, erhältst du in Kürze
        einen Link zum Zurücksetzen deines Passworts.
      </p>
      <button className="btn btn-ghost auth-submit" onClick={() => onSwitch('login')}>
        Zurück zur Anmeldung
      </button>
    </div>
  )

  return (
    <form onSubmit={submit} className="auth-form">
      <button type="button" className="auth-back" onClick={() => onSwitch('login')}>
        ← Zurück
      </button>
      <h2 className="auth-title">Passwort zurücksetzen</h2>
      <p className="auth-sub">
        Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <FormField label="E-Mail" type="email" value={email} onChange={setEmail}
        placeholder="name@beispiel.de" autoComplete="email" />

      <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
        {loading ? 'Senden…' : 'Link senden'}
      </button>
    </form>
  )
}

/* ── Set new password (after reset link) ─────────────── */
function NewPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
    // Clear the URL param
    window.history.replaceState({}, '', '/')
  }

  if (success) return (
    <div className="auth-form">
      <div className="auth-success-icon">✅</div>
      <h2 className="auth-title">Passwort geändert</h2>
      <p className="auth-sub">Dein Passwort wurde erfolgreich geändert. Du wirst automatisch angemeldet.</p>
    </div>
  )

  return (
    <form onSubmit={submit} className="auth-form">
      <h2 className="auth-title">Neues Passwort</h2>
      <p className="auth-sub">Wähle ein neues, sicheres Passwort für dein Konto.</p>

      {error && <div className="auth-error">{error}</div>}

      <FormField label="Neues Passwort" type="password" value={password} onChange={setPassword}
        placeholder="Mindestens 8 Zeichen" autoComplete="new-password" />
      <FormField label="Passwort bestätigen" type="password" value={confirm} onChange={setConfirm}
        placeholder="Passwort wiederholen" autoComplete="new-password" />

      <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
        {loading ? 'Speichern…' : 'Passwort speichern'}
      </button>
    </form>
  )
}

/* ── Main LoginPage ───────────────────────────────────── */
export default function LoginPage() {
  const [view, setView] = useState(detectView)

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon" style={{ width:40, height:40, fontSize:20, borderRadius:12 }}>🥫</div>
          <span className="auth-logo-text">Vorratsverwaltung</span>
        </div>

        {view === 'login'        && <LoginForm      onSwitch={setView} />}
        {view === 'register'     && <RegisterForm   onSwitch={setView} />}
        {view === 'forgot'       && <ForgotForm     onSwitch={setView} />}
        {view === 'new-password' && <NewPasswordForm />}
      </div>
    </div>
  )
}
