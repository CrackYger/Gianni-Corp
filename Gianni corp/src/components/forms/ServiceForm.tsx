
import { useState } from 'react';
import Modal from '@/components/Modal';
import { db, Service } from '@/db/schema';

export default function ServiceForm({service, onClose}:{service?:Service; onClose:()=>void}){
  const [name, setName] = useState(service?.name ?? '');
  const [plan, setPlan] = useState(service?.plan ?? '');
  const [maxSlots, setMaxSlots] = useState<number>(service?.maxSlots ?? 1);
  const [baseCostPerMonth, setBaseCostPerMonth] = useState<number>(service?.baseCostPerMonth ?? 0);
  const [billingCycle, setBillingCycle] = useState<'monthly'|'yearly'>(service?.billingCycle ?? 'monthly');
  const [active, setActive] = useState<boolean>(service?.active ?? true);
  const save = async ()=>{
    if(!name.trim()) return;
    if(service){
      await db.services.update(service.id, { name, plan, maxSlots, baseCostPerMonth, billingCycle, active });
    }else{
      await db.services.add({ id: crypto.randomUUID(), name, plan, maxSlots, baseCostPerMonth, billingCycle, active });
    }
    onClose();
    location.reload();
  };
  return (
    <Modal onClose={onClose}>
      <div className="text-lg font-semibold mb-3">{service? 'Service bearbeiten':'Service anlegen'}</div>
      <div className="grid gap-2">
        <label className="text-sm">Name</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Spotify"/>
        <label className="text-sm">Plan</label>
        <input className="input" value={plan} onChange={e=>setPlan(e.target.value)} placeholder="z. B. Family"/>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Max. Slots je Subscription</label>
            <input className="input" type="number" min={1} value={maxSlots} onChange={e=>setMaxSlots(+e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Kosten/Monat (€)</label>
            <input className="input" type="number" step="0.01" value={baseCostPerMonth} onChange={e=>setBaseCostPerMonth(+e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Abrechnung</label>
            <select className="input" value={billingCycle} onChange={e=>setBillingCycle(e.target.value as any)}>
              <option value="monthly">Monatlich</option>
              <option value="yearly">Jährlich</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <input id="active" type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            <label htmlFor="active">aktiv</label>
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
