import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import Page from '@/components/Page';
import { Link } from 'react-router-dom';
import { db, Service, Subscription, Assignment, Person } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import ServiceForm from '@/components/forms/ServiceForm';
import SubscriptionForm from '@/components/forms/SubscriptionForm';
import AssignmentForm from '@/components/forms/AssignmentForm';

export default function Services(){
  // data
  const [services, setServices] = useState<Service[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [modal, setModal] = useState<ReactNode | null>(null);

  // premium ui state
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'inactive'>('all');
  const [billing, setBilling] = useState<'all'|'monthly'|'yearly'>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [view, setView] = useState<'cards'|'table'>('cards');
  const [panelOpen, setPanelOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  type Meta = { tags?: string[]; note?: string; expanded?: boolean; expandedNote?: boolean };
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const META_KEY = 'gc:abos:meta';
  const m = (id:string)=> meta[id] || {};
  function addTag(id:string, tag:string){
    setMeta(prev=>{
      const cur = prev[id] || {};
      const tags = Array.from(new Set([...(cur.tags||[]), tag.trim()] )).filter(Boolean);
      return {...prev, [id]: {...cur, tags}};
    });
  }
  function removeTag(id:string, tag:string){
    setMeta(prev=>{
      const cur = prev[id] || {};
      const tags = (cur.tags||[]).filter(t=> t!==tag);
      return {...prev, [id]: {...cur, tags}};
    });
  }
  function setNote(id:string, note:string){
    setMeta(prev=> ({...prev, [id]: {...(prev[id]||{}), note}}));
  }
  function toggleExpand(id:string){
    setMeta(prev=> ({...prev, [id]: {...(prev[id]||{}), expanded: !((prev[id]||{}).expanded) }}));
  }


  // extra ui state
  const [sortBy, setSortBy] = useState<'name'|'net'|'free'|'util'|'cost'|'revenue'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sel, setSel] = useState<Record<string, boolean>>({});

  // Persist UI
  const UI_KEY = 'gc:abos:ui';
  useEffect(()=>{
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (raw){
        const u = JSON.parse(raw);
        if (u.q!==undefined) setQ(u.q);
        if (u.status) setStatus(u.status);
        if (u.billing) setBilling(u.billing);
        if (u.freeOnly!==undefined) setFreeOnly(u.freeOnly);
        if (u.view) setView(u.view);
        if (u.sortBy) setSortBy(u.sortBy);
        if (u.sortDir) setSortDir(u.sortDir);
        if (u.pageSize) setPageSize(u.pageSize);
      }
    } catch {}
  }, []);
  useEffect(()=>{
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({ q, status, billing, freeOnly, view, sortBy, sortDir, pageSize }));
    } catch {}
  }, [q, status, billing, freeOnly, view, sortBy, sortDir, pageSize]);
  useEffect(()=>{
    try { const raw = localStorage.getItem(META_KEY); if (raw) setMeta(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(()=>{
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
  }, [meta]);


  useEffect(()=>{ (async()=>{
    await ensureSeed();
    await reloadAll();
  })(); },[]);

  async function reloadAll(){
    setServices(await db.services.toArray());
    setSubs(await db.subscriptions.toArray());
    setAssigns(await db.assignments.toArray());
    setPeople(await db.people.toArray());
  }

  // helpers
  const totalSlots = (serviceId:string) =>
    subs.filter(s=> s.serviceId===serviceId && s.status==='active')
        .reduce((a,s)=> a + (s.currentSlots||0), 0);

  const usedSlots = (serviceId:string) =>
    assigns.filter(a=> {
      const sub = subs.find(s=> s.id===a.subscriptionId);
      return !!sub && sub.serviceId===serviceId && a.status==='active';
    }).length;

  const freeSlots = (serviceId:string) => Math.max(0, totalSlots(serviceId) - usedSlots(serviceId));

  const monthlyCost = (serviceId:string) => {
    const svc = services.find(s=> s.id===serviceId);
    const activeSubCount = subs.filter(s=> s.serviceId===serviceId && s.status==='active').length;
    return (svc?.baseCostPerMonth ?? 0) * activeSubCount;
  };

  const monthlyRevenue = (serviceId:string) =>
    assigns.filter(a=> {
      const sub = subs.find(s=> s.id===a.subscriptionId);
      return !!sub && sub.serviceId===serviceId && a.status==='active';
    }).reduce((sum,a)=> sum + (a.pricePerMonth||0), 0);

  const monthlyNet = (serviceId:string) => +(monthlyRevenue(serviceId) - monthlyCost(serviceId)).toFixed(2);

  // filtered view
  const filtered = useMemo(()=>{
    const qx = q.trim().toLowerCase();
    return services.filter(s=>{
      if (status!=='all' && (status==='active') !== !!s.active) return false;
      if (billing!=='all' && s.billingCycle!==billing) return false;
      if (qx && !(`${s.name} ${s.plan??''}`.toLowerCase().includes(qx))) return false;
      if (freeOnly && freeSlots(s.id)<=0) return false;
      if (tagFilter && !(m(s.id).tags||[]).some(t=> t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
      return true;
    }).sort((a,b)=> a.name.localeCompare(b.name));
  }, [services, subs, assigns, q, status, billing, freeOnly, tagFilter]);

  // metrics per service
  function metrics(serviceId: string){
    const slots = totalSlots(serviceId);
    const used = usedSlots(serviceId);
    const free = Math.max(0, slots - used);
    const cost = monthlyCost(serviceId);
    const revenue = monthlyRevenue(serviceId);
    const net = +(revenue - cost).toFixed(2);
    const util = slots>0 ? Math.round((used/slots)*100) : 0;
    return { slots, used, free, cost, revenue, net, util };
  }

  const enriched = useMemo(()=> filtered.map(s=>({ s, ...metrics(s.id) })), [filtered, services, subs, assigns]);

  const sorted = useMemo(()=>{
    const arr = [...enriched];
    const k = sortBy;
    arr.sort((a,b)=>{
      const av = k==='name' ? a.s.name : (k==='net'? a.net : k==='free'? a.free : k==='util'? a.util : k==='cost'? a.cost : a.revenue);
      const bv = k==='name' ? b.s.name : (k==='net'? b.net : k==='free'? b.free : k==='util'? b.util : k==='cost'? b.cost : b.revenue);
      if (typeof av === 'string') return (sortDir==='asc'? 1 : -1) * av.localeCompare(String(bv));
      return sortDir==='asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return arr;
  }, [enriched, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(()=> sorted.slice((pageClamped-1)*pageSize, (pageClamped)*pageSize), [sorted, pageClamped, pageSize]);

  // export
  function exportCurrent(){
    const rows = filtered.map(s=>{
      const slots = totalSlots(s.id); const used = usedSlots(s.id);
      return {
        Service: s.name,
        Plan: s.plan ?? '',
        Zyklus: s.billingCycle,
        Aktiv: s.active? 'ja':'nein',
        'Slots gesamt': slots,
        'Slots vergeben': used,
        'Slots frei': Math.max(0, slots-used),
        '€/Monat': monthlyCost(s.id).toFixed(2),
        'Umsatz/Monat': monthlyRevenue(s.id).toFixed(2),
        'Netto/Monat': monthlyNet(s.id).toFixed(2),
      };
    });
    import('@/libs/io').then(m=> (m as any).exportCSV?.('abos', rows)).catch(()=>{ console.warn('exportCSV nicht verfügbar'); });
  }

  function exportJSONCurrent(){
    const payload = enriched.map(x=>{
      return {
        id: x.s.id,
        name: x.s.name,
        plan: x.s.plan,
        billing: x.s.billingCycle,
        active: x.s.active,
        metrics: { slots: x.slots, used: x.used, free: x.free, cost: x.cost, revenue: x.revenue, net: x.net, util: x.util },
        subscriptions: subs.filter(su=> su.serviceId===x.s.id).map(su=> ({
          ...su,
          assignments: assigns.filter(a=> a.subscriptionId===su.id)
        }))
      };
    });
    import('@/libs/io').then(m=> (m as any).downloadJSON?.('abos.json', { generatedAt: new Date().toISOString(), items: payload })).catch(()=>{});
  }

  // forms
  const openServiceForm = (service?: Service)=> setModal(<ServiceForm service={service} onClose={()=>{ setModal(null); reloadAll(); }} />);
  const openSubForm = (serviceId:string, sub?: Subscription)=> setModal(<SubscriptionForm serviceId={serviceId} sub={sub} onClose={()=>{ setModal(null); reloadAll(); }} />);
  const openAssignForm = (subscriptionId:string, a?: Assignment)=> setModal(<AssignmentForm subscriptionId={subscriptionId} a={a} onClose={()=>{ setModal(null); reloadAll(); }} />);

  // deletes
  async function deleteServiceCascade(serviceId:string){
    if(!confirm('Service inkl. zugehöriger Subscriptions & Assignments löschen?')) return;
    const subIds = subs.filter(s=>s.serviceId===serviceId).map(s=>s.id);
    const assignIds = assigns.filter(a=> subIds.includes(a.subscriptionId)).map(a=>a.id);
    await db.assignments.bulkDelete(assignIds);
    await db.subscriptions.bulkDelete(subIds);
    await db.services.delete(serviceId);
    await reloadAll();
  }

  async function deleteSubCascade(subId:string){
    if(!confirm('Subscription inkl. zugehöriger Assignments löschen?')) return;
    const assignIds = assigns.filter(a=> a.subscriptionId===subId).map(a=>a.id);
    await db.assignments.bulkDelete(assignIds);
    await db.subscriptions.delete(subId);
    await reloadAll();
  }

  async function deleteAssignment(id:string){
    if(!confirm('Zuweisung löschen?')) return;
    await db.assignments.delete(id);
    await reloadAll();
  }

  // small ui bits
  const SummaryKPI: React.FC = () => {
    const base = {slots:0, used:0, free:0, cost:0, revenue:0, net:0};
    for (const s of filtered){
      const slots = totalSlots(s.id); const used = usedSlots(s.id);
      const free = Math.max(0, slots - used);
      const cost = monthlyCost(s.id);
      const revenue = monthlyRevenue(s.id);
      const net = +(revenue - cost).toFixed(2);
      base.slots += slots;
      base.used += used;
      base.free += free;
      base.cost += cost;
      base.revenue += revenue;
      base.net += net;
    }
    const util = base.slots>0 ? Math.round((base.used/base.slots)*100) : 0;
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
        <div className="card"><div className="text-xs opacity-60">Services</div><div className="text-lg font-semibold">{filtered.length}</div></div>
        <div className="card"><div className="text-xs opacity-60">Slots</div><div className="text-lg font-semibold">{base.used}/{base.slots} <span className="chip ml-2">{base.free} frei</span></div></div>
        <div className="card"><div className="text-xs opacity-60">Auslastung</div><div className="text-lg font-semibold">{util}%</div></div>
        <div className="card"><div className="text-xs opacity-60">Kosten/Monat</div><div className="text-lg font-semibold">{base.cost.toFixed(2)} €</div></div>
        <div className="card"><div className="text-xs opacity-60">Umsatz/Monat</div><div className="text-lg font-semibold">{base.revenue.toFixed(2)} €</div></div>
        <div className="card"><div className="text-xs opacity-60">Netto/Monat</div><div className="text-lg font-semibold">{base.net.toFixed(2)} €</div></div>
      </div>
    );
  };

  const UtilBar: React.FC<{used:number; slots:number}> = ({used, slots}) => {
    const pct = slots>0 ? Math.round(used/slots*100) : 0;
    return (
      <div className="h-2 bg-white/10 rounded mt-2 overflow-hidden">
        <div className="h-full" style={{width: pct+'%', background: 'var(--gc-accent)'}}></div>
      </div>
    );
  };

  async function bulkToggleActive(active: boolean){
    const ids = Object.keys(sel).filter(id=> sel[id]);
    const target = ids.length? ids : filtered.map(s=> s.id);
    if (!target.length) return;
    await Promise.all(target.map(id=> db.services.update(id, { active })));
    await reloadAll();
    setSel({});
  }

  return (
    <Page title="Abos" actions={
      <div className="toolbar">
        <input className="input flex-1 md:w-80" placeholder="Suchen…" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="seg" role="tablist" aria-label="Ansicht">
          <button aria-pressed={view==='cards'} onClick={()=>setView('cards')}>Karten</button>
          <button aria-pressed={view==='table'} onClick={()=>setView('table')}>Tabelle</button>
        </div>
        <button className="btn" onClick={()=>setPanelOpen(v=>!v)}>{panelOpen? 'Filter & Sort ▲' : 'Filter & Sort ▼'}</button>
        <button className="btn btn-primary" onClick={()=>openServiceForm()}>Service anlegen</button>
      </div>
    }>

{panelOpen && (
  <div className="card mb-3">
    <div className="grid md:grid-cols-4 gap-2">
      <div>
        <div className="text-xs opacity-70 mb-1">Status</div>
        <select className="input w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
          <option value="all">alle</option>
          <option value="active">aktiv</option>
          <option value="inactive">inaktiv</option>
        </select>
      </div>
      <div>
        <div className="text-xs opacity-70 mb-1">Zyklus</div>
        <select className="input w-full" value={billing} onChange={e=>setBilling(e.target.value as any)}>
          <option value="all">alle</option>
          <option value="monthly">monatlich</option>
          <option value="yearly">jährlich</option>
        </select>
      </div>
      <div>
        <div className="text-xs opacity-70 mb-1">Tag-Filter</div>
        <input className="input w-full" placeholder="Tag…" value={tagFilter} onChange={e=>setTagFilter(e.target.value)} />
      </div>
      <div className="flex items-end gap-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={freeOnly} onChange={e=>setFreeOnly(e.target.checked)} />
          freie Slots
        </label>
      </div>
      <div>
        <div className="text-xs opacity-70 mb-1">Seiten-Größe</div>
        <select className="input w-full" value={pageSize} onChange={e=>{ setPageSize(+e.target.value); setPage(1); }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>

    <div className="mt-3 grid md:grid-cols-3 gap-2">
      <div className="flex items-center gap-2">
        <div className="text-xs opacity-70">Sortieren nach</div>
        <select className="input" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
          <option value="name">Name</option>
          <option value="net">Netto</option>
          <option value="free">Frei</option>
          <option value="util">Auslastung</option>
          <option value="cost">Kosten</option>
          <option value="revenue">Umsatz</option>
        </select>
        <div className="seg ml-2">
          <button aria-pressed={sortDir==='asc'} onClick={()=>setSortDir('asc')}>↑</button>
          <button aria-pressed={sortDir==='desc'} onClick={()=>setSortDir('desc')}>↓</button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={exportCurrent}>CSV</button>
        <button className="btn" onClick={exportJSONCurrent}>JSON</button>
        <button className="btn" onClick={()=>bulkToggleActive(true)}>Alle/Markierte aktiv</button>
        <button className="btn" onClick={()=>bulkToggleActive(false)}>Alle/Markierte inaktiv</button>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button className="btn" onClick={()=>setPage(Math.max(1, page-1))}>‹</button>
        <span className="text-sm">{page}/{totalPages}</span>
        <button className="btn" onClick={()=>setPage(Math.min(totalPages, page+1))}>›</button>
      </div>
    </div>
  </div>
)}

      <SummaryKPI/>

      {/* Cards view (mobile & default) */}
      <div className={`${view==='cards' ? 'grid' : 'hidden'} gap-3 md:grid-cols-2`}>
        {paged.length===0 && (
          <div className="empty"><div className="title">Noch keine Abos</div><div className="hint">Lege einen Service an oder ändere die Filter.</div></div>
        )}
        {paged.map(x=>{ const s=x.s; const { slots, used, free, net, util } = x;
          return (
            <div key={s.id} className="card">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!sel[s.id]} onChange={e=> setSel(v=>({...v, [s.id]: e.target.checked}))} />
                  <div className="font-semibold">{s.name}</div>
                </div>
                <div className="text-xs opacity-70"><button className="btn px-2 py-1" onClick={async()=>{ await db.services.update(s.id, {active: !s.active}); await reloadAll(); }}>{s.active? 'aktiv':'inaktiv'}</button></div>
              </div>
              <div className="mt-2 grid grid-cols-3 text-sm">
                <div><div className="opacity-60">Gesamt</div><div>{slots}</div></div>
                <div><div className="opacity-60">Belegt</div><div>{used}</div></div>
                <div><div className="opacity-60">Frei</div><div>{free}</div></div>
              </div>
              <div className="mt-2 text-sm opacity-80">
                Kosten/Monat: {monthlyCost(s.id).toFixed(2)} € <span className='chip ml-2'>Netto: {net.toFixed(2)} €</span>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {(m(s.id).tags||[]).map(tag=> (
                    <span key={tag} className="chip cursor-pointer" title="Nach Tag filtern" onClick={()=> setTagFilter(tag)}>
                      {tag} <button className="ml-1" onClick={(e)=>{ e.stopPropagation(); removeTag(s.id, tag); }}>×</button>
                    </span>
                  ))}
                  <input className="input w-24" placeholder="Tag +" onKeyDown={(e)=>{ if(e.key==='Enter'){ const el=e.currentTarget as HTMLInputElement; const t=el.value.trim(); if(t){ addTag(s.id, t); el.value=''; }}}} />
                  <button className="btn px-2 py-1" title="Notiz anzeigen/ändern" onClick={()=> setMeta(prev=> ({...prev, [s.id]: {...m(s.id), expandedNote: !m(s.id).expandedNote }}))}>📝</button>
                </div>
                {m(s.id).expandedNote && (
                  <div className="mt-2">
                    <textarea className="input w-full" rows={2} defaultValue={m(s.id).note||''} onBlur={(e)=> setNote(s.id, (e.target as HTMLTextAreaElement).value)} placeholder="Notiz…"/>
                  </div>
                )}

                <div className="h-2 bg-white/10 rounded mt-2 overflow-hidden"><div className="h-full" style={{width: (slots>0? Math.round(used/slots*100):0)+'%', background: 'var(--gc-accent)'}}></div></div>
              </div>

              {/* Subscriptions (kompakt: einklappbar) */}
              {m(s.id).expanded && (
              <div className="mt-3 space-y-2">
                {subs.filter(xx=>xx.serviceId===s.id).map(sub=>(
                  <div key={sub.id} className="bg-black/20 rounded p-2">
                    <div className="flex items-center justify-between">
                      <div>Sub • {sub.status} • Start {sub.startDate} • Slots {sub.currentSlots}</div>
                      <div className="flex gap-2">
                        <button className="btn px-2 py-1" onClick={()=>openSubForm(s.id, sub)}>Edit</button>
                        <button className="btn px-2 py-1 btn-primary" onClick={()=>openAssignForm(sub.id)}>Assign +</button>
                        <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteSubCascade(sub.id)}>Del</button>
                      </div>
                    </div>
                    {/* Assignments */}
                    <div className="mt-2 grid gap-2">
                      {assigns.filter(a=>a.subscriptionId===sub.id).map(a=>{
                        const person = people.find(p=>p.id===a.personId);
                        return (
                          <div key={a.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                            <div className="text-sm">
                              {person?.name ?? '—'} · {a.pricePerMonth?.toFixed(2) ?? '0.00'} €/Monat · Tag {a.billingDay} · {a.status}
                            </div>
                            <div className="flex gap-2">
                              <button className="btn px-2 py-1" onClick={()=>openAssignForm(sub.id, a)}>Edit</button>
                              <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteAssignment(a.id)}>Del</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}

              <div className="mt-3 flex gap-2">
                <button className="btn px-2 py-1" onClick={()=> toggleExpand(s.id)}>{m(s.id).expanded? "Zuklappen":"Aufklappen"}</button>
                <Link className="btn px-2 py-1" to={`/abos/${s.id}`}>Details</Link>
                <button className="btn px-2 py-1" onClick={()=>openServiceForm(s)}>Service bearbeiten</button>
                <button className="btn px-2 py-1 btn-primary" onClick={()=>openSubForm(s.id)}>Sub +</button>
                <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteServiceCascade(s.id)}>Del</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table view (desktop) */}
      <div className={`card p-0 overflow-hidden ${view==='table'? 'block':'hidden'}`}>
        <table className="w-full text-sm">
          <thead className="opacity-60"><tr>
            <th className="text-left p-2"><input type="checkbox" checked={paged.every(x=> sel[x.s.id]) && paged.length>0} onChange={e=>{ const on=e.target.checked; const next={...sel}; paged.forEach(x=> next[x.s.id]=on); setSel(next); }} /></th>
            <th className="text-left p-2">Service</th>
            <th className="text-left p-2">Plan</th>
            <th className="text-left p-2">Gesamt</th>
            <th className="text-left p-2">Belegt</th>
            <th className="text-left p-2">Frei</th>
            <th className="text-left p-2">Kosten/Monat</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Aktionen</th>
          </tr></thead>
          <tbody>
            {paged.map(x=>{ const s=x.s; const {slots, used, free, net, util} = x;
              return (
                <tr key={s.id} className="border-t border-white/10 align-top">
                  <td className="p-2"><input type="checkbox" className="mr-2" checked={!!sel[s.id]} onChange={e=> setSel(v=>({...v, [s.id]: e.target.checked}))} /></td>
                  <td className="p-2">{s.name}
                    {/* tags */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(m(s.id).tags||[]).map(tag=> (
                        <span key={tag} className="chip cursor-pointer" title="Nach Tag filtern" onClick={()=> setTagFilter(tag)}>{tag}</span>
                      ))}
                    </div>
    
                    {/* subs */}
                    <div className="mt-2 space-y-2">
                      {subs.filter(xx=>xx.serviceId===s.id).map(sub=>(
                        <div key={sub.id} className="bg-black/20 rounded p-2">
                          <div className="flex items-center justify-between">
                            <div>Sub • {sub.status} • Start {sub.startDate} • Slots {sub.currentSlots}</div>
                            <div className="flex gap-2">
                              <button className="btn px-2 py-1" onClick={()=>openSubForm(s.id, sub)}>Edit</button>
                              <button className="btn px-2 py-1 btn-primary" onClick={()=>openAssignForm(sub.id)}>Assign +</button>
                              <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteSubCascade(sub.id)}>Del</button>
                            </div>
                          </div>
                          <div className="mt-2 grid gap-2">
                            {assigns.filter(a=>a.subscriptionId===sub.id).map(a=>{
                              const person = people.find(p=>p.id===a.personId);
                              return (
                                <div key={a.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                                  <div className="text-sm">
                                    {person?.name ?? '—'} · {a.pricePerMonth?.toFixed(2) ?? '0.00'} €/Monat · Tag {a.billingDay} · {a.status}
                                  </div>
                                  <div className="flex gap-2">
                                    <button className="btn px-2 py-1" onClick={()=>openAssignForm(sub.id, a)}>Edit</button>
                                    <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteAssignment(a.id)}>Del</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 opacity-80">{s.plan ?? '-'}</td>
                  <td className="p-2">{slots}</td>
                  <td className="p-2">{used}</td>
                  <td className="p-2">{free}</td>
                  <td className="p-2">{monthlyCost(s.id).toFixed(2)} €</td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <button className="btn px-2 py-1" onClick={async()=>{ await db.services.update(s.id, {active: !s.active}); await reloadAll(); }}>{s.active? 'aktiv':'inaktiv'}</button>
                      <div className="text-xs opacity-60">Auslastung {util}%</div>
                      <div className="h-1 bg-white/10 rounded"><div className="h-1" style={{width: util+'%', background:'var(--gc-accent)'}}></div></div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Link className="btn px-2 py-1" to={`/abos/${s.id}`}>Details</Link>
                      <button className="btn px-2 py-1" onClick={()=>openServiceForm(s)}>Edit</button>
                      <button className="btn px-2 py-1 btn-primary" onClick={()=>openSubForm(s.id)}>Sub +</button>
                      <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteServiceCascade(s.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal}
    </Page>
  );
}
