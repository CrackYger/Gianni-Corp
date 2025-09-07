import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Page from "@/components/Page";
import Modal from "@/components/Modal";
import { CheckCircle2, Circle, Pencil, Trash2, Plus } from "lucide-react";
import { db as _db } from "@/db/schema";

// ---- Types ----
export type TaskStatus = "open" | "doing" | "review" | "done";
type TaskRec = {
  id: string;
  title: string;
  description?: string;
  priority?: 1 | 2 | 3; // 1=low,2=med,3=high
  tags?: string[];
  status: TaskStatus;
  projectId?: string;
  dueDate?: string; // yyyy-mm-dd
  createdAt?: string;
  updatedAt?: string;
};

// ---- LocalStorage fallback (for safety on iOS builds where DB might be unavailable) ----
const LS_KEY = "gc_tasks_v1";
const ls = {
  async all(): Promise<TaskRec[]> {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  async save(tasks: TaskRec[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  },
  async add(t: TaskRec) {
    const all = await ls.all();
    all.push(t);
    await ls.save(all);
  },
  async update(id: string, patch: Partial<TaskRec>) {
    const all = await ls.all();
    const i = all.findIndex(x => x.id === id);
    if (i >= 0) {
      all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
      await ls.save(all);
    }
  },
  async remove(id: string) {
    const all = await ls.all();
    await ls.save(all.filter(x => x.id !== id));
  }
};

// Prefer Dexie DB if available, otherwise fallback to LS
const db = (() => {
  try {
    // @ts-ignore
    if (_db && _db.tasks && typeof _db.tasks.toArray === "function") {
      return _db;
    }
  } catch {}
  return null as any;
})();

async function dbAll(): Promise<TaskRec[]> {
  if (db) {
    try {
      const rows = await db.tasks.toArray();
      // normalize keys
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title ?? "Ohne Titel",
        description: r.description ?? "",
        priority: (r.priority ?? 2) as 1|2|3,
        tags: Array.isArray(r.tags) ? r.tags : [],
        status: (r.status ?? "open") as TaskStatus,
        projectId: r.projectId,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (e) {
      console.warn("DB read failed, using localStorage fallback", e);
      return ls.all();
    }
  }
  return ls.all();
}
async function dbAdd(t: TaskRec) {
  if (db) {
    try { await db.tasks.add(t); return; } catch {}
  }
  await ls.add(t);
}
async function dbUpdate(id: string, patch: Partial<TaskRec>) {
  if (db) {
    try { await db.tasks.update(id, patch); return; } catch {}
  }
  await ls.update(id, patch);
}
async function dbRemove(id: string) {
  if (db) {
    try { await db.tasks.delete(id); return; } catch {}
  }
  await ls.remove(id);
}

// ---- UI helpers ----
const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Offen",
  doing: "In Arbeit",
  review: "Review",
  done: "Erledigt"
};

function byStatusOrder(a: TaskRec, b: TaskRec) {
  const order: Record<TaskStatus, number> = { open: 0, doing: 1, review: 2, done: 3 };
  const d = order[a.status] - order[b.status];
  if (d !== 0) return d;
  // then by due date, then by priority desc, then by updatedAt desc
  const ad = a.dueDate || "";
  const bd = b.dueDate || "";
  if (ad !== bd) return ad.localeCompare(bd);
  const ap = a.priority ?? 2, bp = b.priority ?? 2;
  if (ap !== bp) return bp - ap;
  return (b.updatedAt || "").localeCompare(a.updatedAt || "");
}

// ---- Task Editor Modal ----
function TaskEditor({initial, onClose, onSaved}:{initial?:Partial<TaskRec>, onClose:()=>void, onSaved:(t:TaskRec)=>void}){
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<TaskRec["priority"]>((initial?.priority as any) ?? 2);
  const [status, setStatus] = useState<TaskStatus>((initial?.status as TaskStatus) ?? "open");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

  const save = async () => {
    if (!title.trim()) return;
    if (initial?.id) {
      const patch = { title, description, priority, status, dueDate, updatedAt: new Date().toISOString() };
      await dbUpdate(initial.id as string, patch);
      onSaved({ ...(initial as TaskRec), ...(patch as any) });
    } else {
      const now = new Date().toISOString();
      const t: TaskRec = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        priority: (priority ?? 2) as 1|2|3,
        tags: [],
        status,
        dueDate: dueDate || undefined,
        createdAt: now,
        updatedAt: now
      };
      await dbAdd(t);
      onSaved(t);
    }
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <div className="text-lg font-semibold mb-3">{initial?.id ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</div>
        <div className="grid gap-3">
          <div>
            <label className="text-sm">Titel</label>
            <input className="input mt-1 w-full" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Was steht an?" />
          </div>
          <div>
            <label className="text-sm">Beschreibung</label>
            <textarea className="input mt-1 w-full min-h-[90px]" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Details…"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Fällig bis</label>
              <input type="date" className="input mt-1 w-full" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Priorität</label>
              <select className="input mt-1 w-full" value={priority as any} onChange={e=>setPriority(Number(e.target.value) as any)}>
                <option value={1}>Niedrig</option>
                <option value={2}>Mittel</option>
                <option value={3}>Hoch</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm">Status</label>
            <select className="input mt-1 w-full" value={status} onChange={e=>setStatus(e.target.value as TaskStatus)}>
              <option value="open">Offen</option>
              <option value="doing">In Arbeit</option>
              <option value="review">Review</option>
              <option value="done">Erledigt</option>
            </select>
          </div>
          <div className="text-right">
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn ml-2" onClick={save}>Speichern</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---- Row ----
function TaskRow({t, onToggle, onEdit, onDelete}:{t:TaskRec; onToggle:()=>void; onEdit:()=>void; onDelete:()=>void}){
  const isDone = t.status === "done";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={"border rounded-2xl p-3 md:p-4 mb-2 bg-white/5 border-white/10 " + (isDone ? "opacity-70" : "")}
    >
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="shrink-0 rounded-full p-1 border border-white/10">
          {isDone ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
        </button>
        <div className="flex-1">
          <div className="font-medium leading-tight">{t.title}</div>
          {(t.description || t.dueDate) && (
            <div className="text-sm opacity-75 mt-0.5">
              {t.description && <span>{t.description}</span>}{t.description && t.dueDate && " · "}
              {t.dueDate && <span>Fällig: {new Date(t.dueDate).toLocaleDateString()}</span>}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2">
            {/* priority dots */}
            <div aria-label="Priorität" className="flex items-center gap-1">
              {[1,2,3].map(n=>(
                <span key={n} className={"inline-block w-1.5 h-1.5 rounded-full " + ((t.priority ?? 2) >= n ? "bg-white/80" : "bg-white/20")} />
              ))}
            </div>
            {Array.isArray(t.tags) && t.tags.length>0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.tags!.map((tag, i)=> (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs border border-white/10">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost p-2" onClick={onEdit} aria-label="Bearbeiten"><Pencil size={18}/></button>
          <button className="btn btn-ghost p-2" onClick={onDelete} aria-label="Löschen"><Trash2 size={18}/></button>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main Page ----
export default function Tasks(){
  const [tasks, setTasks] = useState<TaskRec[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [editor, setEditor] = useState<null | {initial?:TaskRec}>(null);

  useEffect(()=>{
    (async ()=>{
      const rows = await dbAll();
      setTasks(rows.sort(byStatusOrder));
    })();
  }, []);

  const filtered = useMemo(()=>{
    const list = filter==="all" ? tasks : tasks.filter(t=>t.status===filter);
    return list.sort(byStatusOrder);
  }, [tasks, filter]);

  const create = ()=> setEditor({});
  const edit = (t:TaskRec)=> setEditor({ initial: t });

  const toggleDone = async (t:TaskRec)=>{
    const status: TaskStatus = t.status === "done" ? "open" : "done";
    await dbUpdate(t.id, { status, updatedAt: new Date().toISOString() });
    setTasks(prev => prev.map(x=> x.id===t.id ? { ...x, status } : x).sort(byStatusOrder));
  };

  const remove = async (t:TaskRec)=>{
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await dbRemove(t.id);
    setTasks(prev => prev.filter(x=>x.id!==t.id));
  };

  return (
    <Page
      title="Aufgaben"
      actions={
        <button className="btn" onClick={create}><Plus size={16} className="mr-1.5"/>Neue Aufgabe</button>
      }
    >
      {/* Filter Tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {(["all","open","doing","review","done"] as const).map(s => (
          <button
            key={s}
            onClick={()=>setFilter(s as any)}
            className={"chip " + (filter===s ? "chip-active" : "")}
          >
            {s==="all" ? "Alle" : STATUS_LABEL[s as TaskStatus]}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence initial={false}>
        {filtered.length === 0 && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="opacity-70 text-sm">
            Keine Aufgaben. Lege oben eine neue Aufgabe an.
          </motion.div>
        )}
        {filtered.map(t => (
          <TaskRow
            key={t.id}
            t={t}
            onToggle={()=>toggleDone(t)}
            onEdit={()=>edit(t)}
            onDelete={()=>remove(t)}
          />
        ))}
      </AnimatePresence>

      {/* Editor */}
      {editor && (
        <TaskEditor
          initial={editor.initial}
          onClose={()=>setEditor(null)}
          onSaved={(t)=>{
            setTasks(prev => {
              const exists = prev.some(x=>x.id===t.id);
              const next = exists ? prev.map(x=> x.id===t.id ? t : x) : [t, ...prev];
              return next.sort(byStatusOrder);
            });
          }}
        />
      )}
    </Page>
  );
}
