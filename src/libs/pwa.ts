
export async function checkForPWAUpdate(): Promise<boolean>{
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  return new Promise<boolean>((resolve)=>{
    let settled = false;
    const done = (v:boolean)=>{ if (!settled){ settled=true; resolve(v);} };
    if (reg.waiting){
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(()=>location.reload(), 200);
      return done(true);
    }
    reg.addEventListener('updatefound', ()=>{
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', ()=>{
        if (sw.state === 'installed'){
          if (reg.waiting){
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(()=>location.reload(), 200);
            done(true);
          }
        }
      });
    });
    reg.update().catch(()=>{});
    // fallback if nothing found
    setTimeout(()=>done(false), 2500);
  });
}

export async function clearAllCaches(){
  if ('caches' in window){
    const keys = await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
  }
}
