import React from 'react';

type Props = {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
  fill?: boolean;
  ariaLabel?: string;
};

export default function Sparkline({data, width=160, height=46, className='', strokeWidth=2, fill=false, ariaLabel}:Props){
  if (!data || data.length===0) {
    return <svg width={width} height={height} role="img" aria-label={ariaLabel||'Keine Daten'}/>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const diff = (max - min) || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((v,i)=>{
    const x = i*stepX;
    const y = height - ((v - min) / diff) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const lastUp = data[data.length-1] >= data[0];
  const stroke = 'currentColor';
  const areaPath = `M0 ${height} L ${points} L ${width} ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={ariaLabel}>
      {fill && <path d={areaPath} opacity={0.12} fill={stroke} />}
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={0.9}/>
      <circle cx={width} cy={height - ((data[data.length-1]-min)/diff)*height} r={2.6} fill={stroke} opacity={0.9}/>
      {/* trend arrow */}
      <g transform={`translate(${width-10},6)`} opacity={0.7} aria-hidden="true">
        {lastUp
          ? <polygon points="0,6 5,0 10,6" fill={stroke} />
          : <polygon points="0,0 5,6 10,0" fill={stroke} />}
      </g>
    </svg>
  );
}
