
import { db, Service, Subscription, Person, Assignment, Income, Expense, Project, Task } from './schema';
const uuid = () => crypto.randomUUID();

export async function ensureSeed(){
  const count = await db.services.count();
  if(count>0) return;
  const services: Service[] = [
    { id: uuid(), name:'Spotify', plan:'Family', maxSlots:6, baseCostPerMonth:14.99, billingCycle:'monthly', active:true },
    { id: uuid(), name:'Apple Music', plan:'Individual', maxSlots:1, baseCostPerMonth:10.99, billingCycle:'monthly', active:false },
    { id: uuid(), name:'Apple One', plan:'Family', maxSlots:5, baseCostPerMonth:19.95, billingCycle:'monthly', active:true },
    { id: uuid(), name:'Premium', plan:'All-in', maxSlots:99, baseCostPerMonth:0, billingCycle:'monthly', active:true },
  ];
  await db.services.bulkAdd(services);
  const spotify = services[0];
  const appleOne = services[2];
  const subs: Subscription[] = [
    { id: uuid(), serviceId: spotify.id, startDate: new Date().toISOString().slice(0,10), status:'active', currentSlots:6 },
    { id: uuid(), serviceId: appleOne.id, startDate: new Date().toISOString().slice(0,10), status:'active', currentSlots:5 },
  ];
  await db.subscriptions.bulkAdd(subs);
  const people: Person[] = [
    { id: uuid(), name:'Sophia' },
    { id: uuid(), name:'Max M.' },
  ];
  await db.people.bulkAdd(people);
  const assigns: Assignment[] = [
    { id: uuid(), subscriptionId: subs[0].id, personId: people[0].id, since: new Date().toISOString().slice(0,10), pricePerMonth:7.99, billingDay:1, status:'active' },
    { id: uuid(), subscriptionId: subs[1].id, personId: people[1].id, since: new Date().toISOString().slice(0,10), pricePerMonth:19.99, billingDay:5, status:'active' },
  ];
  await db.assignments.bulkAdd(assigns);
  const incomes: Income[] = assigns.map(a=>({ id: uuid(), date: new Date().toISOString().slice(0,10), assignmentId: a.id, amount: a.pricePerMonth, memo:'Initial payment', paidVia:'bank' }));
  await db.incomes.bulkAdd(incomes);
  const expenses: Expense[] = [
    { id: uuid(), date: new Date().toISOString().slice(0,10), serviceId: spotify.id, amount: 14.99, memo:'Spotify Family' },
    { id: uuid(), date: new Date().toISOString().slice(0,10), serviceId: appleOne.id, amount: 19.95, memo:'Apple One Family' },
  ];
  await db.expenses.bulkAdd(expenses);
  const projects: Project[] = [
    { id: uuid(), name:'Abo-Website', description:'Weiterbauen Patch 016+', status:'active', tags:['web','subs'] }
  ];
  await db.projects.bulkAdd(projects);
  const tasks: Task[] = [
    { id: uuid(), title:'Patch 016 StatusChip', priority:2, tags:['abo-website'], status:'open' },
    { id: uuid(), title:'Giannicorp Branding Update', priority:3, tags:['branding'], status:'open' }
  ];
  await db.tasks.bulkAdd(tasks);
}
