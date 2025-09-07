
export default function StatCard({label, value, hint, pct}:{label:string; value:string|number; hint?:string; pct?:number}){
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div className="card">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {typeof pct === 'number' && (
        <div className="mt-2">
          <div className="progress"><span style={{width:`${p}%`}}/></div>
          <div className="text-xs opacity-60 mt-1">{p}%</div>
        </div>
      )}
      {hint && <div className="text-xs opacity-60 mt-2">{hint}</div>}
    </div>
  );
}
