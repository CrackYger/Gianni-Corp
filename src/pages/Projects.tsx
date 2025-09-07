import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Page from "@/components/Page";
import Modal from "@/components/Modal";
import Donut from "@/components/viz/Donut";
import { db as _db } from "@/db/schema";
import {
  Plus, Pencil, Trash2, CheckCircle2, Circle, Calendar,
  MoreHorizontal, Upload, Download, Search, LayoutList, LayoutGrid, ArrowRight
} from "lucide-react";

/** ========= Types ========= */
type Status = "idea" | "planning" | "active" | "done";
type MilestoneStatus = "open" | "done";
type Project = {
  id: string;
  name: string;
  description?: string;
  status: Status;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};
type Milestone = {
  id: string;
  projectId: string;
  title: string;
  due?: string;  // yyyy-mm-dd
  status: MilestoneStatus;
  createdAt?: string;
  updatedAt?: string;
};

type ViewMode = "board" | "list";

/** ========= Storage bridge (Dexie if available → else LocalStorage) ========= */
const LS_P = "gc_projects_v1";
const LS_M = "gc_milestones_v1";
const PREF_VIEW = "gc_projects_view_v1";

const lstore = {
  async allProjects(): Promise<Project[]> {
    try { return JSON.parse(localStorage.getItem(LS_P) || "[]"); } catch { return []; }
  },
  async saveProjects(ps: Project[]) { localStorage.setItem(LS_P, JSON.stringify(ps)); },
  async allMilestones(): Promise<Milestone[]> {
    try { return JSON.parse(localStorage.getItem(LS_M) || "[]"); } catch { return []; }
  },
  async saveMilestones(ms: Milestone[]) { localStorage.setItem(LS_M, JSON.stringify(ms)); },
  getView(): ViewMode { return (localStorage.getItem(PREF_VIEW) as ViewMode) || "board"; },
  setView(v: ViewMode) { localStorage.setItem(PREF_VIEW, v); }
};

const db = (() => { try { if ((_db as any)?.projects && (_db as any)?.milestones) return _db; } catch {} return null as any; })();

async function getProjects(): Promise<Project[]> { if (db) { try { return await db.projects.toArray(); } catch {} } return lstore.allProjects(); }
async function getMilestones(): Promise<Milestone[]> { if (db) { try { return await db.milestones.toArray(); } catch {} } return lstore.allMilestones(); }
async function addProject(p: Project) { if (db) { try { await db.projects.add(p); return; } catch {} } const all = await lstore.allProjects(); all.push(p); await lstore.saveProjects(all); }
async function updateProject(id: string, patch: Partial<Project>) {
  if (db) { try { await db.projects.update(id, patch); return; } catch {} }
  const all = await lstore.allProjects(); const i = all.findIndex(x=>x.id===id);
  if (i>=0) { all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() }; await lstore.saveProjects(all); }
}
async function removeProject(id: string) {
  if (db) { try { await db.projects.delete(id); } catch {} }
  const ps = (await lstore.allProjects()).filter(p=>p.id!==id);
  const ms = (await lstore.allMilestones()).filter(m=>m.projectId!==id);
  await lstore.saveProjects(ps); await lstore.saveMilestones(ms);
}
async function addMilestone(m: Milestone) { if (db) { try { await db.milestones.add(m); return; } catch {} } const all = await lstore.allMilestones(); all.push(m); await lstore.saveMilestones(all); }
async function updateMilestone(id: string, patch: Partial<Milestone>) {
  if (db) { try { await db.milestones.update(id, patch); return; } catch {} }
  const all = await lstore.allMilestones(); const i = all.findIndex(x=>x.id===id);
  if (i>=0) { all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() }; await lstore.saveMilestones(all); }
}
async function removeMilestone(id: string) { if (db) { try { await db.milestones.delete(id); return; } catch {} } const all = await lstore.allMilestones(); await lstore.saveMilestones(all.filter(m=>m.id!==id)); }

