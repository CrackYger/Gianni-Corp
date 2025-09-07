import React from 'react';

type Item = { label: string; value: number };
export default function MiniBar({items, maxBars=5}:{items: Item[]; maxBars?: number}){
  const data = (items||[]).slice(0, maxBars);
  const max = Math.max(1, ...data.map(d=>d.value));
  return (
    <div className="grid gap-2">
      {data.map((d,i)=> (
        <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="text-sm">{d.label}</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-white/80" style={{width:`${(d.value/max)*100}%`}}/>
            </div>
          </div>
          <div className="text-sm tabular-nums opacity-80">{new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR'}).format(d.value)}</div>
        </div>
      ))}
    </div>
  );
}
