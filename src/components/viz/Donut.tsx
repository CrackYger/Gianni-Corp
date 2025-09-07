import React from 'react';

export default function Donut({value, size=120, stroke=12, label=''}:{value:number; size?:number; stroke?:number; label?:string}){
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(value||0)));
  const dash = (pct/100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeOpacity={0.18} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c-dash}`} strokeLinecap="round"/>
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={Math.max(14, size*0.2)} fill="currentColor" opacity={0.9}>
        {pct}%
      </text>
    </svg>
  );
}
