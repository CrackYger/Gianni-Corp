
import { useEffect, useState } from 'react';
import Page from '@/components/Page';
import StatCard from '@/components/StatCard';
import { calcKpis } from '@/libs/kpi';

export default function Dashboard(){
  const [kpi, setKpi] = useState<any>({servicesActive:0,freeSlots:0,utilization:0,mrr:0,netMonth:0,overduePayments:0,tasksToday:0});
  useEffect(()=>{ (async ()=> setKpi(await calcKpis()))(); },[]);
  return (
    <Page title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Aktive Services" value={kpi.servicesActive}/>
        <StatCard label="Freie Slots" value={kpi.freeSlots}/>
        <StatCard label="Auslastung" value={`${kpi.utilization}%`} pct={kpi.utilization}/>
        <StatCard label="MRR" value={`${kpi.mrr} €`}/>
        <StatCard label="Netto (Monat)" value={`${kpi.netMonth} €`}/>
        <StatCard label="Überfällige Zahlungen" value={kpi.overduePayments}/>
        <StatCard label="Heute fällige Tasks" value={kpi.tasksToday}/>
      </div>
      <div className="card mt-4">
        <div className="font-semibold mb-1">Nächste Schritte</div>
        <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
          <li>Abos pflegen (Services/Subscriptions/Slots/Assignments)</li>
          <li>Personen anlegen und zuweisen</li>
          <li>Einnahmen/Ausgaben eintragen</li>
          <li>Aufgaben & Projekte strukturieren</li>
        </ul>
      </div>
    </Page>
  );
}
