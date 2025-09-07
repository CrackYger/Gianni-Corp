
import { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { Link } from 'react-router-dom';
import { db, Person, Assignment, Subscription, Service } from '@/db/schema';
import { ensureSeed } from '@/db/seed';

type Row = Person & {
  assigns: (Assignment & {service?: Service; sub?: Subscription})[];
  totalPerMonth: number;
};

export default function People(){
  const [people, setPeople] = useState<Person[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(()=>{ (async ()=>{ try {
    await ensureSeed();
    setPeople(await db.people.toArray());
    setAssigns(await db.assignments.toArray());
    setSubs(await db.subscriptions.toArray());
    setServices(await db.services.toArray());
  } catch(e){ console.error(e); } })(); },[]);

  const rows: Row[] = useMemo(()=> people.map(p=>{
    const a = assigns.filter(x=>x.personId===p.id).map(x=> ({
      ...x,
      sub: subs.find(s=>s.id===x.subscriptionId),
      service: undefined as any
    }));
    a.forEach(r=> r.service = services.find(s=>s.id===r.sub?.serviceId));
    const totalPerMonth = a.filter(x=>x.status==='active').reduce((sum,x)=> sum + (x.pricePerMonth||0), 0);
    return {...p, assigns: a, totalPerMonth};
  }), [people, assigns, subs, services]);

  return (
    <Page title="Personen" actions={<Link to="/personen/tabelle" className="btn">Tabelle</Link>}>
      <div className="grid gap-4">
        {rows.length===0 && (
          <div className="empty">
            <div className="title">Noch keine Personen</div>
            <div className="hint">Lege Personen an, indem du sie in einer Zuweisung auswählst – oder nutze „Zuweisung +“ bei einem Abo.</div>
          </div>
        )}
        <div className="grid gap-3">
          {rows.map(p=> (
            <div key={p.id} className="card hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.name}</div>
                <div className="chip">Gesamt/Monat: {p.totalPerMonth.toFixed(2)} €</div>
              </div>
              <div className="mt-2 text-sm opacity-70">{p.email ?? '—'}</div>
              <div className="mt-3 grid gap-2">
                <div className="text-xs opacity-70">Assignments</div>
                {p.assigns.length===0 && <div className="text-xs opacity-60">—</div>}
                {p.assigns.map(a=> (
                  <div key={a.id} className="bg-white/5 rounded-xl p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        {a.service?.name ?? 'Abo'} — {a.pricePerMonth.toFixed(2)} €/Monat <span className="opacity-60">({a.status})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
