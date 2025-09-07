
import { useState } from 'react';
import Modal from '@/components/Modal';
import { db, Subscription } from '@/db/schema';

export default function SubscriptionForm({serviceId, sub, onClose}:{serviceId:string; sub?:Subscription; onClose:()=>void}){
  const [startDate, setStartDate] = useState(sub?.startDate ?? new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState<'active'|'paused'|'canceled'>(sub?.status ?? 'active');
  const [currentSlots, setCurrentSlots] = useState<number>(sub?.currentSlots ?? 1);
  const save = async ()=>{
    if(sub){
      await db.subscriptions.update(sub.id, { startDate, status, currentSlots });
    }else{
      await db.subscriptions.add({ id: crypto.randomUUID(), serviceId, startDate, status, currentSlots });
    }
    onClose();
    location.reload();
  };
  return (
    <Modal onClose={onClose}>
      <div className="text-lg font-semibold mb-3">{sub? 'Subscription bearbeiten':'Subscription hinzufügen'}</div>
      <div className="grid gap-2">
        <label className="text-sm">Startdatum</label>
        <input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Status</label>
            <select className="input" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="active">aktiv</option>
              <option value="paused">pausiert</option>
              <option value="canceled">gekündigt</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Slots</label>
            <input className="input" type="number" min={1} value={currentSlots} onChange={e=>setCurrentSlots(+e.target.value)} />
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
