
import { useState } from 'react';
import Modal from './Modal';
import { db } from '@/db/schema';

export default function QuickAdd({onClose}:{onClose:()=>void}){
  const [tab, setTab] = useState<'task'|'person'>('task');
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const saveTask = async ()=>{
    if(!title.trim()) return;
    await db.tasks.add({ id: crypto.randomUUID(), title, description:'', priority:2, tags:[], status:'open' });
    onClose();
    location.reload();
  };
  const savePerson = async ()=>{
    if(!name.trim()) return;
    await db.people.add({ id: crypto.randomUUID(), name });
    onClose();
    location.reload();
  };
  return (
    <Modal onClose={onClose}>
      <div className="flex gap-2 mb-3">
        <button className={`btn ${tab==='task'?'bg-white/10':''}`} onClick={()=>setTab('task')}>Task</button>
        <button className={`btn ${tab==='person'?'bg-white/10':''}`} onClick={()=>setTab('person')}>Person</button>
      </div>
      {tab==='task' && (
        <div className="grid gap-2">
          <label className="text-sm">Titel</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Neue Aufgabe…" />
          <div className="text-right mt-2">
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn ml-2" onClick={saveTask}>Speichern</button>
          </div>
        </div>
      )}
      {tab==='person' && (
        <div className="grid gap-2">
          <label className="text-sm">Name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Name der Person…" />
          <div className="text-right mt-2">
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn ml-2" onClick={savePerson}>Speichern</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
