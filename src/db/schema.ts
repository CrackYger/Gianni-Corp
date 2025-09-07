
import Dexie, { Table } from 'dexie';

export interface Service { id:string; name:string; plan?:string; maxSlots:number; baseCostPerMonth:number; billingCycle:'monthly'|'yearly'; notes?:string; active:boolean; }
export interface Subscription { id:string; serviceId:string; startDate:string; status:'active'|'paused'|'canceled'; currentSlots:number; customNotes?:string; }
export interface Person { id:string; name:string; email?:string; phone?:string; tg?:string; notes?:string; }
export interface Assignment { id:string; subscriptionId:string; personId:string; since:string; pricePerMonth:number; billingDay:number; status:'active'|'paused'|'ended'; lastPaidAt?:string; nextDueAt?:string; notes?:string; }
export interface Expense { id:string; date:string; serviceId?:string; subscriptionId?:string; amount:number; memo?:string; }
export interface Income { id:string; date:string; assignmentId:string; amount:number; memo?:string; paidVia?:'cash'|'bank'|'paypal'|'other'; }
export interface Project { id:string; name:string; description?:string; status:'idea'|'planning'|'active'|'done'; tags:string[]; }
export interface Milestone { id:string; projectId:string; title:string; due?:string; status:'open'|'done'; }
export interface Task { id:string; projectId?:string; title:string; description?:string; priority:1|2|3; tags:string[]; due?:string; repeating?:'none'|'weekly'|'monthly'; status:'open'|'doing'|'review'|'done'; }

export class GCDB extends Dexie {
  services!: Table<Service, string>;
  subscriptions!: Table<Subscription, string>;
  people!: Table<Person, string>;
  assignments!: Table<Assignment, string>;
  expenses!: Table<Expense, string>;
  incomes!: Table<Income, string>;
  projects!: Table<Project, string>;
  milestones!: Table<Milestone, string>;
  tasks!: Table<Task, string>;
  constructor() {
    super('giannicorp-admin-db');
    this.version(1).stores({
      services: 'id, name, active',
      subscriptions: 'id, serviceId, status',
      people: 'id, name',
      assignments: 'id, subscriptionId, personId, status',
      expenses: 'id, date',
      incomes: 'id, date, assignmentId',
      projects: 'id, status',
      milestones: 'id, projectId',
      tasks: 'id, status, due'
    });
  }
}

export const db = new GCDB();