/** ========= Utils ========= */
const STATUS_LABEL: Record<Status, string> = { idea:"Idee", planning:"Planung", active:"Aktiv", done:"Fertig" };
const STATUS_COLS: Status[] = ["idea","planning","active","done"];
const fmtDate = (iso?:string)=> iso ? new Date(iso).toLocaleDateString() : "—";
const todayISO = ()=> new Date().toISOString().slice(0,10);
function nextDueFor(projectId: string, miles: Milestone[]){
  const list = miles.filter(m=>m.projectId===projectId && m.status!=="done" && m.due);
  const sorted = list.sort((a,b)=> (a.due||"").localeCompare(b.due||""));
  return sorted[0]?.due;
}
function progressFor(projectId: string, miles: Milestone[]) {
  const m = miles.filter(x=>x.projectId===projectId);
  if (m.length===0) return 0;
  const done = m.filter(x=>x.status==="done").length;
  return Math.round((done/m.length)*100);
}
function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }
function id(){ return (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)); }

/** ========= Editors ========= */
function ProjectEditor({initial, onClose, onSaved}:{initial?:Partial<Project>, onClose:()=>void, onSaved:(p:Project)=>void}){
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<Status>((initial?.status as Status) ?? "idea");
  const [tags, setTags] = useState<string>(Array.isArray(initial?.tags) ? initial!.tags.join(", ") : "");

  const save = async ()=>{
    if (!name.trim()) return;
    if (initial?.id) {
      const patch = { name: name.trim(), description: description.trim(), status, tags: tags.split(",").map(s=>s.trim()).filter(Boolean), updatedAt: new Date().toISOString() };
      await updateProject(initial.id, patch);
      onSaved({ ...(initial as Project), ...(patch as any) });
    } else {
      const now = new Date().toISOString();
      const p: Project = { id: id(), name: name.trim(), description: description.trim(), status, tags: tags.split(",").map(s=>s.trim()).filter(Boolean), createdAt: now, updatedAt: now };
      await addProject(p);
      onSaved(p);
    }
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <div className="text-lg font-semibold mb-3">{initial?.id ? "Projekt bearbeiten" : "Neues Projekt"}</div>
        <div className="grid gap-3">
          <div><label className="text-sm">Name</label><input className="input mt-1 w-full" value={name} onChange={e=>setName(e.target.value)} placeholder="Projektname"/></div>
          <div><label className="text-sm">Beschreibung</label><textarea className="input mt-1 w-full min-h-[90px]" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm">Status</label>
              <select className="input mt-1 w-full" value={status} onChange={e=>setStatus(e.target.value as Status)}>
                <option value="idea">Idee</option><option value="planning">Planung</option><option value="active">Aktiv</option><option value="done">Fertig</option>
              </select>
            </div>
            <div><label className="text-sm">Tags (Komma-getrennt)</label><input className="input mt-1 w-full" value={tags} onChange={e=>setTags(e.target.value)} placeholder="intern,prio,ios"/></div>
          </div>
          <div className="text-right"><button className="btn btn-ghost" onClick={onClose}>Abbrechen</button><button className="btn ml-2" onClick={save}>Speichern</button></div>
        </div>
      </div>
    </Modal>
  );
}

function NewMilestone({onAdd}:{onAdd:(title:string, due?:string)=>void}){
  const [title, setTitle] = useState(""); const [due, setDue] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <input className="input flex-1" placeholder="Neuer Meilenstein" value={title} onChange={e=>setTitle(e.target.value)} />
      <input type="date" className="input w-[10.5rem]" value={due} onChange={e=>setDue(e.target.value)} />
      <button className="btn" onClick={()=>{ if(title.trim()){ onAdd(title.trim(), due||undefined); setTitle(""); setDue(""); } }}><Plus size={16}/></button>
    </div>
  );
}

