
import { backupJSON, restoreJSON } from '@/libs/io';
import { useRef, useState } from 'react';

export default function Settings(){
  const fileRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const onPick = ()=> fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    if(!confirm('Aktuelle Daten werden ersetzt. Fortfahren?')) return;
    setRestoring(true);
    await restoreJSON(file);
    setRestoring(false);
    location.reload();
  };
  return (
    <div className="grid gap-4">
      <div className="text-xl font-semibold">Einstellungen</div>
      <div className="card grid gap-3">
        <div className="font-semibold">Backup & Restore</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={backupJSON}>Backup als JSON</button>
          <button className="btn" onClick={onPick}>Backup einspielen</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFile} />
        </div>
        {restoring && <div className="text-sm opacity-80">Wiederherstellung läuft…</div>}
        <div className="text-xs opacity-70">Hinweis: Das Backup enthält Services, Subscriptions, Personen, Assignments, Einnahmen, Ausgaben, Projekte, Milestones und Tasks.
        </div>
        <div className="card grid gap-3">
          <div className="font-semibold">Darstellung</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Bewegung reduzieren</div>
              <div className="text-sm opacity-70">Weniger Animationen für ruhigere UI</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input id="reduce-motion" type="checkbox" className="sr-only peer" onChange={(e)=>{
                document.documentElement.style.setProperty('--prefers-reduced', e.target.checked? '1':'0');
              }}/>
              <div className="w-11 h-6 bg-white/20 peer-checked:bg-gc-accent rounded-full relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-5 transition-all"></div>
            </label>
          </div>
        </div>
      </div>
    
    </div>
  );
}
