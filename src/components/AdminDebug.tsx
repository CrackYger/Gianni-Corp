import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Status = {
  url?: string
  userId?: string
  email?: string | null
  inAdminTable?: boolean
  totalRequests?: number | null
  error?: string | null
}

export default function AdminDebug(){
  const [s, setS] = useState<Status>({})
  useEffect(()=>{
    (async ()=>{
      const url = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined
      const { data: gu } = await supabase.auth.getUser()
      const user = gu?.user ?? null
      const userId = user?.id
      let inAdminTable = false
      let totalRequests: number | null = null
      let error: string | null = null
      try {
        if (userId){
          const { data: adminRow, error: e1 } = await supabase
            .from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
          if (!e1 && adminRow?.user_id) inAdminTable = true
        }
        {
          const { data, error: e2 } = await supabase.from('requests').select('id')
          if (e2) { error = e2.message }
          totalRequests = Array.isArray(data) ? data.length : null
        }
      } catch(e: any){
        error = e?.message ?? 'unknown error'
      }
      setS({ url, userId: user?.id, email: user?.email ?? null, inAdminTable, totalRequests, error })
    })()
  },[])

  return (
    <div className="rounded-xl border border-amber-600/40 bg-amber-900/20 p-3 text-sm">
      <div className="font-semibold mb-1">Admin-Diagnose</div>
      <div>Supabase URL: <code>{s.url || '—'}</code></div>
      <div>User: <code>{s.userId || '—'}</code> • {s.email || '—'}</div>
      <div>In <code>admin_users</code>: <b>{s.inAdminTable ? 'JA' : 'NEIN'}</b></div>
      <div>Requests (sichtbar): <b>{s.totalRequests ?? '—'}</b></div>
      {s.error && <div className="text-rose-400">Error: {s.error}</div>}
      {!s.error && s.inAdminTable && (s.totalRequests===0) && (
        <div className="text-amber-300 mt-1">Hinweis: 0 Zeilen ≠ Fehler. Prüfe RLS-Policy „admin can read requests“.</div>
      )}
    </div>
  )
}
