import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSession, onAuthStateChange } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    getSession().then(({ session }) => setSession(session))
    const unsub = onAuthStateChange(setSession)
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