function InlineMilestone({m, onToggle, onEdit, onDelete}:{m:Milestone; onToggle:()=>void; onEdit:(title:string)=>void; onDelete:()=>void}){
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title);
  const save = ()=>{ if(title.trim()){ onEdit(title.trim()); setEditing(false); } };
  const isDone = m.status==="done";
  return (
    <div className={"flex items-center gap-2 py-1.5 " + (isDone ? "opacity-70" : "")}>
      <button onClick={onToggle} className="rounded-full p-1 border border-white/10">{isDone ? <CheckCircle2 size={18}/> : <Circle size={18}/>}</button>
      <div className="flex-1">
        {!editing ? (
          <div className="text-sm">{m.title}</div>
        ) : (
          <input className="input h-8 text-sm w-full" value={title} onChange={e=>setTitle(e.target.value)} onBlur={save} onKeyDown={e=> e.key==='Enter' && save()} autoFocus/>
        )}
        {m.due && <div className="text-xs opacity-70 flex items-center gap-1 mt-0.5"><Calendar size={12}/>Fällig: {fmtDate(m.due)}</div>}
      </div>
      <button className="btn btn-ghost p-1.5" onClick={()=>setEditing(v=>!v)}><Pencil size={16}/></button>
      <button className="btn btn-ghost p-1.5" onClick={onDelete}><Trash2 size={16}/></button>
    </div>
  );
}

