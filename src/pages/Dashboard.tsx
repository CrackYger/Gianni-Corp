import React, { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { db } from '@/db/schema';
import Sparkline from '@/components/viz/Sparkline';
import MiniBar from '@/components/viz/MiniBar';
import Donut from '@/components/viz/Donut';

type Series = { labels: string[]; income: number[]; expense: number[]; net: number[] };

function monthKey(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function lastNMonths(n: number){
  const arr: string[] = [];
  const now = new Date();
  for (let i=n-1; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    arr.push(monthKey(d));
  }
  return arr;
}

async function buildSeries(n=6): Promise<Series>{
  const labels = lastNMonths(n);
  const incomes = await db.incomes.toArray().catch(()=>[] as any[]);
  const expenses = await db.expenses.toArray().catch(()=>[] as any[]);
  const byMonth = (xs:any[], sign=1) => {
    const map = new Map(labels.map(l=>[l,0]));
    for (const x of xs){
      if (!x?.date) continue;
      const key = x.date.slice(0,7);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + (x.amount*sign));
    }
    return labels.map(l=> +(map.get(l)||0));
  };
  const income = byMonth(incomes, +1);
  const expense = byMonth(expenses, +1);
  const net = income.map((v,i)=> +(v - (expense[i]||0)).toFixed(2));
  return { labels, income, expense, net };
}

async function topExpenses(days=30, limit=5){
  const since = new Date(); since.setDate(since.getDate()-days);
  const sinceISO = since.toISOString().slice(0,10);
  const es = await db.expenses.where('date').aboveOrEqual(sinceISO).toArray().catch(()=>[] as any[]);
  const services = await db.services.toArray().catch(()=>[] as any[]);
  const serviceName = (id?:string)=> services.find(s=>s.id===id)?.name || 'Sonstiges';
  const sums: Record<string, number> = {};
  for (const e of es){
    const label = serviceName(e.serviceId);
    sums[label] = (sums[label]||0) + (e.amount||0);
  }
  return Object.entries(sums).map(([label,value])=>({label, value})).sort((a,b)=>b.value-a.value).slice(0,limit);
}

async function kpis(){
  const [services, subs, assigns, incomes, expenses, tasks, projects, miles] = await Promise.all([
    db.services.toArray(), db.subscriptions.toArray(), db.assignments.toArray(),
    db.incomes.toArray(), db.expenses.toArray(), db.tasks.toArray(), db.projects.toArray(), db.milestones.toArray()
  ]).catch(()=>[[],[],[],[],[],[],[],[]] as any);
  const activeServices = services.filter((s:any)=>s.active).length;
  const activeSubs = subs.filter((s:any)=>s.status==='active');
  const maxSlots = activeSubs.reduce((a:any,s:any)=>a+s.currentSlots, 0);
  const activeAssigns = assigns.filter((a:any)=>a.status==='active');
  const freeSlots = Math.max(0, maxSlots - activeAssigns.length);
  const utilization = maxSlots? Math.round((activeAssigns.length/maxSlots)*100):0;
  const mrr = activeAssigns.reduce((a:any,s:any)=>a+(s.pricePerMonth||0),0);
  const ym = new Date().toISOString().slice(0,7);
  const inMonth = incomes.filter((i:any)=>i.date?.startsWith(ym)).reduce((a:number,b:any)=>a+(b.amount||0),0);
  const outMonth= expenses.filter((e:any)=>e.date?.startsWith(ym)).reduce((a:number,b:any)=>a+(b.amount||0),0);
  const netMonth = +(inMonth - outMonth).toFixed(2);
  const tasksOpen = tasks.filter((t:any)=>t.status!=='done').length;

  const activeProjects = projects.filter((p:any)=>p.status==='planning' || p.status==='active').length;
  const soon = new Date(); soon.setDate(soon.getDate()+7); const soonISO = soon.toISOString().slice(0,10);
  const milesOpen = miles.filter((m:any)=>m.status!=='done');
  const dueSoon = milesOpen.filter((m:any)=> m.due && m.due <= soonISO).length;
  const byProject = new Map<string, {done:number; total:number}>();
  for (const m of miles){
    const bucket = byProject.get(m.projectId) || {done:0,total:0};
    bucket.total++; if (m.status==='done') bucket.done++;
    byProject.set(m.projectId, bucket);
  }
  let avgProgress = 0; let count = 0;
  byProject.forEach(v=>{ if(v.total>0){ avgProgress += (v.done/v.total); count++; } });
  avgProgress = count? Math.round((avgProgress/count)*100) : 0;

  return { activeServices, freeSlots, utilization, mrr:+mrr.toFixed(2), netMonth, tasksOpen, activeProjects, dueSoon, avgProgress };
}

function Euro(n:number){ return new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}).format(n||0); }

