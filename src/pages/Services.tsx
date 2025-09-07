
import { useEffect, useState } from 'react';
import Page from '@/components/Page';
import { Link } from 'react-router-dom';
import { db, Service, Subscription, Assignment, Person } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import ServiceForm from '@/components/forms/ServiceForm';
import SubscriptionForm from '@/components/forms/SubscriptionForm';
import AssignmentForm from '@/components/forms/AssignmentForm';

export default function Services(){
  const [services, setServices] = useState<Service[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [modal, setModal] = useState<React.ReactNode | null>(null);

  useEffect(()=>{ (async ()=>{
    await ensureSeed();
    setServices(await db.services.toArray());
    setSubs(await db.subscriptions.toArray());
    setAssigns(await db.assignments.toArray());
    setPeople(await db.people.toArray());
  })(); },[]);

  const totalSlots = (serviceId:string) => subs.filter(s=>s.serviceId===serviceId && s.status==='active').reduce((a,s)=>a+s.currentSlots,0);
  const usedSlots = (serviceId:string) => assigns.filter(a=> subs.some(s=>s.id===a.subscriptionId && s.serviceId===serviceId) && a.status==='active').length;
  const freeSlots = (serviceId:string) => Math.max(0, totalSlots(serviceId) - usedSlots(serviceId));
  const monthlyCost = (serviceId:string) => {
    const svc = services.find(s=>s.id===serviceId);
    const count = subs.filter(s=>s.serviceId===serviceId && s.status==='active').length;
    return (svc?.baseCostPerMonth ?? 0) * count;
  };
  const monthlyRevenue = (serviceId:string) => assigns
    .filter(a=> subs.some(s=>s.id===a.subscriptionId && s.serviceId===serviceId) && a.status==='active')
    .reduce((sum,a)=> sum + (a.pricePerMonth||0), 0);
  const monthlyNet = (serviceId:string) => +(monthlyRevenue(serviceId) - monthlyCost(serviceId)).toFixed(2);

  const openServiceForm = (service?:Service)=> setModal(<ServiceForm service={service} onClose={()=>setModal(null)}/>);
  const openSubForm = (serviceId:string, sub?:Subscription)=> setModal(<SubscriptionForm serviceId={serviceId} sub={sub} onClose={()=>setModal(null)}/>);
  const openAssignForm = (subscriptionId:string, a?:Assignment)=> setModal(<AssignmentForm subscriptionId={subscriptionId} a={a} onClose={()=>setModal(null)}/>);

  async function deleteServiceCascade(serviceId:string){
    if(!confirm('Service inkl. zugehöriger Subscriptions & Assignments löschen?')) return;
    const subIds = subs.filter(s=>s.serviceId===serviceId).map(s=>s.id);
    const assignIds = assigns.filter(a=> subIds.includes(a.subscriptionId)).map(a=>a.id);
    await db.assignments.bulkDelete(assignIds);
    await db.subscriptions.bulkDelete(subIds);
    await db.services.delete(serviceId);
    setServices(await db.services.toArray());
    setSubs(await db.subscriptions.toArray());
    setAssigns(await db.assignments.toArray());
  }
  async function deleteSubCascade(subId:string){
    if(!confirm('Subscription inkl. zugehöriger Assignments löschen?')) return;
    const assignIds = assigns.filter(a=> a.subscriptionId===subId).map(a=>a.id);
    await db.assignments.bulkDelete(assignIds);
    await db.subscriptions.delete(subId);
    setAssigns(await db.assignments.toArray());
    setSubs(await db.subscriptions.toArray());
  }
  async function deleteAssignment(id:string){
    if(!confirm('Zuweisung löschen?')) return;
    await db.assignments.delete(id);
    setAssigns(await db.assignments.toArray());
  }

  return (
    <Page title="Abos" actions={<div className="toolbar"><Link to="/abos/tabelle" className="btn">Tabelle</Link><button className="btn btn-primary" onClick={()=>openServiceForm()}>Service anlegen</button></div>}>
      {/* mobile cards */}
      <div className="grid gap-3 md:hidden">
        {services.map(s=>{
          const slots = totalSlots(s.id); const used = usedSlots(s.id);
          return (
            <div key={s.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm opacity-80">{s.plan ?? '-'}</div>
                </div>
                <div className="text-xs opacity-70">{s.active?'aktiv':'inaktiv'}</div>
              </div>
              <div className="mt-2 grid grid-cols-3 text-sm">
                <div><div className="opacity-60">Gesamt</div><div>{slots}</div></div>
                <div><div className="opacity-60">Belegt</div><div>{used}</div></div>
                <div><div className="opacity-60">Frei</div><div>{Math.max(0,slots-used)}</div></div>
              </div>
              <div className="mt-2 text-sm opacity-80">
                Kosten/Monat: {monthlyCost(s.id).toFixed(2)} € <span className='chip ml-2'>Einnahmen: {monthlyRevenue(s.id).toFixed(2)} €</span> <span className='chip ml-2'>Netto: {monthlyNet(s.id).toFixed(2)} €</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-ghost" onClick={()=>openServiceForm(s)}>Bearbeiten</button>
                <button className="btn btn-primary" onClick={()=>openSubForm(s.id)}>Subscription +</button>
                <button className="btn btn-ghost" onClick={()=>deleteServiceCascade(s.id)}>Löschen</button>
              </div>
              {/* Subscriptions & Assignments */}
              {subs.filter(x=>x.serviceId===s.id).map(sub=>{
                const as = assigns.filter(a=>a.subscriptionId===sub.id);
                return (
                  <div key={sub.id} className="mt-3 bg-black/30 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Subscription • {sub.status}</div>
                      <div className="text-sm opacity-80">Slots: {sub.currentSlots}</div>
                    </div>
                    <div className="text-xs opacity-60">Start: {sub.startDate}</div>
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn-ghost" onClick={()=>openSubForm(s.id, sub)}>Bearbeiten</button>
                      <button className="btn btn-primary" onClick={()=>openAssignForm(sub.id)}>Zuweisung +</button>
                      <button className="btn btn-danger" onClick={()=>deleteSubCascade(sub.id)}>Löschen</button>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {as.map(a=>{
                        const person = people.find(p=>p.id===a.personId);
                        return (
                          <div key={a.id} className="bg-black/20 rounded-lg p-2 text-sm flex items-center justify-between">
                            <div>{person?.name ?? 'Person'} — {a.pricePerMonth.toFixed(2)} €/Monat <span className="opacity-60">({a.status})</span></div>
                            <div className="flex gap-2">
                              <button className="btn px-2 py-1" onClick={()=>openAssignForm(sub.id, a)}>Edit</button>
                              <button className="btn btn-danger px-2 py-1" onClick={()=>deleteAssignment(a.id)}>Del</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          );
        })}
      </div>

      {/* desktop table */}
      <div className="card hidden md:block p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="opacity-60"><tr><th className="text-left p-2">Service</th><th className="text-left p-2">Plan</th><th className="text-left p-2">Slots gesamt</th><th className="text-left p-2">Belegt</th><th className="text-left p-2">Frei</th><th className="text-left p-2">Kosten/Monat</th><th className="text-left p-2">Status</th><th className="text-left p-2">Aktionen</th></tr></thead>
          <tbody>
            {services.map(s=>{
              const slots = totalSlots(s.id); const used = usedSlots(s.id);
              return (
                <tr key={s.id} className="border-t border-white/10 align-top">
                  <td className="p-2">{s.name}
                    {/* subs */}
                    <div className="mt-2 space-y-2">
                      {subs.filter(x=>x.serviceId===s.id).map(sub=>(
                        <div key={sub.id} className="bg-black/20 rounded p-2">
                          <div className="flex items-center justify-between">
                            <div>Sub • {sub.status} • Start {sub.startDate}</div>
                            <div className="flex gap-2">
                              <button className="btn px-2 py-1" onClick={()=>openSubForm(s.id, sub)}>Edit</button>
                              <button className="btn px-2 py-1 btn-primary" onClick={()=>openAssignForm(sub.id)}>Assign +</button>
                              <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteSubCascade(sub.id)}>Del</button>
                            </div>
                          </div>
                          <div className="grid gap-1 mt-2">
                            {assigns.filter(a=>a.subscriptionId===sub.id).map(a=>{
                              const person = people.find(p=>p.id===a.personId);
                              return <div key={a.id} className="text-xs flex justify-between bg-black/10 rounded px-2 py-1">
                                <div>{person?.name ?? 'Person'} — {a.pricePerMonth.toFixed(2)} €/Monat ({a.status})</div>
                                <div className="flex gap-2">
                                  <button className="btn px-2 py-1" onClick={()=>openAssignForm(sub.id, a)}>Edit</button>
                                  <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteAssignment(a.id)}>Del</button>
                                </div>
                              </div>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">{s.plan??'-'}</td>
                  <td className="p-2">{slots}</td>
                  <td className="p-2">{used}</td>
                  <td className="p-2">{freeSlots(s.id)}</td>
                  <td className="p-2">{monthlyCost(s.id).toFixed(2)} €</td>
                  <td className="p-2">{s.active? 'aktiv':'inaktiv'}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn px-2 py-1" onClick={()=>openServiceForm(s)}>Edit</button>
                      <button className="btn px-2 py-1 btn-primary" onClick={()=>openSubForm(s.id)}>Sub +</button>
                      <button className="btn px-2 py-1 btn-danger" onClick={()=>deleteServiceCascade(s.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal}
    </Page>
  );
}
