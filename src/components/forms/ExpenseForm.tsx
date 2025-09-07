
import { useState } from 'react';
import Modal from '@/components/Modal';
import { db } from '@/db/schema';

export default function ExpenseForm({onClose}:{onClose:()=>void}){
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState('');
  const save = async ()=>{
    await db.expenses.add({ id: crypto.randomUUID(), date, amount, memo });
    onClose();
    location.reload();
  };
  return (
    <Modal onClose={onClose}>
      <div className="text-lg font-semibold mb-2">Ausgabe hinzufügen</div>
      <div className="grid gap-2">
        <label className="text-sm">Datum</label>
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <label className="text-sm">Betrag (€)</label>
        <input className="input" type="number" step="0.01" value={amount} onChange={e=>setAmount(+e.target.value)} />
        <label className="text-sm">Notiz (optional)</label>
        <input className="input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="z. B. Spotify Family" />
        <div className="text-right mt-2">
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary ml-2" onClick={save}>Speichern</button>
        </div>
      </div>
    </Modal>
  );
}
