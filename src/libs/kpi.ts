
import { db } from '@/db/schema';

function startOfMonthISO(d: Date){
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
}
function isOverdue(assignment: any){
  const today = new Date();
  const currMonthStart = startOfMonthISO(today);
  const dueDay = Math.min(Math.max(assignment.billingDay || 1,1),28);
  const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const lastPaid = assignment.lastPaidAt ? new Date(assignment.lastPaidAt) : null;
  const paidThisMonth = lastPaid && lastPaid.toISOString().slice(0,10) >= currMonthStart;
  return assignment.status==='active' && !paidThisMonth && today >= dueDate;
}

export async function calcKpis(){
  const [services, subs, assigns, incomes, expenses, tasks] = await Promise.all([
    db.services.toArray(), db.subscriptions.toArray(), db.assignments.toArray(), db.incomes.toArray(), db.expenses.toArray(), db.tasks.toArray()
  ]);
  const activeSubs = subs.filter(s=>s.status==='active');
  const maxSlots = activeSubs.reduce((a,s)=>a+s.currentSlots, 0);
  const activeAssigns = assigns.filter(a=>a.status==='active');
  const freeSlots = Math.max(0, maxSlots - activeAssigns.length);
  const utilization = maxSlots? Math.round((activeAssigns.length/maxSlots)*100):0;
  const mrr = activeAssigns.reduce((a,s)=>a+s.pricePerMonth,0);
  const nowMonth = new Date().toISOString().slice(0,7); // yyyy-mm
  const inMonth = incomes.filter(i=>i.date?.startsWith(nowMonth)).reduce((a,b)=>a+b.amount,0);
  const outMonth = expenses.filter(e=>e.date?.startsWith(nowMonth)).reduce((a,b)=>a+b.amount,0);
  const netMonth = +(inMonth - outMonth).toFixed(2);
  const tasksToday = tasks.filter(t=>t.status!=='done').length;
  const overduePayments = assigns.filter(isOverdue).length;
  return { servicesActive: services.filter(s=>s.active).length, freeSlots, utilization, mrr:+mrr.toFixed(2), netMonth, overduePayments, tasksToday };
}
