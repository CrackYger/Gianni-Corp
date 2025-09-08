import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Page from '@/components/Page';
import { db, Service, Subscription, Assignment, Person } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import { exportCSV, downloadJSON } from '@/libs/io';
import SubscriptionForm from '@/components/forms/SubscriptionForm';
import AssignmentForm from '@/components/forms/AssignmentForm';
import ServiceForm from '@/components/forms/ServiceForm';

type RowAssign = Assignment & { person?: Person; sub?: Subscription };

function Euro(n:number){ return new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}).format(n||0); }

function nextDueDate(billingDay?: number, lastPaidAt?: string): string | undefined {
  const day = Math.max(1, Math.min(28, billingDay || 1));
  const now = new Date();
  // pick this month or next month
  let due = new Date(now.getFullYear(), now.getMonth(), day);
  if (due < now) { due = new Date(now.getFullYear(), now.getMonth()+1, day); }
  const iso = due.toISOString().slice(0,10);
  return iso;
}

export default function ServiceDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const [svc, setSvc] = useState<Service | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [modal, setModal] = useState<React.ReactNode|null>(null);

  async function reload(){
    if (!id) return;
    const [s, su, as, pe] = await Promise.all([
      db.services.get(id),
      db.subscriptions.where({serviceId: id}).toArray(),
      db.assignments.toArray(),
      db.people.toArray(),
    ]);
    setSvc(s||null);
    setSubs(su);
    setAssigns(as);
    setPeople(pe);
  }

  useEffect(()=>{ (async()=>{
    await ensureSeed();
    await reload();
  })(); }, [id]);

  const aBySub = useMemo(()=> assigns.filter(a=> subs.some(s=>s.id===a.subscriptionId)), [assigns, subs]);

  const kpi = useMemo(()=>{
    const totalSlots = subs.filter(s=>s.status==='active').reduce((acc,s)=> acc + (s.currentSlots||0), 0);
    const used = aBySub.filter(a=> a.status==='active').length;
    const free = Math.max(0, totalSlots - used);
    const monthlyCost = (svc?.baseCostPerMonth||0) * subs.filter(s=>s.status==='active').length;
    const revenue = aBySub.filter(a=> a.status==='active').reduce((sum,a)=> sum + (a.pricePerMonth||0), 0);
    const net = +(revenue - monthlyCost).toFixed(2);
    const util = totalSlots>0 ? Math.round((used/totalSlots)*100) : 0;
    return { totalSlots, used, free, monthlyCost, revenue, net, util };
  }, [svc, subs, aBySub]);

  const dueSoon = useMemo(()=>{
    const soon = new Date(); soon.setDate(soon.getDate()+7);
    return aBySub
      .map(a=> ({ a, person: people.find(p=>p.id===a.personId), sub: subs.find(s=>s.id===a.subscriptionId), nextDue: nextDueDate(a.billingDay, a.lastPaidAt) }))
      .filter(x=> x.nextDue && x.a.status==='active' && x.nextDue <= soon.toISOString().slice(0,10))
      .sort((x,y)=> (x.nextDue! < y.nextDue! ? -1 : 1));
  }, [aBySub, people, subs]);

  function onExportCSV(){
    const rows = aBySub.map(a=>{
      const p = people.find(pp=>pp.id===a.personId);
      const s = subs.find(ss=>ss.id===a.subscriptionId);
      return {
        Person: p?.name ?? '—',
        PreisMonat: a.pricePerMonth ?? 0,
        Abrechnungstag: a.billingDay ?? 1,
        Status: a.status,
        Subscription: s?.id?.slice(0,8) ?? '—'
      };
    });
    exportCSV(`${svc?.name || 'service'}-assignments`, rows as any);
  }
  function onExportJSON(){
    const payload = { service: svc, subs, assignments: aBySub };
    downloadJSON(`${svc?.name || 'service'}.json`, payload);
  }

  function openServiceEdit(){ setModal(<ServiceForm service={svc!} onClose={()=>{ setModal(null); reload(); }}/>); }
  function openSubAdd(){ setModal(<SubscriptionForm serviceId={svc!.id} onClose={()=>{ setModal(null); reload(); }}/>); }
  function openSubEdit(sub: Subscription){ setModal(<SubscriptionForm serviceId={svc!.id} sub={sub} onClose={()=>{ setModal(null); reload(); }}/>); }
  function openAssignAdd(subId: string){ setModal(<AssignmentForm subscriptionId={subId} onClose={()=>{ setModal(null); reload(); }}/>); }
  function openAssignEdit(subId: string, a: Assignment){ setModal(<AssignmentForm subscriptionId={subId} a={a} onClose={()=>{ setModal(null); reload(); }}/>); }

  async function toggleActive(){
    if (!svc) return;
    await db.services.update(svc.id, { active: !svc.active });
    await reload();
  }

  if (!svc) {
    return <Page title="Abo-Details"><div className="empty"><div className="title">Service nicht gefunden</div><div className="hint"><Link to="/abos" className="btn mt-3">Zurück zu Abos</Link></div></div></Page>;
  }

  return (
    <Page
      title={`Abo · ${svc.name}`}
      actions={
        <div className="toolbar">
          <Link to="/abos" className="btn">← Abos</Link>
          <button className="btn" onClick={onExportCSV}>CSV</button>
          <button className="btn" onClick={onExportJSON}>JSON</button>
          <button className="btn" onClick={toggleActive}>{svc.active? 'Deaktivieren':'Aktivieren'}</button>
          <button className="btn btn-primary" onClick={openSubAdd}>Subscription +</button>
          <button className="btn" onClick={openServiceEdit}>Service bearbeiten</button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <div className="card"><div className="text-xs opacity-60">Plan</div><div className="text-lg font-semibold">{svc.plan || '—'}</div></div>
        <div className="card"><div className="text-xs opacity-60">Zyklus</div><div className="text-lg font-semibold">{svc.billingCycle}</div></div>
        <div className="card"><div className="text-xs opacity-60">Slots</div><div className="text-lg font-semibold">{kpi.used}/{kpi.totalSlots} <span className="chip ml-2">{kpi.free} frei</span></div></div>
        <div className="card"><div className="text-xs opacity-60">Auslastung</div><div className="text-lg font-semibold">{kpi.util}%</div></div>
        <div className="card"><div className="text-xs opacity-60">Kosten/Monat</div><div className="text-lg font-semibold">{Euro(kpi.monthlyCost)}</div></div>
        <div className="card"><div className="text-xs opacity-60">Netto/Monat</div><div className="text-lg font-semibold">{Euro(kpi.net)}</div></div>
      </div>

      {/* Subscriptions + Assignments */}
      <div className="grid gap-4">
        {subs.length===0 && (
          <div className="empty">
            <div className="title">Keine Subscriptions</div>
            <div className="hint">Lege mindestens eine Subscription an.</div>
          </div>
        )}

        {subs.map(sub=>{
          const as = aBySub.filter(a=> a.subscriptionId===sub.id);
          const used = as.filter(a=> a.status==='active').length;
          return (
            <div key={sub.id} className="card">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Subscription · {sub.status} · Start {sub.startDate} · Slots {sub.currentSlots}</div>
                <div className="flex gap-2">
                  <button className="btn px-2 py-1" onClick={()=>openSubEdit(sub)}>Edit</button>
                  <button className="btn px-2 py-1 btn-primary" onClick={()=>openAssignAdd(sub.id)}>Assign +</button>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {as.length===0 && <div className="text-sm opacity-70">Keine Zuweisungen.</div>}
                {as.map(a=>{
                  const p = people.find(pp=>pp.id===a.personId);
                  const due = nextDueDate(a.billingDay, a.lastPaidAt);
                  return (
                    <div key={a.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                      <div className="text-sm">
                        {p?.name ?? '—'} · {a.pricePerMonth?.toFixed(2) ?? '0.00'} €/Monat · Tag {a.billingDay} · {a.status} {due? `· fällig ${due}`:''}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn px-2 py-1" onClick={()=>openAssignEdit(sub.id, a)}>Edit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fälligkeiten demnächst */}
      <div className="card mt-4">
        <div className="font-semibold mb-2">Bald fällig (7 Tage)</div>
        {dueSoon.length===0 && <div className="text-sm opacity-70">Nichts in den nächsten 7 Tagen.</div>}
        <div className="grid gap-2">
          {dueSoon.map(x=> (
            <div key={x.a.id} className="flex items-center justify-between bg-white/5 rounded p-2">
              <div className="text-sm">{x.person?.name ?? '—'} · {x.a.pricePerMonth?.toFixed(2) ?? '0.00'} € · fällig {x.nextDue}</div>
              <div className="chip">{subs.find(s=>s.id===x.a.subscriptionId)?.currentSlots} Slots</div>
            </div>
          ))}
        </div>
      </div>

      {modal}
    </Page>
  );
}
