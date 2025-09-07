import { useEffect, useMemo, useState } from 'react';
import Page from '@/components/Page';
import { ColumnDef } from '@tanstack/react-table';
import { db, Person, Subscription, Assignment, Service } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import { DataTable } from '@/components/table/DataTable';

type Row = Person & { assignments: number; totalPerMonth: number };

export default function PeopleTable(){
  const [people, setPeople] = useState<Person[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(()=>{(async()=>{
    await ensureSeed();
    const [p, a, s, sv] = await Promise.all([
      db.people.toArray(),
      db.assignments.toArray(),
      db.subscriptions.toArray(),
      db.services.toArray(),
    ]);
    setPeople(p); setAssigns(a); setSubs(s); setServices(sv);
  })()},[]);

  const rows: Row[] = useMemo(()=> people.map(person=>{
    const myAssigns = assigns.filter(a=> a.personId===person.id);
    const total = myAssigns.reduce((sum, a)=> {
      const sub = subs.find(s => s.id === a.subscriptionId);
      const svc = services.find(sv => sv.id === sub?.serviceId);
      const price =
        (a as any).pricePerMonth ??           // Assignment-Override
        (svc?.baseCostPerMonth ?? 0);         // Fallback: Service-Basis
      return sum + (Number(price) || 0);
    }, 0);
    return { ...person, assignments: myAssigns.length, totalPerMonth: total };
  }), [people, assigns, subs, services]);

  const columns: ColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'Person' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Telefon' },
    { accessorKey: 'assignments', header: 'Zuweisungen' },
    { accessorKey: 'totalPerMonth', header: '€/Monat', cell: ({getValue})=> (Number(getValue())||0).toFixed(2) },
  ];

  return (
    <Page title="Personen – Tabelle">
      <div className="mb-3 text-sm opacity-80">Globale Suche oben links, CSV exportiert die sichtbaren Spalten.</div>
      <DataTable<Row, unknown> title="Personen" columns={columns} data={rows} initialSorting={[{id:'name', desc:false}]}/>
    </Page>
  );
}