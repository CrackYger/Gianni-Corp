
import { useEffect, useState } from 'react';
import { isIOS, isStandalone } from '@/libs/platform';

export default function A2HSTip(){
  const [show, setShow] = useState(false);
  useEffect(()=>{
    const key='a2hs_tip_dismissed_v1';
    if(localStorage.getItem(key)==='1') return;
    if(isIOS() && !isStandalone()){
      setTimeout(()=> setShow(true), 1000);
    }
    const onHide = ()=> setShow(false);
    window.addEventListener('appinstalled', onHide);
    return ()=> window.removeEventListener('appinstalled', onHide);
  },[]);
  if(!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-2xl shadow-lg safe-b">
      <div className="text-sm font-medium">Zum Home-Bildschirm hinzufügen</div>
      <div className="text-xs opacity-80">Teilen ▸ <b>Zum Home-Bildschirm</b> tippen, um die App wie eine native App zu nutzen (Vollbild & offline).</div>
      <div className="text-right mt-2">
        <button className="btn px-3 py-1 text-sm" onClick={()=>{localStorage.setItem('a2hs_tip_dismissed_v1','1'); (window as any).dispatchEvent(new Event('hide-a2hs'));}}>Ok</button>
      </div>
    </div>
  );
}
