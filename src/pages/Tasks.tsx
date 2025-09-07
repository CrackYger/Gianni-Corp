
import { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { db, Task } from '@/db/schema';
import { ensureSeed } from '@/db/seed';

type Status = 'open'|'doing'|'review'|'done';

const COLUMNS: {key: Status; label: string}[] = [
  { key: 'open', label: 'OPEN' },
  { key: 'doing', label: 'DOING' },
  { key: 'review', label: 'REVIEW' },
  { key: 'done', label: 'DONE' },
];

export default function Tasks(){
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('open');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  useEffect(()=>{ (async ()=>{ try {
    await ensureSeed();
    setTasks(await db.tasks.toArray());
  } catch(e){ console.error(e); } })(); },[]);

  const addTask = async ()=>{
    if(!title.trim()) return;
    const t: Task = { id: crypto.randomUUID(), title: title.trim(), description: '', priority: 2, status, projectId, tags: [] };
    await db.tasks.add(t);
    setTasks(await db.tasks.toArray());
    setTitle('');
    setStatus('open');
  };

  const move = async (id:string, to: Status)=>{
    await db.tasks.update(id, { status: to });
    setTasks(await db.tasks.toArray());
  };

  const del = async (id:string)=>{
    if(!confirm('Aufgabe löschen?')) return;
    await db.tasks.delete(id);
    setTasks(await db.tasks.toArray());
  };

  const grouped = useMemo(()=>{
    const map: Record<Status, Task[]> = { open:[], doing:[], review:[], done:[] };
    tasks.forEach(t=> map[t.status as Status]?.push(t));
    return map;
  }, [tasks]);

  return (
    <Page
      title="Aufgaben"
      actions={
        <div className="toolbar">
          <input className="input w-[240px]" placeholder="Neue Aufgabe…" value={title} onChange={e=>setTitle(e.target.value)} />
          <div className="seg">
            {COLUMNS.slice(0,3).map(c=> (
              <button key={c.key} aria-pressed={status===c.key} onClick={()=>setStatus(c.key as Status)}>{c.label}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={addTask}>Hinzufügen</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map(col=> (
          <div key={col.key} className="card">
            <div className="text-xs opacity-70 mb-2">{col.label}</div>
            <div className="grid gap-2">
              {grouped[col.key].map(t=> (
                <div key={t.id} layout initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-white/5 rounded-xl p-3">
                  <div className="font-medium">{t.title}</div>
                  {t.description && <div className="text-xs opacity-70 mt-1">{t.description}</div>}
                  <div className="flex gap-2 mt-2">
                    {col.key!=='open' && <button className="btn btn-ghost px-2 py-1" onClick={()=>move(t.id, prev(col.key))}>Zurück</button>}
                    {col.key!=='done' && <button className="btn btn-primary px-2 py-1" onClick={()=>move(t.id, next(col.key))}>Weiter</button>}
                    <button className="btn btn-danger px-2 py-1 ml-auto" onClick={()=>del(t.id)}>Del</button>
                  </div>
                </div>
              ))}
              {grouped[col.key].length===0 && <div className="text-xs opacity-50">—</div>}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function next(s: Status): Status{
  if(s==='open') return 'doing';
  if(s==='doing') return 'review';
  return 'done';
}
function prev(s: Status): Status{
  if(s==='done') return 'review';
  if(s==='review') return 'doing';
  return 'open';
}
