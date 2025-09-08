import React, { useEffect, useMemo, useRef, useState } from 'react';
import Page from '@/components/Page';
import { usePrefs } from '@/store/usePrefs';
import { backupExport, backupDryRun, backupImport } from '@/libs/backup';
import { getStorageUsage } from '@/libs/storage';
import { checkForPWAUpdate } from '@/libs/pwa';
import { db } from '@/db/schema';
import { Sun, Moon, Monitor, HardDriveDownload, HardDriveUpload, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Settings(){
  const theme = usePrefs(s=>s.theme);
  const setTheme = usePrefs(s=>s.setTheme);
  const density = usePrefs(s=>s.density);
  const setDensity = usePrefs(s=>s.setDensity);

  const [usage, setUsage] = useState<{usage?:number; quota?:number}>({});
  const [counts, setCounts] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const [dryRun, setDryRun] = useState<any>(null);
  const [mode, setMode] = useState<'merge'|'replace'>('merge');
  const [msg, setMsg] = useState<string>('');

  useEffect(()=>{
    (async()=>{
      const c = {
        services: await db.services.count(),
        subscriptions: await db.subscriptions.count(),
        people: await db.people.count(),
        assignments: await db.assignments.count(),
        expenses: await db.expenses.count(),
        incomes: await db.incomes.count(),
        projects: await db.projects.count(),
        milestones: await db.milestones.count(),
        tasks: await db.tasks.count(),
      };
      setCounts(c);
      setUsage(await getStorageUsage());
    })();
  },[]);

  const onBackup = async ()=>{
    setBusy(true);
    try{
      const blob = await backupExport();
      const name = `giannicorp-backup_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      const nav: any = navigator;
      try {
        const file = new File([blob], name, {type:'application/json'});
        if (nav?.canShare && nav.share && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: name });
          return;
        }
      } catch {}
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
    } finally { setBusy(false); }
  };

  const onPick = ()=> pickRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setBusy(true); setMsg('');
    try{
      const info = await backupDryRun(file);
      setDryRun(info);
      if (!info.ok){ setMsg(info.error || 'Ungültiges Backup'); return; }
      const ok = confirm(mode==='replace' ? 'Bestehende Daten werden ERSETZT. Import starten?' : 'Daten werden zusammengeführt. Import starten?');
      if (ok){
        await backupImport(file, mode);
        setMsg('Import erfolgreich.');
        setDryRun(null);
        // refresh counts
        const c = {
          services: await db.services.count(),
          subscriptions: await db.subscriptions.count(),
          people: await db.people.count(),
          assignments: await db.assignments.count(),
          expenses: await db.expenses.count(),
          incomes: await db.incomes.count(),
          projects: await db.projects.count(),
          milestones: await db.milestones.count(),
          tasks: await db.tasks.count(),
        };
        setCounts(c);
      }
    } catch (err:any){
      alert(err?.message || String(err));
    } finally { setBusy(false); e.target.value=''; }
  };

  const onClear = async ()=>{
    if (!confirm('ALLE lokalen Daten löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    setBusy(true);
    try{
      await Promise.all([
        db.services.clear(),
        db.subscriptions.clear(),
        db.people.clear(),
        db.assignments.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.projects.clear(),
        db.milestones.clear(),
        db.tasks.clear(),
      ]);
      setMsg('Alle Daten gelöscht.');
      setCounts({ services:0, subscriptions:0, people:0, assignments:0, expenses:0, incomes:0, projects:0, milestones:0, tasks:0 });
    } finally { setBusy(false); }
  };

  const usageText = useMemo(()=>{
    const u = usage.usage ? Math.round((usage.usage/1024/1024)*10)/10 + ' MB' : '–';
    const q = usage.quota ? Math.round((usage.quota/1024/1024)*10)/10 + ' MB' : '–';
    return `${u} von ${q}`;
  }, [usage]);

  return (
    <Page title="Einstellungen" actions={<div/>}>
      <div className="grid md:grid-cols-2 gap-4">

        <section className="card">
          <div className="font-semibold mb-2">Backup & Wiederherstellung</div>
          <div className="text-sm opacity-80 mb-2">iPhone/iPad-sicher: Share Sheet oder Download; Import per Datei-Auswahl. Inklusive Integritätsprüfung (SHA‑256) & Schema-Validierung.</div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={onBackup}><HardDriveDownload size={16}/> Backup exportieren</button>
            <button className="btn" onClick={onPick}><HardDriveUpload size={16}/> Backup prüfen/importieren…</button>
            <input ref={pickRef} type="file" accept="application/json" className="hidden" onChange={onFile}/>
          </div>
          {dryRun && dryRun.ok && (
            <div className="mt-3">
              <div className="text-sm opacity-70">Version {dryRun.version} · Checksumme {dryRun.checksumOk? 'OK':'FEHLER'}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                {Object.keys(dryRun.countsFile).map((k)=> (
                  <div key={k} className="bg-white/5 rounded p-2">
                    <div className="opacity-60">{k}</div>
                    <div>{dryRun.countsFile[k]} Datei · {dryRun.countsDb[k]} lokal</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 seg">
                <button aria-pressed={mode==='merge'} onClick={()=>setMode('merge')}>Zusammenführen</button>
                <button aria-pressed={mode==='replace'} onClick={()=>setMode('replace')}>Ersetzen</button>
              </div>
            </div>
          )}
          {msg && <div className="mt-2 text-sm">{msg}</div>}
        </section>

        <section className="card">
          <div className="font-semibold mb-2">Darstellung</div>
          <div className="space-y-3">
            <div>
              <div className="text-sm opacity-80 mb-1">Theme</div>
              <div className="seg">
                <button aria-pressed={theme==='system'} onClick={()=>setTheme('system')}><Monitor size={16}/> System</button>
                <button aria-pressed={theme==='dark'} onClick={()=>setTheme('dark')}><Moon size={16}/> Dunkel</button>
                <button aria-pressed={theme==='light'} onClick={()=>setTheme('light')}><Sun size={16}/> Hell</button>
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80 mb-1">Dichte</div>
              <div className="seg">
                <button aria-pressed={density==='comfortable'} onClick={()=>setDensity('comfortable')}>Komfort</button>
                <button aria-pressed={density==='compact'} onClick={()=>setDensity('compact')}>Kompakt</button>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="font-semibold mb-2">System</div>
          <div className="space-y-2 text-sm">
            <div>Speicher: {usageText}</div>
            <button className="btn" onClick={async()=>{
              const updated = await checkForPWAUpdate();
              if (!updated) alert('Kein Update gefunden.');
            }}><RefreshCw size={16}/> Auf Update prüfen</button>
            <button className="btn btn-danger" onClick={onClear}><AlertTriangle size={16}/> Alle Daten löschen</button>
          </div>
        </section>

      </div>
      {busy && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50"><div className="card">Bitte warten…</div></div>}
    </Page>
  );
}
