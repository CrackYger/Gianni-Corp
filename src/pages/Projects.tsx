
import { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { db, Project, Milestone, Task } from '@/db/schema';
import { ensureSeed } from '@/db/seed';

function ratio(done:number, total:number){
  if(total<=0) return 0;
  return Math.round((done/total)*100);
}

export default function Projects(){
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(()=>{ (async ()=>{ try {
    await ensureSeed();
    setProjects(await db.projects.toArray());
    setMilestones(await db.milestones.toArray());
    setTasks(await db.tasks.toArray());
  } catch(e){ console.error(e); } })(); },[]);

  const projectCards = useMemo(()=> projects.map(p=>{
    const ms = milestones.filter(m=>m.projectId===p.id);
    const msDone = ms.filter(m=>m.status==='done').length;
    const t = tasks.filter(tk=>tk.projectId===p.id);
    const tOpen = t.filter(tk=>tk.status!=='done').length;
    const tTotal = t.length;
    return { p, ms, msDone, msTotal: ms.length, tOpen, tTotal, prc: ratio(msDone, ms.length) };
  }), [projects, milestones, tasks]);

  return (
    <Page title="Projekte & Roadmaps">
      <div className="grid gap-4">
        {projectCards.length === 0 && (
          <div className="empty">
            <div className="title">Noch keine Projekte</div>
            <div className="hint">Lege ein Projekt an und füge Milestones sowie Tasks hinzu.</div>
          </div>
        )}
        <div className="grid gap-4">
          {projectCards.map(({p, msDone, msTotal, tOpen, tTotal, prc})=> (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.name}</div>
                <span className="chip">{p.status ?? 'active'}</span>
              </div>
              {p.description && <div className="text-sm opacity-80 mt-1">{p.description}</div>}
              <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
                <div>
                  <div className="opacity-60">Milestones</div>
                  <div className="font-medium">{msDone} / {msTotal}</div>
                  <div className="progress mt-1"><span style={{width:`${prc}%`}}/></div>
                </div>
                <div>
                  <div className="opacity-60">Tasks offen</div>
                  <div className="font-medium">{tOpen} / {tTotal}</div>
                </div>
                <div>
                  <div className="opacity-60">Owner</div>
                  <div className="font-medium">{p.owner ?? (row?.createdBy ?? row?.name) ?? '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
