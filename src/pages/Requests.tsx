import { useEffect, useMemo, useState } from 'react'
import Page from '@/components/Page'
import { supabase, supaReady, getUser } from '@/libs/supabase'

type UUID = string; type ISO = string

type Request = {
  id: UUID; user_id: UUID; user_email?: string | null;
  title: string; details?: string | null;
  status: 'New'|'UnderReview'|'Approved'|'Rejected'|'Closed'|string;
  created_at: ISO; updated_at: ISO;
}
type RequestEvent = { id: UUID; request_id: UUID; type: string; message?: string | null; by_admin: boolean; created_at: ISO }
type RequestFile  = { id: UUID; request_id: UUID; user_id: UUID; path: string; mime?: string | null; size?: number | null; created_at: ISO }

export default function RequestsPage(){
  const [ready, setReady] = useState(supaReady())
  const [user, setUser] = useState<any>(null)
  const [list, setList] = useState<Request[]>([])
  const [active, setActive] = useState<Request | null>(null)
  const [events, setEvents] = useState<RequestEvent[]>([])
  const [files, setFiles] = useState<RequestFile[]>([])
  const [reply, setReply] = useState('')
  const [tab, setTab] = useState<'open'|'closed'|'all'>('open')

  useEffect(()=>{
    let unsub: any
    ;(async ()=>{
      if (!ready) return
      const u = await getUser()
      setUser(u)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s)=>{ setUser(s?.user ?? null) })
      unsub = () => subscription?.unsubscribe()
    })()
    return ()=>{ try{ unsub && unsub() }catch{} }
  }, [ready])

  useEffect(()=>{ if (user) { void load(); subscribe() } }, [user, tab])

  async function load(){
    if (!user) return
    let q = supabase.from('requests').select('*').order('updated_at', { ascending: false })
    if (tab==='open') q = q.in('status', ['New','UnderReview'])
    if (tab==='closed') q = q.in('status', ['Approved','Rejected','Closed'])
    const { data, error } = await q
    if (error) { console.error(error); return }
    setList((data??[]) as Request[])
  }

  async function loadDetails(req: Request | null){
    setActive(req)
    if (!req) { setEvents([]); setFiles([]); return }
    const [{ data: ev }, { data: f }] = await Promise.all([
      supabase.from('request_events').select('*').eq('request_id', req.id).order('created_at', { ascending: true }),
      supabase.from('request_files').select('*').eq('request_id', req.id).order('created_at', { ascending: true }),
    ])
    setEvents((ev ?? []) as RequestEvent[])
    setFiles((f ?? []) as RequestFile[])
  }

  function subscribe(){
    try{
      const ch = supabase.channel('admin-requests-ui')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, ()=> load())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_events' }, (p)=>{
          if (active && (p.new as any).request_id === active.id) loadDetails(active)
        })
        .subscribe()
      return () => { try{ supabase.removeChannel(ch) }catch{} }
    }catch{}
    return () => {}
  }

  async function sendReply(){
    if (!active || !reply.trim()) return
    const { error } = await supabase.from('request_events')
      .insert({ request_id: active.id, type: 'AdminMessage', message: reply.trim(), by_admin: true })
    if (error){ console.error(error); return }
    setReply('')
    await loadDetails(active)
  }

  async function setStatus(s: string){
    if (!active) return
    const { error } = await supabase.from('requests').update({ status: s }).eq('id', active.id)
    if (error){ console.error(error); return }
    await load()
  }

  return (
    <Page title="Anfragen">
      {!ready && <EnvHint/>}
      {ready && !user && <LoginCard/>}

      {ready && user && (
        <div className="grid md:grid-cols-[360px_1fr] gap-4">
          <section className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wide text-gc-muted">Eingänge</div>
              <div className="inline-flex rounded-xl overflow-hidden border border-white/10">
                {(['open','all','closed'] as const).map(k=>(
                  <button key={k} onClick={()=>setTab(k)} className={`px-3 py-1 text-sm ${tab===k? 'bg-white/10':''}`}>{k}</button>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-white/10 max-h-[65svh] overflow-auto">
              {list.map(r => (
                <li key={r.id} onClick={()=>loadDetails(r)} className={"p-3 cursor-pointer hover:bg-white/5 " + (active?.id===r.id? 'bg-white/5':'')}>
                  <div className="text-sm font-medium">{r.title || 'Neue Anfrage'}</div>
                  <div className="text-xs text-gc-muted">{new Date(r.updated_at).toLocaleString('de-DE')} • {r.status}</div>
                </li>
              ))}
              {!list.length && <li className="p-3 text-sm text-gc-muted">Keine Anfragen.</li>}
            </ul>
          </section>

          <section className="card">
            {!active && <div className="text-gc-muted">Wähle links eine Anfrage.</div>}
            {active && (
              <div className="space-y-4">
                <header>
                  <div className="text-lg font-semibold">{active.title || 'Neue Anfrage'}</div>
                  <div className="text-xs text-gc-muted">{active.user_email ?? 'Unbekannt'}</div>
                </header>
                {active.details && <p className="whitespace-pre-wrap">{active.details}</p>}

                <div>
                  <div className="text-xs uppercase tracking-wide text-gc-muted mb-1">Verlauf</div>
                  <div className="space-y-2 max-h-[40svh] overflow-auto pr-1">
                    {events.map(ev => (
                      <div key={ev.id} className={"p-2 rounded border " + (ev.by_admin? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5')}>
                        <div className="text-xs text-gc-muted">{new Date(ev.created_at).toLocaleString('de-DE')}</div>
                        <div className="text-sm">{ev.type}{ev.message? ': ' + ev.message : ''}</div>
                      </div>
                    ))}
                    {!events.length && <div className="text-sm text-gc-muted">Kein Verlauf.</div>}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gc-muted mb-1">Anhänge</div>
                  <ul className="space-y-2">
                    {files.map(f => <Attachment key={f.id} path={f.path}/>)}
                    {!files.length && <li className="text-sm text-gc-muted">Keine Dateien.</li>}
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Nachricht an Kunde…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" />
                  <button onClick={sendReply} className="btn bg-[var(--accent)]/80 hover:bg-[var(--accent)]">Senden</button>
                  <button onClick={()=> setStatus('Approved')} className="btn bg-emerald-600/80 hover:bg-emerald-600">Genehmigen</button>
                  <button onClick={()=> setStatus('Rejected')} className="btn bg-rose-600/80 hover:bg-rose-600">Ablehnen</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </Page>
  )
}

function EnvHint(){
  return <div className="card">Bitte setze <code>VITE_SUPABASE_URL</code> und <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>.</div>
}

function LoginCard(){
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')

  async function send(){
    const emailRedirectTo = window.location.origin + window.location.pathname
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
    if (!error) setSent(true)
  }
  async function verify(){
    const token = code.replace(/\s+/g, '')
    let last: string | null = null
    for (const type of ['email','magiclink','signup'] as const){
      const { error } = await supabase.auth.verifyOtp({ email, token, type })
      if (!error) { window.location.reload(); return }
      last = error?.message ?? last
    }
    alert(last ?? 'Code ungültig')
  }
  return (
    <div className="card max-w-md">
      <div className="text-lg font-semibold mb-2">Admin Login</div>
      <p className="text-sm text-gc-muted mb-2">E‑Mail eingeben → 6‑stelligen Code nutzen.</p>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-2" />
      {!sent ? (
        <button onClick={send} className="btn w-full bg-[var(--accent)]/80 hover:bg-[var(--accent)]">Code senden</button>
      ) : (
        <div className="space-y-2">
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" className="w-full text-center tracking-widest bg-white/5 border border-white/10 rounded-xl px-3 py-2" />
          <button onClick={verify} className="btn w-full bg-emerald-600/80 hover:bg-emerald-600">Einloggen</button>
        </div>
      )}
    </div>
  )
}

function Attachment({ path }:{ path: string }){
  const [url, setUrl] = useState<string | null>(null)
  useEffect(()=>{ (async ()=>{
    try{
      const { data } = await supabase.storage.from('gc_uploads').createSignedUrl(path, 3600)
      setUrl(data?.signedUrl ?? null)
    }catch{ setUrl(null) }
  })() }, [path])
  return <li className="text-sm"><a href={url ?? '#'} target="_blank" rel="noreferrer" className="underline">{path.split('/').pop()}</a></li>
}
