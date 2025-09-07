
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal';
import { db, Assignment, Person, Subscription, Service } from '@/db/schema';

export default function IncomeForm({onClose}:{onClose:()=>void}){
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [assigns, setAssigns] = useState<(Assignment & {person?:Person; sub?:Subscription; svc?:Service})[]>([]);

  useEffect(()=>{ (async ()=>{
    const [a,p,su,sv] = await Promise.all([db.assignments.toArray(), db.people.toArray(), db.subscriptions.toArray(), db.services.toArray()]);
    const rows = a.map(x=> ({
      ...x,
      person: p.find(pp=>pp.id===x.personId),
      sub: su.find(ss=>ss.id===x.subscriptionId),
      svc: undefined as any
    }));
    rows.forEach(r=> r.svc = sv.find(s=>s.id===r.sub?.serviceId));
    setAssigns(rows);
  })(); },[]);

  const selected = useMemo(()=> assigns.find(a=>a.id===assignmentId), [assignmentId, assigns]);
  useEffect(()=>{ if(selected && !amount) setAmount(selected.pricePerMonth); }, [selected]);

  const save = async ()=>{
    const id = crypto.randomUUID();
    await db.incomes.add({ id, date, amount, memo, assignmentId });
    if(selected){
      const dueDay = Math.min(Math.max(selected.billingDay||1,1),28);
      const d = new Date(date);
      const paidMonthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const next = new Date(paidMonthStart.getFullYear(), paidMonthStart.getMonth()+1, dueDay);
      await db.assignments.update(selected.id, { lastPaidAt: date, nextDueAt: next.toISOString().slice(0,10) });
    }
    onClose();
    location.reload();
  };

  return (
    <Modal onClose={onClose}>
      <div className="text-lg font-semibold mb-2">Einnahme hinzufügen</div>
      <div className="grid gap-2">
        <label className="text-sm">Assignment (optional, für Auto-Abgleich)</label>
        <select className="input" value={assignmentId} onChange={e=>setAssignmentId(e.target.value)}>
          <option value="">— ohne Zuordnung —</option>
          {assigns.map(a=> <option key={a.id} value={a.id}>{a.svc?.name ?? 'Abo'} • {a.person?.name ?? '—'} • {a.pricePerMonth.toFixed(2)} €/m</option>)}
        </select>
        <label className="text-sm">Datum</label>
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <label className="text-sm">Betrag (€)</label>
        <input className="input" type="number" step="0.01" value={amount} onChange={e=>setAmount(+e.target.value)} />
        <label className="text-sm">Notiz (optional)</label>
        <input className="input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="z. B. Zahlung Sophia" />
        <div className="text-right mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary ml-2" onClick={save}>Speichern</button>
        </div>
      </div>
    </Modal>
  );
}
