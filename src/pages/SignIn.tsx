import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function SignIn(){
  const { requestCode, verifyCode, error } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  async function send(){ const r = await requestCode(email); if (r.ok) setSent(true) }
  async function check(){ await verifyCode(email, code) }
  return (
    <main className="min-h-[80svh] grid place-items-center">
      <div className="w-[360px] max-w-[92vw] space-y-3 rounded-2xl border border-slate-800 p-5 bg-slate-950/60">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="text-sm text-slate-400">Gib deine E‑Mail ein. Du erhältst einen 6‑stelligen Code.</p>
        <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        {!sent ? (
          <button onClick={send} className="w-full px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500">Code senden</button>
        ) : (
          <div className="space-y-2">
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 tracking-widest text-center" placeholder="123456" value={code} onChange={e=>setCode(e.target.value)} />
            <button onClick={check} className="w-full px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">Einloggen</button>
          </div>
        )}
        {error && <div className="text-rose-400 text-sm">{error}</div>}
      </div>
    </main>
  )
}
