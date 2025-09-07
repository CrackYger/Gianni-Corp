
import { db } from '@/db/schema';

export async function exportCSV(){
  const [incomes, expenses] = await Promise.all([db.incomes.toArray(), db.expenses.toArray()]);
  const toCSV = (rows:any[], headers:string[]) => {
    const esc = (v:any)=> '"' + String(v??'').replace(/"/g,'""') + '"';
    return [headers.join(','), ...rows.map(r=> headers.map(h=>esc(r[h])).join(','))].join('\n');
  };
  const incCSV = toCSV(incomes, ['date','amount','memo','assignmentId']);
  const expCSV = toCSV(expenses, ['date','amount','memo','serviceId','subscriptionId']);
  const blob = new Blob([`# Incomes\n${incCSV}\n\n# Expenses\n${expCSV}`], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'finance-export.csv'; a.click();
  URL.revokeObjectURL(url);
}

export async function backupJSON(){
  const data = {
    services: await db.services.toArray(),
    subscriptions: await db.subscriptions.toArray(),
    people: await db.people.toArray(),
    assignments: await db.assignments.toArray(),
    expenses: await db.expenses.toArray(),
    incomes: await db.incomes.toArray(),
    projects: await db.projects.toArray(),
    milestones: await db.milestones.toArray(),
    tasks: await db.tasks.toArray()
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'giannicorp-backup.json'; a.click();
  URL.revokeObjectURL(url);
}

export async function restoreJSON(file: File){
  const text = await file.text();
  const data = JSON.parse(text);
  // naive replace strategy
  await db.transaction('rw',
    db.services, db.subscriptions, db.people, db.assignments, db.expenses, db.incomes, db.projects, db.milestones, db.tasks,
    async ()=>{
      await Promise.all([
        db.services.clear(), db.subscriptions.clear(), db.people.clear(), db.assignments.clear(), db.expenses.clear(), db.incomes.clear(), db.projects.clear(), db.milestones.clear(), db.tasks.clear()
      ]);
      if(data.services) await db.services.bulkAdd(data.services);
      if(data.subscriptions) await db.subscriptions.bulkAdd(data.subscriptions);
      if(data.people) await db.people.bulkAdd(data.people);
      if(data.assignments) await db.assignments.bulkAdd(data.assignments);
      if(data.expenses) await db.expenses.bulkAdd(data.expenses);
      if(data.incomes) await db.incomes.bulkAdd(data.incomes);
      if(data.projects) await db.projects.bulkAdd(data.projects);
      if(data.milestones) await db.milestones.bulkAdd(data.milestones);
      if(data.tasks) await db.tasks.bulkAdd(data.tasks);
    }
  );
}
