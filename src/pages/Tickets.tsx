import { useEffect, useState } from 'react'
import Page from '@/components/Page'
import { supabase, supaReady, getUser } from '@/libs/supabase'

type UUID = string; type ISO = string
type Ticket = { id: UUID; subject: string; status: 'open'|'closed'|string; created_at: ISO; updated_at: ISO; user_id?: UUID | null }
type TicketMessage = { id: UUID; ticket_id: UUID; sender: 'user'|'admin'|string; body: string; created_at: ISO }

export default function TicketsPage(){
  const [ready] = useState(supaReady())
  const [user, setUser] = useState<any>(null)
  const [list, setList] = useState<Ticket[]>([])
  const [active, setActive] = useState<Ticket | null>(null)
  const [msgs, setMsgs] = useState<TicketMessage[]>([])
  const [text, setText] = useState('')

  useEffect(()=>{
    let unsub: any
    ;(async ()=>{
      if (!ready) return
      const u = await getUser(); setUser(u)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s)=> setUser(s?.user ?? null))
      unsub = () => subscription?.unsubscribe()
    })()
    return ()=>{ try{ unsub && unsub() }catch{} }
  }, [ready])

  useEffect(()=>{ if (user){ void load(); subscribe() } }, [user])

  async function load(){
    const { data } = await supabase.from('tickets').select('*').order('updated_at', { ascending: false })
    setList((data ?? []) as Ticket[])
  }
  async function open(t: Ticket){
    setActive(t)
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at', { ascending: true })
    setMsgs((data ?? []) as TicketMessage[])
  }
  function subscribe(){
    try{
      const ch = supabase.channel('admin-tickets-ui')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, ()=> load())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (p)=>{
          if (active && (p.new as any).ticket_id === active.id) open(active)
        })
        .subscribe()
      return () => { try{ supabase.removeChannel(ch) }catch{} }
    }catch{}
    return () => {}
  }
  async function send(){
    if (!active || !text.trim()) return
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: active.id, sender: 'admin', body: text.trim() })
    if (!error){ setText(''); await open(active) }
  }

  return (
    <Page title="Tickets">
      {!ready && <div className="card">Bitte Supabase-ENV in <code>.env</code> setzen.</div>}
      {ready && !user && <div className="card">Bitte auf der <a className="underline" href="/anfragen">Anfragen</a>-Seite einloggen.</div>}
      {ready && user && (
        <div className="grid md:grid-cols-[360px_1fr] gap-4">
          <section className="card">
            <div className="text-xs uppercase tracking-wide text-gc-muted mb-2">Tickets</div>
            <ul className="divide-y divide-white/10 max-h-[65svh] overflow-auto">
              {list.map(t => (
                <li key={t.id} onClick={()=>open(t)} className={"p-3 cursor-pointer hover:bg-white/5 " + (active?.id===t.id? 'bg-white/5':'')}>
                  <div className="text-sm font-medium">{t.subject}</div>
                  <div className="text-xs text-gc-muted">{new Date(t.updated_at).toLocaleString('de-DE')} • {t.status}</div>
                </li>
              ))}
              {!list.length && <li className="p-3 text-sm text-gc-muted">Keine Tickets.</li>}
            </ul>
          </section>
          <section className="card">
            {!active && <div className="text-gc-muted">Wähle links ein Ticket.</div>}
            {active && (
              <div className="space-y-3">
                <div className="text-lg font-semibold">{active.subject}</div>
                <div className="space-y-2 max-h-[50svh] overflow-auto pr-1">
                  {msgs.map(m => (
                    <div key={m.id} className={"p-2 rounded border " + (m.sender==='admin'? 'border-emerald-500/30 bg-emerald-500/10':'border-white/10 bg-white/5')}>
                      <div className="text-xs text-gc-muted">{new Date(m.created_at).toLocaleString('de-DE')}</div>
                      <div className="text-sm">{m.body}</div>
                    </div>
                  ))}
                  {!msgs.length && <div className="text-sm text-gc-muted">Noch keine Nachrichten.</div>}
                </div>
                <div className="flex gap-2 pt-2">
                  <input value={text} onChange={e=>setText(e.target.value)} placeholder="Antwort schreiben…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" />
                  <button onClick={send} className="btn bg-[var(--accent)]/80 hover:bg-[var(--accent)]">Senden</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </Page>
  )
}
