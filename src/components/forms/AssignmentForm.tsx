
import { useState } from 'react';
import Modal from '@/components/Modal';
import PersonSelect from '@/components/PersonSelect';
import { db, Assignment } from '@/db/schema';

export default function AssignmentForm({subscriptionId, a, onClose}:{subscriptionId:string; a?:Assignment; onClose:()=>void}){
  const [personId, setPersonId] = useState(a?.personId ?? '');
  const [since, setSince] = useState(a?.since ?? new Date().toISOString().slice(0,10));
  const [pricePerMonth, setPricePerMonth] = useState<number>(a?.pricePerMonth ?? 0);
  const [billingDay, setBillingDay] = useState<number>(a?.billingDay ?? 1);
  const [status, setStatus] = useState<'active'|'paused'|'ended'>(a?.status ?? 'active');
  
    const save = async ()=>{
      // capacity check
      const sub = await db.subscriptions.get(subscriptionId);
      const currentCount = await db.assignments.where('subscriptionId').equals(subscriptionId).filter(x=>x.status==='active').count();
      const cap = sub?.currentSlots ?? 0;
      if(!a && currentCount >= cap){
        alert('Kein freier Slot in dieser Subscription. Bitte Slots erhöhen oder Zuweisung beenden.');
        return;
      }

    if(!personId) return;
    if(a){
      await db.assignments.update(a.id, { personId, since, pricePerMonth, billingDay, status });
    }else{
      await db.assignments.add({ id: crypto.randomUUID(), subscriptionId, personId, since, pricePerMonth, billingDay, status });
    }
    onClose();
    location.reload();
  };
  return (
    <Modal onClose={onClose}>
      <div className="text-lg font-semibold mb-3">{a? 'Zuweisung bearbeiten':'Zuweisung hinzufügen'}</div>
      <div className="grid gap-2">
        <label className="text-sm">Person</label>
        <PersonSelect value={personId} onChange={setPersonId}/>
        <label className="text-sm">Seit</label>
        <input className="input" type="date" value={since} onChange={e=>setSince(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-sm">Preis/Monat (€)</label>
            <input className="input" type="number" step="0.01" value={pricePerMonth} onChange={e=>setPricePerMonth(+e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Abrechnungstag</label>
            <input className="input" type="number" min={1} max={28} value={billingDay} onChange={e=>setBillingDay(+e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Status</label>
            <select className="input" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="active">aktiv</option>
              <option value="paused">pausiert</option>
              <option value="ended">beendet</option>
            </select>
          </div>
        </div>
        <div className="text-right mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary ml-2" onClick={save}>Speichern</button>
        </div>
      </div>
    </Modal>
  );
}
