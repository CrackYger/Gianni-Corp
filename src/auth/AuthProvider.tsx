import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Ctx = {
  user: User | null
  loading: boolean
  error?: string | null
  requestCode: (email: string) => Promise<{ ok: boolean; error?: string }>
  verifyCode: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Ctx>({
  user: null, loading: true, error: null,
  async requestCode(){ return { ok: false, error: 'not-initialized' } },
  async verifyCode(){ return { ok: false, error: 'not-initialized' } },
  async signOut(){}
})

export function AuthProvider({ children }:{ children: React.ReactNode }){
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) setUser(session?.user ?? null)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s)=>{
          setUser(s?.user ?? null)
        })
        if (mounted) setLoading(false)
        return () => { try{ subscription?.unsubscribe() }catch{} }
      } catch {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function requestCode(email: string){
    setError(null)
    try {
      const emailRedirectTo = window.location.origin + window.location.pathname
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
      if (error) { setError(error.message); return { ok: false, error: error.message } }
      return { ok: true }
    } catch (e: any) {
      setError(e?.message ?? 'signIn failed'); return { ok: false, error: e?.message ?? 'signIn failed' }
    }
  }

  async function verifyCode(email: string, token: string){
    setError(null)
    try {
      const cleaned = (token || '').replace(/\s+/g, '')
      const types: any[] = ['email','magiclink','signup']
      let lastErr: string | null = null
      for (const t of types){
        const { error } = await supabase.auth.verifyOtp({ email, token: cleaned, type: t as any })
        if (!error) return { ok: true }
        lastErr = error.message
      }
      setError(lastErr ?? 'verify failed')
      return { ok: false, error: lastErr ?? 'verify failed' }
    } catch (e: any) {
      setError(e?.message ?? 'verify failed'); return { ok: false, error: e?.message ?? 'verify failed' }
    }
  }

  async function signOut(){ try{ await supabase.auth.signOut() }catch{} setUser(null) }

  const value = useMemo<Ctx>(() => ({ user, loading, error, requestCode, verifyCode, signOut }), [user, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){ return useContext(AuthContext) }