/** ========= Main ========= */
export default function Projects(){
  const [projects, setProjects] = useState<Project[]>([]);
  const [miles, setMiles] = useState<Milestone[]>([]);

  // UI state
  const [view, setView] = useState<ViewMode>(lstore.getView());
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated"|"progress"|"due">("updated");

  const [editor, setEditor] = useState<null | {initial?: Project}>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(()=>{
    (async ()=>{
      const [p, m] = await Promise.all([getProjects(), getMilestones()]);
      setProjects(p); setMiles(m);
    })();
  },[]);

  // Derived data
  const allTags = useMemo(()=> uniq(projects.flatMap(p=> p.tags||[])), [projects]);
  const stats = useMemo(()=>{
    const now = todayISO();
    const openMilestones = miles.filter(m=>m.status!=='done').length;
    const dueSoon = miles.filter(m=> m.status!=='done' && m.due && m.due <= addDaysISO(7)).length;
    const activeCount = projects.filter(p=> p.status==='planning' || p.status==='active').length;
    let avg = 0, c=0;
    projects.forEach(p=>{ const pr=progressFor(p.id, miles); if(!Number.isNaN(pr)){ avg+=pr; c++; } });
    return { openMilestones, dueSoon, activeCount, avgProgress: c? Math.round(avg/c) : 0 };
  },[projects, miles]);

  function addDaysISO(days:number){
    const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10);
  }

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    let list = projects.filter(p => {
      const statusOk = (filterStatus==="all") || p.status===filterStatus;
      const tagsOk = filterTags.length===0 || (p.tags||[]).some(t => filterTags.includes(t));
      const textOk = !q || [p.name, p.description, ...(p.tags||[])].join(" ").toLowerCase().includes(q);
      return statusOk && tagsOk && textOk;
    });
    if (sort==="updated") {
      list = list.sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
    } else if (sort==="progress") {
      list = list.sort((a,b)=> progressFor(b.id, miles) - progressFor(a.id, miles));
    } else if (sort==="due") {
      // earliest next due first
      list = list.sort((a,b)=> (nextDueFor(a.id, miles)||"9999").localeCompare(nextDueFor(b.id, miles)||"9999"));
    }
    return list;
  },[projects, miles, filterStatus, filterTags, search, sort]);

  const openNew = ()=> setEditor({});
  const openEdit = (p:Project)=> setEditor({initial:p});
  const toggleExpand = (id:string)=> setExpanded(prev=> ({...prev, [id]: !prev[id]}));

  const setStatus = async (p:Project, status:Status)=>{
    await updateProject(p.id, { status, updatedAt: new Date().toISOString() });
    setProjects(prev=> prev.map(x=> x.id===p.id ? { ...x, status } : x));
  };
  const remove = async (p:Project)=>{
    if(!confirm("Projekt und alle Meilensteine löschen?")) return;
    await removeProject(p.id);
    setProjects(prev=> prev.filter(x=> x.id!==p.id));
    setMiles(prev=> prev.filter(x=> x.projectId!==p.id));
  };

  const createMilestone = async (projectId:string, title:string, due?:string)=>{
    const now = new Date().toISOString();
    const m: Milestone = { id: id(), projectId, title, due, status: "open", createdAt: now, updatedAt: now };
    await addMilestone(m);
    setMiles(prev=> [m, ...prev]);
  };
  const toggleMilestone = async (m:Milestone)=>{
    const status: MilestoneStatus = m.status==="done" ? "open" : "done";
    await updateMilestone(m.id, { status, updatedAt: new Date().toISOString() });
    setMiles(prev=> prev.map(x=> x.id===m.id ? { ...x, status } : x));
  };
  const editMilestoneTitle = async (m:Milestone, title:string)=>{
    await updateMilestone(m.id, { title, updatedAt: new Date().toISOString() });
    setMiles(prev=> prev.map(x=> x.id===m.id ? { ...x, title } : x));
  };
  const deleteMilestone = async (m:Milestone)=>{
    if(!confirm("Meilenstein löschen?")) return;
    await removeMilestone(m.id);
    setMiles(prev=> prev.filter(x=> x.id!==m.id));
  };

  const exportJSON = ()=>{
    const payload = JSON.stringify({ projects, milestones: miles }, null, 2);
    const blob = new Blob([payload], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `giannicorp-projects-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importRef = useRef<HTMLInputElement>(null);
  const importJSON = ()=> importRef.current?.click();
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result||"{}"));
        const ps: Project[] = Array.isArray(data.projects) ? data.projects : [];
        const ms: Milestone[] = Array.isArray(data.milestones) ? data.milestones : [];
        // naive merge: append if not existing
        const pMap = new Map(projects.map(p=>[p.id,p] as const));
        const mMap = new Map(miles.map(m=>[m.id,m] as const));
        const mergedP = [...projects, ...ps.filter(p=>!pMap.has(p.id))];
        const mergedM = [...miles, ...ms.filter(m=>!mMap.has(m.id))];
        if (!db){ await lstore.saveProjects(mergedP); await lstore.saveMilestones(mergedM); }
        setProjects(mergedP); setMiles(mergedM);
        alert("Import abgeschlossen.");
      } catch { alert("Import fehlgeschlagen. Ungültige Datei."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const switchView = (v:ViewMode)=>{ setView(v); lstore.setView(v); };

  return (
    <Page
      title="Projekte"
      actions={
        <div className="flex items-center gap-2">
          <div className="seg">
            <button aria-pressed={view==='board'} onClick={()=>switchView('board')} title="Board"><LayoutGrid size={16}/></button>
            <button aria-pressed={view==='list'} onClick={()=>switchView('list')} title="Liste"><LayoutList size={16}/></button>
          </div>
          <button className="btn btn-ghost" onClick={importJSON}><Upload size={16}/>Import</button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={handleImport}/>
          <button className="btn btn-ghost" onClick={exportJSON}><Download size={16}/>Export</button>
          <button className="btn" onClick={()=>setEditor({})}><Plus size={16}/>Neues Projekt</button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card"><div className="text-sm opacity-70">Aktive Projekte</div><div className="text-3xl font-semibold mt-1 tabular-nums">{stats.activeCount}</div></div>
        <div className="card"><div className="text-sm opacity-70">Offene Meilensteine</div><div className="text-3xl font-semibold mt-1 tabular-nums">{stats.openMilestones}</div></div>
        <div className="card"><div className="text-sm opacity-70">Fällig in 7 Tagen</div><div className="text-3xl font-semibold mt-1 tabular-nums">{stats.dueSoon}</div></div>
        <div className="card flex items-center justify-between">
          <div><div className="text-sm opacity-70">Ø Fortschritt</div><div className="text-3xl font-semibold mt-1">{stats.avgProgress}%</div></div>
          <Donut value={stats.avgProgress} size={80} stroke={10} label="Ø Fortschritt"/>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70" size={16}/>
          <input className="input pl-7 w-64" placeholder="Suche (Name, Beschreibung, Tags)"
                 value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="seg">
          {(["all","idea","planning","active","done"] as const).map(s=>(
            <button key={s} aria-pressed={filterStatus===s} onClick={()=>setFilterStatus(s as any)}>{s==="all" ? "Alle" : STATUS_LABEL[s as Status]}</button>
          ))}
        </div>
        <select className="input h-9" value={sort} onChange={e=>setSort(e.target.value as any)}>
          <option value="updated">Sortierung: Zuletzt aktualisiert</option>
          <option value="progress">Sortierung: Fortschritt</option>
          <option value="due">Sortierung: Nächste Fälligkeit</option>
        </select>
        {/* Tags filter */}
        <div className="flex flex-wrap gap-1">
          {allTags.map(t => {
            const active = filterTags.includes(t);
            return (
              <button key={t} onClick={()=> setFilterTags(prev => active ? prev.filter(x=>x!==t) : [...prev, t])}
                      className={"chip " + (active ? "chip-active" : "")}>{t}</button>
            );
          })}
          {allTags.length===0 && <span className="text-sm opacity-70">Keine Tags vorhanden</span>}
        </div>
      </div>

      {/* Content */}
      {view === "board" ? (
        <BoardView
          projects={filtered}
          miles={miles}
          onEdit={openEdit}
          onDelete={remove}
          onStatusChange={setStatus}
          onCreateMilestone={createMilestone}
          onToggleMilestone={toggleMilestone}
          onEditMilestone={editMilestoneTitle}
          onDeleteMilestone={deleteMilestone}
        />
      ) : (
        <ListView
          projects={filtered}
          miles={miles}
          onEdit={openEdit}
          onDelete={remove}
          onStatusChange={setStatus}
        />
      )}

      {editor && (
        <ProjectEditor
          initial={editor.initial}
          onClose={()=>setEditor(null)}
          onSaved={(p)=>{
            setProjects(prev=>{
              const exists = prev.some(x=>x.id===p.id);
              const next = exists ? prev.map(x=> x.id===p.id ? p : x) : [p, ...prev];
              return next;
            });
          }}
        />
      )}
    </Page>
  );
}

/** ========= Views ========= */
function BoardView({projects, miles, onEdit, onDelete, onStatusChange, onCreateMilestone, onToggleMilestone, onEditMilestone, onDeleteMilestone}:{
  projects: Project[]; miles: Milestone[];
  onEdit:(p:Project)=>void; onDelete:(p:Project)=>void; onStatusChange:(p:Project, s:Status)=>void;
  onCreateMilestone:(projectId:string, title:string, due?:string)=>void;
  onToggleMilestone:(m:Milestone)=>void; onEditMilestone:(m:Milestone, title:string)=>void; onDeleteMilestone:(m:Milestone)=>void;
}){
  return (
    <div className="mt-4 grid xl:grid-cols-4 md:grid-cols-2 gap-3">
      {STATUS_COLS.map(col => {
        const list = projects.filter(p=>p.status===col);
        return (
          <div key={col} className="glass rounded-2xl p-3 border border-white/10 min-h-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{STATUS_LABEL[col]}</div>
              <div className="text-xs opacity-70">{list.length}</div>
            </div>
            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {list.length===0 && <div className="text-sm opacity-60">—</div>}
                {list.map(p => {
                  const ms = miles.filter(m=>m.projectId===p.id);
                  const nextDue = nextDueFor(p.id, miles);
                  const pr = progressFor(p.id, miles);
                  const openCount = ms.filter(m=>m.status!=='done').length;
                  const doneCount = ms.length - openCount;
                  return (
                    <motion.div key={p.id} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} className="card p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="font-medium leading-tight">{p.name}</div>
                          {p.tags?.length>0 && <div className="mt-1 flex flex-wrap gap-1.5">{p.tags.map((t,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs border border-white/10">{t}</span>))}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="btn btn-ghost p-1.5" onClick={()=>onEdit(p)}><Pencil size={16}/></button>
                          <button className="btn btn-ghost p-1.5" onClick={()=>onDelete(p)}><Trash2 size={16}/></button>
                        </div>
                      </div>
                      {/* progress + meta */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs opacity-70">{openCount} offen · {doneCount} fertig</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs opacity-70">{pr}%</div>
                          <Donut value={pr} size={44} stroke={8} label="Fortschritt"/>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="progress"><span style={{width:`${pr}%`}}/></div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs opacity-80">
                        <div className="flex items-center gap-1">{nextDue ? (<><Calendar size={12}/> Nächste Fälligkeit: {fmtDate(nextDue)}</>) : "Keine Fälligkeit"}</div>
                        <button className="chip" onClick={()=>{
                          const next: Record<Status, Status> = {idea:"planning", planning:"active", active:"done", done:"done"};
                          onStatusChange(p, next[p.status]);
                        }}>weiter <ArrowRight size={12}/></button>
                      </div>

                      {/* quick milestones (first 3 open) */}
                      <div className="mt-2 border-t border-white/10 pt-2">
                        <div className="font-medium mb-1 text-sm">Meilensteine</div>
                        {ms.length===0 && <div className="text-sm opacity-70">Noch keine Meilensteine.</div>}
                        {ms.filter(m=>m.status!=='done').slice(0,3).map(m => (
                          <InlineMilestone key={m.id} m={m} onToggle={()=>onToggleMilestone(m)} onEdit={(t)=>onEditMilestone(m,t)} onDelete={()=>onDeleteMilestone(m)} />
                        ))}
                        <NewMilestone onAdd={(title, due)=>onCreateMilestone(p.id, title, due)} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({projects, miles, onEdit, onDelete, onStatusChange}:{
  projects: Project[]; miles: Milestone[];
  onEdit:(p:Project)=>void; onDelete:(p:Project)=>void; onStatusChange:(p:Project, s:Status)=>void;
}){
  return (
    <div className="mt-4 grid gap-2">
      {projects.length===0 && <div className="opacity-70 text-sm">Keine Projekte.</div>}
      {projects.map(p => {
        const pr = progressFor(p.id, miles);
        const nextDue = nextDueFor(p.id, miles);
        const ms = miles.filter(m=>m.projectId===p.id);
        const open = ms.filter(m=>m.status!=='done').length;
        return (
          <div key={p.id} className="card">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-lg font-semibold leading-tight">{p.name}</div>
                {p.description && <div className="text-sm opacity-75 mt-0.5">{p.description}</div>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select className="input h-8" value={p.status} onChange={e=>onStatusChange(p, e.target.value as Status)}>
                    <option value="idea">Idee</option><option value="planning">Planung</option><option value="active">Aktiv</option><option value="done">Fertig</option>
                  </select>
                  {p.tags?.map((t,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs border border-white/10">{t}</span>))}
                </div>
                <div className="mt-3">
                  <div className="progress"><span style={{width:`${pr}%`}}/></div>
                  <div className="text-xs opacity-70 mt-1">{pr}% · {open} offen · nächste Fälligkeit: {nextDue ? fmtDate(nextDue) : "—"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn btn-ghost p-2" onClick={()=>onEdit(p)}><Pencil size={18}/></button>
                <button className="btn btn-ghost p-2" onClick={()=>onDelete(p)}><Trash2 size={18}/></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
