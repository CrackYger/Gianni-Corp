import React, { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { db, Service, Subscription, Assignment, Income, Expense } from '@/db/schema';
import { ensureSeed } from '@/db/seed';

/** ---------- tiny visual components (no extra deps) ---------- */
function Euro(n:number){ return new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}).format(n||0); }

function Donut({value, size=120, stroke=12, label}:{value:number; size?:number; stroke?:number; label?:string}){
  const pct = Math.max(0, Math.min(100, Math.round(value||0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct/100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c-dash}`} strokeLinecap="round"/>
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={Math.round(size/5)}>{pct}%</text>
    </svg>
  );
}

function LineChart({labels, series, height=160}:{labels:string[]; series:{name:string; values:number[]}[]; height?:number}){
  const width = 560;
  const pad = 24;
  const max = Math.max(1, ...series.flatMap(s=> s.values));
  const min = Math.min(0, ...series.flatMap(s=> s.values));
  const scaleX = (i:number)=> pad + (i*(width-2*pad)/(Math.max(1, labels.length-1)));
  const scaleY = (v:number)=> {
    const h = height - 2*pad;
    const range = max - min || 1;
    return pad + (h - ( (v-min) / range ) * h);
  };
  function pathFor(vals:number[]){
    return vals.map((v,i)=> `${i===0?'M':'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  }
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img">
      {/* y=0 axis */}
      <line x1={pad} x2={width-pad} y1={scaleY(0)} y2={scaleY(0)} stroke="currentColor" opacity="0.15"/>
      {series.map((s,idx)=> (
        <path key={s.name} d={pathFor(s.values)} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5 + idx*0.2}/>
      ))}
      {/* labels (last) */}
      <text x={width-pad} y={height-6} textAnchor="end" fontSize="10">{labels[labels.length-1]}</text>
    </svg>
  );
}

function BarChart({labels, values, height=160}:{labels:string[]; values:number[]; height?:number}){
  const width = 560; const pad = 24;
  const max = Math.max(1, ...values);
  const bw = (width - 2*pad) / Math.max(values.length,1);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img">
      {values.map((v,i)=>{
        const h = (v/max) * (height-2*pad);
        const x = pad + i*bw + 2;
        const y = height - pad - h;
        return <rect key={i} x={x} y={y} width={Math.max(2, bw-4)} height={h} fill="currentColor" opacity="0.35"/>;
      })}
      <text x={width-pad} y={height-6} textAnchor="end" fontSize="10">{labels[labels.length-1]}</text>
    </svg>
  );
}

/** ---------- helpers ---------- */
const monthKey = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const lastNMonths = (n:number)=> {
  const arr:string[]=[]; const now=new Date();
  for(let i=n-1;i>=0;i--){ const d=new Date(now.getFullYear(), now.getMonth()-i, 1); arr.push(monthKey(d)); }
  return arr;
};

