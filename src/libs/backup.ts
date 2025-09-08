import { db } from '@/db/schema';
import { z } from 'zod';

/** Backup payload schema */
const Row = z.record(z.any());
const Arr = z.array(Row);

export const BackupSchema = z.object({
  app: z.string().default('Giannicorp Admin'),
  version: z.string().default('v1'),
  createdAt: z.string(),
  checksum: z.object({ algo: z.literal('SHA-256'), value: z.string() }),
  data: z.object({
    services: Arr,
    subscriptions: Arr,
    people: Arr,
    assignments: Arr,
    expenses: Arr,
    incomes: Arr,
    projects: Arr,
    milestones: Arr,
    tasks: Arr,
  })
});
export type BackupPayload = z.infer<typeof BackupSchema>;

async function sha256Hex(s: string){
  const enc = new TextEncoder().encode(s);
  // @ts-ignore
  const buf = await (crypto?.subtle?.digest?.('SHA-256', enc) ?? Promise.resolve(new Uint8Array()));
  const arr = Array.from(new Uint8Array(buf as ArrayBuffer));
  return arr.map(b=> b.toString(16).padStart(2,'0')).join('');
}

function pickData(){
  return Promise.all([
    db.services.toArray(),
    db.subscriptions.toArray(),
    db.people.toArray(),
    db.assignments.toArray(),
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.projects.toArray(),
    db.milestones.toArray(),
    db.tasks.toArray(),
  ]).then(([services, subscriptions, people, assignments, expenses, incomes, projects, milestones, tasks])=> ({
    services, subscriptions, people, assignments, expenses, incomes, projects, milestones, tasks
  }));
}

/** Create a backup Blob (JSON) with checksum. */
export async function backupExport(): Promise<Blob>{
  const data = await pickData();
  const payloadBase = {
    app: 'Giannicorp Admin',
    version: 'v1',
    createdAt: new Date().toISOString(),
    data
  } as any;
  const checksum = await sha256Hex(JSON.stringify(payloadBase.data));
  const payload: BackupPayload = {
    ...payloadBase,
    checksum: { algo: 'SHA-256', value: checksum }
  };
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/** Parse + validate backup file and return summary (no writes). */
export async function backupDryRun(file: File|Blob){
  const text = await file.text();
  const parsed = BackupSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    return { ok:false, error: 'Ungültiges Backup-Format.' };
  }
  const p = parsed.data;
  const sum = (obj:any)=> Object.fromEntries(Object.entries(obj).map(([k,v]:any)=> [k, (v as any[]).length]));
  const countsFile = sum(p.data);
  const countsDb = {
    services: await db.services.count(),
    subscriptions: await db.subscriptions.count(),
    people: await db.people.count(),
    assignments: await db.assignments.count(),
    expenses: await db.expenses.count(),
    incomes: await db.incomes.count(),
    projects: await db.projects.count(),
    milestones: await db.milestones.count(),
    tasks: await db.tasks.count(),
  };
  const checksumOk = (await sha256Hex(JSON.stringify(p.data))) === p.checksum.value;
  return { ok:true, version: p.version, checksumOk, countsFile, countsDb };
}

type ImportMode = 'merge'|'replace';

/** Import backup with 'merge' (upsert) or 'replace' (clear first). Atomic via Dexie transaction. */
export async function backupImport(file: File|Blob, mode: ImportMode = 'merge'){
  const text = await file.text();
  const parsed = BackupSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('Ungültiges Backup-Format.');
  const p = parsed.data;
  const checksumOk = (await sha256Hex(JSON.stringify(p.data))) === p.checksum.value;
  if (!checksumOk) throw new Error('Integritätsprüfung fehlgeschlagen (Checksumme).');

  const d = p.data;
  const tables = [db.services, db.subscriptions, db.people, db.assignments, db.expenses, db.incomes, db.projects, db.milestones, db.tasks];
  await db.transaction('rw', tables, async ()=>{
    if (mode === 'replace'){
      await Promise.all(tables.map(t=> t.clear()));
      await db.services.bulkAdd(d.services as any);
      await db.subscriptions.bulkAdd(d.subscriptions as any);
      await db.people.bulkAdd(d.people as any);
      await db.assignments.bulkAdd(d.assignments as any);
      await db.expenses.bulkAdd(d.expenses as any);
      await db.incomes.bulkAdd(d.incomes as any);
      await db.projects.bulkAdd(d.projects as any);
      await db.milestones.bulkAdd(d.milestones as any);
      await db.tasks.bulkAdd(d.tasks as any);
    } else {
      // merge (upsert)
      await db.services.bulkPut(d.services as any);
      await db.subscriptions.bulkPut(d.subscriptions as any);
      await db.people.bulkPut(d.people as any);
      await db.assignments.bulkPut(d.assignments as any);
      await db.expenses.bulkPut(d.expenses as any);
      await db.incomes.bulkPut(d.incomes as any);
      await db.projects.bulkPut(d.projects as any);
      await db.milestones.bulkPut(d.milestones as any);
      await db.tasks.bulkPut(d.tasks as any);
    }
  });
  return { ok: true };
}
