import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "@/components/Page";
import { backupJSON, restoreJSON, downloadJSON } from "@/libs/io";
import { db as _db } from "@/db/schema";
import { Capacitor } from "@capacitor/core";
import {
  Sun, Moon, Monitor, Download, Upload, Trash2, Palette, Smartphone, Database,
  Settings2
} from "lucide-react";

type Theme = "system"|"dark"|"light";
type Density = "comfortable"|"compact";
type Prefs = {
  theme: Theme;
  density: Density;
  reduceMotion: boolean;
  showA2HS: boolean;
  accent?: string;
};

const PREF_KEY = "gc_prefs_v1";
const LS_TASKS = "gc_tasks_v1";
const LS_PROJECTS = "gc_projects_v1";
const LS_MILESTONES = "gc_milestones_v1";

const defaultPrefs: Prefs = { theme:"system", density:"comfortable", reduceMotion:false, showA2HS:true };

function loadPrefs(): Prefs {
  try { return { ...defaultPrefs, ...(JSON.parse(localStorage.getItem(PREF_KEY)||"{}") as Prefs) }; }
  catch { return defaultPrefs; }
}
function savePrefs(p: Prefs){ localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

function applyPrefs(p: Prefs){
  const root = document.documentElement;
  if (p.theme==="system"){
    root.dataset.theme = "";
    root.style.colorScheme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  } else {
    root.dataset.theme = p.theme;
    root.style.colorScheme = p.theme;
  }
  root.dataset.density = p.density;
  root.dataset.reduceMotion = p.reduceMotion ? "1" : "0";
  if (p.accent) root.style.setProperty("--accent", p.accent);
}

const db = (()=>{ try { return _db; } catch { return null as any; } })();

export default function Settings(){
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs());
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ applyPrefs(prefs); savePrefs(prefs); }, [prefs]);
  useEffect(()=>{ (async ()=> setCounts(await fetchCounts()))(); }, []);

  async function fetchCounts(){
    const map: Record<string, number> = {};
    try {
      if (db){
        map.services      = await db.services.count();
        map.subscriptions = await db.subscriptions.count();
        map.people        = await db.people.count();
        map.assignments   = await db.assignments.count();
        map.expenses      = await db.expenses.count();
        map.incomes       = await db.incomes.count();
        map.projects      = await db.projects.count();
        map.milestones    = await db.milestones.count();
        map.tasks         = await db.tasks.count();
      }
    } catch {}
    try { map.tasks      = map.tasks ?? (JSON.parse(localStorage.getItem(LS_TASKS)||"[]").length); } catch {}
    try { map.projects   = map.projects ?? (JSON.parse(localStorage.getItem(LS_PROJECTS)||"[]").length); } catch {}
    try { map.milestones = map.milestones ?? (JSON.parse(localStorage.getItem(LS_MILESTONES)||"[]").length); } catch {}
    return map;
  }

  const onExport = async ()=>{
    setBusy(true);
    try {
      if (typeof (backupJSON as any) === "function"){
        await (backupJSON as any)("giannicorp-backup");
      } else {
        const data = await buildSnapshot();
        downloadJSON("giannicorp-backup.json", data);
      }
    } finally { setBusy(false); }
  };

  const onImportPick = ()=> fileRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    if(!confirm("Aktuelle Daten werden ersetzt. Fortfahren?")) return;
    setBusy(true);
    try {
      await restoreJSON(file as any);
      alert("Import abgeschlossen.");
      setCounts(await fetchCounts());
    } catch (err: any){
      alert(err?.message || "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const onReset = async ()=>{
    if (!confirm("Wirklich ALLE Daten löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.")) return;
    setBusy(true);
    try {
      if (db?.delete) { await db.delete(); }
      localStorage.removeItem(LS_TASKS);
      localStorage.removeItem(LS_PROJECTS);
      localStorage.removeItem(LS_MILESTONES);
    } finally {
      setBusy(false);
      location.reload();
    }
  };

  async function buildSnapshot(){
    const snap: any = { meta: { at: new Date().toISOString(), from: "settings-premium" } };
    try {
      if (db){
        snap.services      = await db.services.toArray();
        snap.subscriptions = await db.subscriptions.toArray();
        snap.people        = await db.people.toArray();
        snap.assignments   = await db.assignments.toArray();
        snap.expenses      = await db.expenses.toArray();
        snap.incomes       = await db.incomes.toArray();
        snap.projects      = await db.projects.toArray();
        snap.milestones    = await db.milestones.toArray();
        snap.tasks         = await db.tasks.toArray();
      }
    } catch {}
    try { if (!snap.tasks)      snap.tasks = JSON.parse(localStorage.getItem(LS_TASKS)||"[]"); } catch {}
    try { if (!snap.projects)   snap.projects = JSON.parse(localStorage.getItem(LS_PROJECTS)||"[]"); } catch {}
    try { if (!snap.milestones) snap.milestones = JSON.parse(localStorage.getItem(LS_MILESTONES)||"[]"); } catch {}
    return snap;
  }

  const onTestHaptics = async ()=>{
    try {
      // Optional native plugin if present (won't break bundling)
      const H: any = (window as any).Capacitor?.Plugins?.Haptics || (window as any).Haptics;
      if (H?.impact) {
        await H.impact({ style: "Light" });
        return;
      }
    } catch {}
    // Web fallback
    if ("vibrate" in navigator && typeof (navigator as any).vibrate === "function") {
      (navigator as any).vibrate(30);
      alert("Vibration ausgelöst (Web-Fallback).");
    } else {
      alert("Haptics nicht verfügbar.");
    }
  };

  return (
    <Page title="Einstellungen">
      <section className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold">Darstellung</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm opacity-70 mb-1">Theme</div>
            <div className="seg">
              <button aria-pressed={prefs.theme==='system'} onClick={()=>setPrefs({...prefs, theme:'system'})}>System</button>
              <button aria-pressed={prefs.theme==='dark'} onClick={()=>setPrefs({...prefs, theme:'dark'})}>Dunkel</button>
              <button aria-pressed={prefs.theme==='light'} onClick={()=>setPrefs({...prefs, theme:'light'})}>Hell</button>
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70 mb-1">Dichte</div>
            <div className="seg">
              <button aria-pressed={prefs.density==='comfortable'} onClick={()=>setPrefs({...prefs, density:'comfortable'})}>Komfort</button>
              <button aria-pressed={prefs.density==='compact'} onClick={()=>setPrefs({...prefs, density:'compact'})}>Kompakt</button>
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70 mb-1">Bewegung reduzieren</div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="checkbox" checked={prefs.reduceMotion}
                     onChange={e=>setPrefs({...prefs, reduceMotion: e.target.checked})}/>
              <span className="text-sm opacity-80">{prefs.reduceMotion? "An" : "Aus"}</span>
            </label>
          </div>
          <div>
            <div className="text-sm opacity-70 mb-1">Akzentfarbe</div>
            <input type="color" className="input w-24 h-10 p-1" value={prefs.accent || "#4DA3FF"}
                   onChange={e=>setPrefs({...prefs, accent: e.target.value})}/>
          </div>
        </div>
      </section>

      <section className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Haptik testen</div>
            <div className="text-sm opacity-70">Nutzt native Haptics, wenn vorhanden – sonst Web-Vibration.</div>
          </div>
          <button className="btn btn-ghost" onClick={onTestHaptics}>Test</button>
        </div>
      </section>

      <section className="card mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold">Daten</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div><div className="font-medium">Backup erstellen</div><div className="text-sm opacity-70">Alle Tabellen als JSON exportieren.</div></div>
            <button className="btn" onClick={onExport} disabled={busy}>Export</button>
          </div>
          <div className="flex items-center justify-between">
            <div><div className="font-medium">Backup wiederherstellen</div><div className="text-sm opacity-70">JSON-Datei importieren und Daten ersetzen.</div></div>
            <div>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile}/>
              <button className="btn btn-ghost" onClick={onImportPick} disabled={busy}>Import</button>
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
          <div>
            <div className="font-medium text-red-300">Danger Zone</div>
            <div className="text-sm opacity-70">Alle Daten löschen und App neu starten.</div>
          </div>
          <button className="btn btn-danger" onClick={onReset} disabled={busy}>Zurücksetzen</button>
        </div>
      </section>

      <section className="card mt-4">
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between"><span className="opacity-70">Plattform</span><span>{Capacitor.getPlatform()}</span></div>
          <div className="flex items-center justify-between"><span className="opacity-70">Standalone</span><span>{(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone ? "Ja" : "Nein"}</span></div>
        </div>
      </section>
    </Page>
  );
}
