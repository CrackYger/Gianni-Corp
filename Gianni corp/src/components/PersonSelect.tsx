
import { useEffect, useState } from 'react';
import { db, Person } from '@/db/schema';

export default function PersonSelect({value, onChange}:{value?:string; onChange:(id:string)=>void}){
  const [people, setPeople] = useState<Person[]>([]);
  const [newName, setNewName] = useState('');
  useEffect(()=>{ (async ()=> setPeople(await db.people.toArray()))(); },[]);
  const addPerson = async ()=>{
    if(!newName.trim()) return;
    const id = crypto.randomUUID();
    await db.people.add({ id, name: newName.trim() });
    setPeople(await db.people.toArray());
    onChange(id);
    setNewName('');
  };
  return (
    <div className="grid gap-2">
      <select className="input" value={value || ''} onChange={e=>onChange(e.target.value)}>
        <option value="" disabled>— Person auswählen —</option>
        {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input className="input" placeholder="Neue Person…" value={newName} onChange={e=>setNewName(e.target.value)} />
        <button className="btn" onClick={addPerson}>Hinzufügen</button>
      </div>
    </div>
  );
}