export default function Dashboard(){
  const [services, setServices] = useState<Service[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [range, setRange] = useState<'30d'|'mtd'|'90d'>('mtd');

  useEffect(()=>{ (async()=>{
    await ensureSeed();
    setServices(await db.services.toArray());
    setSubs(await db.subscriptions.toArray());
    setAssigns(await db.assignments.toArray());
    setIncomes(await db.incomes.toArray().catch(()=>[]));
    setExpenses(await db.expenses.toArray().catch(()=>[]));
  })(); }, []);

  // FALLBACK monthly estimates if no transactions exist
  const estMonthlyIncome = useMemo(()=> assigns.filter(a=>a.status==='active').reduce((s,a)=> s+(a.pricePerMonth||0), 0), [assigns]);
  const estMonthlyExpense = useMemo(()=> {
    const byServiceActiveSubs: Record<string, number> = {};
    for(const s of subs.filter(s=>s.status==='active')){
      byServiceActiveSubs[s.serviceId] = (byServiceActiveSubs[s.serviceId]||0) + 1;
    }
    let sum=0;
    for(const id in byServiceActiveSubs){
      const svc = services.find(s=>s.id===id);
      sum += (svc?.baseCostPerMonth||0) * byServiceActiveSubs[id];
    }
    return sum;
  }, [services, subs]);

  // timeline (12 months)
  const series12 = useMemo(()=>{
    const labels = lastNMonths(12);
    const sumByMonth = (rows: {date:string; amount:number}[]) => {
      const m:Record<string, number> = {}; for(const r of rows){ const k = monthKey(new Date(r.date)); m[k]=(m[k]||0)+(+r.amount||0); }
      return labels.map(k=> +(m[k]||0).toFixed(2));
    };
    const incVals = incomes.length ? sumByMonth(incomes as any) : labels.map(()=> estMonthlyIncome);
    const expVals = expenses.length ? sumByMonth(expenses as any) : labels.map(()=> estMonthlyExpense);
    const netVals = incVals.map((v,i)=> +(v - expVals[i]).toFixed(2));
    return { labels, incVals, expVals, netVals };
  }, [incomes, expenses, estMonthlyIncome, estMonthlyExpense]);

  // current period sums
  const now = new Date();
  const start30d = new Date(now); start30d.setDate(now.getDate()-30);
  const start90d = new Date(now); start90d.setDate(now.getDate()-90);
  const startMTD = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = range==='30d'? start30d : range==='90d'? start90d : startMTD;
  const sumFrom = (rows:{date:string; amount:number}[]) => rows.filter(r=> new Date(r.date)>=from).reduce((s,r)=> s+(+r.amount||0), 0);
  const inSum = incomes.length ? sumFrom(incomes as any) : (estMonthlyIncome * (range==='mtd'?1:range==='30d'?1:3));
  const exSum = expenses.length ? sumFrom(expenses as any) : (estMonthlyExpense * (range==='mtd'?1:range==='30d'?1:3));
  const netSum = +(inSum - exSum).toFixed(2);

  // utilization (active used / total slots)
  const totalSlots = useMemo(()=> subs.filter(s=>s.status==='active').reduce((a,s)=> a + (s.currentSlots||0), 0), [subs]);
  const usedSlots = useMemo(()=> assigns.filter(a=> a.status==='active').length, [assigns]);
  const utilPct = totalSlots>0 ? Math.round((usedSlots/totalSlots)*100) : 0;

  // top 5 services by monthly net (estimate)
  const topNet = useMemo(()=>{
    const map: Record<string, {name:string; net:number}> = {};
    for(const svc of services){ map[svc.id] = {name: svc.name, net: 0}; }
    for(const a of assigns.filter(a=>a.status==='active')){
      const sub = subs.find(s=> s.id===a.subscriptionId && s.status==='active'); if(!sub) continue;
      const cost = (services.find(s=>s.id===sub.serviceId)?.baseCostPerMonth || 0) / Math.max(1, subs.filter(s=> s.serviceId===sub.serviceId && s.status==='active').length);
      const net = (a.pricePerMonth||0) - cost;
      map[sub.serviceId].net += net;
    }
    const arr = Object.values(map).sort((a,b)=> b.net - a.net).slice(0,5);
    return { labels: arr.map(x=> x.name), values: arr.map(x=> +x.net.toFixed(2)) };
  }, [services, subs, assigns]);

  // payment mix from incomes
  const payMix = useMemo(()=>{
    const mix:Record<string, number> = {};
    for(const i of incomes){ const k = (i as any).paidVia || 'unbekannt'; mix[k] = (mix[k]||0) + (+i.amount||0); }
    const total = Object.values(mix).reduce((a,b)=> a+b, 0) || 1;
    return Object.entries(mix).map(([k,v])=> ({ label: k, pct: Math.round((v/total)*100) }));
  }, [incomes]);

  return (
    <Page title="Dashboard" actions={
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Zeitraum">
          <button aria-pressed={range==='mtd'} onClick={()=>setRange('mtd')}>Monat</button>
          <button aria-pressed={range==='30d'} onClick={()=>setRange('30d')}>30 Tage</button>
          <button aria-pressed={range==='90d'} onClick={()=>setRange('90d')}>90 Tage</button>
        </div>
      </div>
    }>
      {/* KPI row */}
      <div className="grid md:grid-cols-4 gap-3 mb-3">
        <div className="card">
          <div className="text-sm opacity-70">Einnahmen ({range})</div>
          <div className="text-3xl font-semibold mt-1">{Euro(inSum)}</div>
          <div className="mt-2 text-xs opacity-60">Schätzung, wenn keine Incomes erfasst sind.</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Ausgaben ({range})</div>
          <div className="text-3xl font-semibold mt-1">{Euro(exSum)}</div>
          <div className="mt-2 text-xs opacity-60">Basis: Service-Kosten × aktive Subscriptions.</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">Netto ({range})</div>
          <div className="text-3xl font-semibold mt-1">{Euro(netSum)}</div>
          <div className="mt-2 text-xs opacity-60">{netSum>=0? 'positiv':'negativ'}</div>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">Auslastung</div>
            <div className="text-3xl font-semibold mt-1">{utilPct}%</div>
            <div className="text-xs opacity-60 mt-2">{usedSlots}/{totalSlots} Slots belegt</div>
          </div>
          <Donut value={utilPct} size={100} stroke={12} label="Auslastung"/>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="card">
          <div className="mb-2">
            <div className="font-semibold">12 Monate · Einnahmen / Ausgaben / Netto</div>
            <div className="text-xs opacity-70">Schätzungen, falls keine Buchungen vorhanden.</div>
          </div>
          <LineChart
            labels={series12.labels}
            series={[
              {name:'Einnahmen', values: series12.incVals},
              {name:'Ausgaben', values: series12.expVals},
              {name:'Netto', values: series12.netVals},
            ]}
          />
        </div>

        <div className="card">
          <div className="mb-2">
            <div className="font-semibold">Top 5 Services nach Netto/Monat (Schätzung)</div>
            <div className="text-xs opacity-70">Preis der Zuweisungen minus anteilige Kosten.</div>
          </div>
          <BarChart labels={topNet.labels} values={topNet.values} />
        </div>

        <div className="card">
          <div className="mb-2">
            <div className="font-semibold">Zahlungsmix</div>
            <div className="text-xs opacity-70">Verteilung aus erfassten Einnahmen</div>
          </div>
          <div className="flex gap-6 items-center">
            <Donut value={payMix.reduce((s,x)=> s + x.pct, 0) || 0} size={110} stroke={12} label="Mix"/>
            <div className="grid gap-1 text-sm">
              {payMix.length===0 && <div className="opacity-60">Noch keine Einnahmen erfasst.</div>}
              {payMix.map(x=> <div key={x.label}><span className="chip mr-2">{x.pct}%</span> {x.label}</div>)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-2">
            <div className="font-semibold">Netto (12 Monate)</div>
            <div className="text-xs opacity-70">Balken: Netto pro Monat</div>
          </div>
          <BarChart labels={series12.labels} values={series12.netVals} />
        </div>
      </div>
    </Page>
  );
}