export default function Dashboard(){
  const [series, setSeries] = useState<Series>({labels:[], income:[], expense:[], net:[]});
  const [tops, setTops] = useState<{label:string; value:number}[]>([]);
  const [k, setK] = useState<any>({});
  useEffect(()=>{
    (async ()=>{
      setSeries(await buildSeries(6));
      setTops(await topExpenses(30,5));
      setK(await kpis());
    })();
  },[]);

  const deltaNet = useMemo(()=>{
    const n = series.net || [];
    const last = n.length > 0 ? n[n.length - 1] : 0;
    const prev = n.length > 1 ? n[n.length - 2] : 0;
    return +(last - prev).toFixed(2);
  },[series.net]);

  // Helper for inline usage (no .at)
  const netLast = series.net.length > 0 ? series.net[series.net.length - 1] : 0;
  const netPrev = series.net.length > 1 ? series.net[series.net.length - 2] : 0;
  const netDeltaInline = netLast - netPrev;

  return (
    <Page title="Dashboard">
      {/* KPIs incl. Project cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-3 md:gap-4">
        <div className="card"><div className="text-sm opacity-70">Aktive Services</div><div className="text-3xl font-semibold mt-1 tabular-nums">{k.activeServices ?? 0}</div></div>
        <div className="card"><div className="text-sm opacity-70">Freie Slots</div><div className="text-3xl font-semibold mt-1 tabular-nums">{k.freeSlots ?? 0}</div></div>
        <div className="card flex items-center justify-between"><div><div className="text-sm opacity-70">Auslastung</div><div className="text-3xl font-semibold mt-1">{(k.utilization??0)}%</div></div><Donut value={k.utilization??0} size={80} stroke={10} label="Auslastung"/></div>
        <div className="card"><div className="text-sm opacity-70">MRR</div><div className="text-3xl font-semibold mt-1">{Euro(k.mrr||0)}</div></div>
        <div className="card"><div className="text-sm opacity-70">Netto (Monat)</div><div className="text-3xl font-semibold mt-1">{Euro(k.netMonth||0)}</div><div className={"text-xs mt-1 " + (( netDeltaInline )>=0 ? "text-emerald-400" : "text-red-400")}>{( netDeltaInline )>=0 ? "▲" : "▼"} {Euro(Math.abs( netDeltaInline ))} vs. Vormonat</div></div>
        <div className="card"><div className="text-sm opacity-70">Offene Tasks</div><div className="text-3xl font-semibold mt-1 tabular-nums">{k.tasksOpen ?? 0}</div></div>

        {/* New project KPI cards */}
        <div className="card"><div className="text-sm opacity-70">Projekte aktiv</div><div className="text-3xl font-semibold mt-1 tabular-nums">{k.activeProjects ?? 0}</div></div>
        <div className="card"><div className="text-sm opacity-70">Milestones fällig (7T)</div><div className="text-3xl font-semibold mt-1 tabular-nums">{k.dueSoon ?? 0}</div></div>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="font-semibold">Finanzen · 6 Monate</div>
              <div className="text-xs opacity-70">Einnahmen, Ausgaben, Netto</div>
            </div>
            <div className="seg">
              {series.labels.map((l,i)=> <button key={i} aria-pressed={i===series.labels.length-1}>{l}</button>)}
            </div>
          </div>
          <div className="grid gap-3">
            <div className="glass rounded-xl p-3">
              <div className="text-xs opacity-70 mb-1">Netto</div>
              <Sparkline data={series.net} width={320} height={56} fill ariaLabel="Netto Verlauf"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-3">
                <div className="text-xs opacity-70 mb-1">Einnahmen</div>
                <Sparkline data={series.income} width={150} height={46} fill ariaLabel="Einnahmen Verlauf"/>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs opacity-70 mb-1">Ausgaben</div>
                <Sparkline data={series.expense} width={150} height={46} fill ariaLabel="Ausgaben Verlauf"/>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="font-semibold">Projekt-Fortschritt (Ø)</div>
              <div className="text-xs opacity-70">aus Meilensteinen</div>
            </div>
            <Donut value={k.avgProgress ?? 0} size={80} stroke={10} label="Ø Projektfortschritt"/>
          </div>
          <div className="text-sm opacity-70">Durchschnitt der abgeschlossenen Meilensteine über alle Projekte.</div>
        </div>
      </div>
    </Page>
  );
}
