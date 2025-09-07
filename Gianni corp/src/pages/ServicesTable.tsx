import { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { ColumnDef } from '@tanstack/react-table';
import { db, Service, Subscription, Assignment } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import { DataTable } from '@/components/table/DataTable';

type ServiceRow = Service & {
  assignedSlots: number;
  freeSlots: number;
  subCount: number;
  monthlyCost: number;
};

export default function ServicesTable(){
  const [services, setServices] = useState<Service[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);

  useEffect(()=>{(async()=>{
    await ensureSeed();
    const [s, su, a] = await Promise.all([
      db.services.toArray(),
      db.subscriptions.toArray(),
      db.assignments.toArray(),
    ]);
    setServices(s); setSubs(su); setAssigns(a);
  })()},[]);

  const rows: ServiceRow[] = useMemo(()=> services.map(s=> {
    const sSubs = subs.filter(x=> x.serviceId===s.id);
    const subIds = sSubs.map(x=>x.id);
    const assigned = assigns.filter(a=> subIds.includes(a.subscriptionId)).length;
    const subCount = sSubs.length;
    return {
      ...s,
      assignedSlots: assigned,
      freeSlots: Math.max(0, (s.maxSlots ?? 0) - assigned),
      subCount,
      monthlyCost: s.baseCostPerMonth ?? 0,
    };
  }), [services, subs, assigns]);

  const columns: ColumnDef<ServiceRow>[] = [
    { accessorKey: 'name', header: 'Service' },
    { accessorKey: 'plan', header: 'Plan' },
    { accessorKey: 'maxSlots', header: 'Slots max' },
    { accessorKey: 'assignedSlots', header: 'vergeben' },
    { accessorKey: 'freeSlots', header: 'frei' },
    { accessorKey: 'monthlyCost', header: '€/Monat', cell: ({getValue})=> (Number(getValue())||0).toFixed(2) },
    { accessorKey: 'billingCycle', header: 'Zyklus' },
    { accessorKey: 'active', header: 'Aktiv', cell: ({ getValue })=> (getValue()? '✅':'—') },
  ];

  return (
    <Page title="Abos – Tabelle">
      <div className="mb-3 text-sm opacity-80">Sortieren durch Klick auf Spalten, globale Suche oben links. CSV exportiert die aktuell sichtbaren Spalten.</div>
      <DataTable<ServiceRow, unknown> title="Abos" columns={columns} data={rows} initialSorting={[{id:'name', desc:false}]}/>
    </Page>
  );
}