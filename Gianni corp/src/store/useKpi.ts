
import { create } from 'zustand';

type KPI = {
  servicesActive: number;
  freeSlots: number;
  utilization: number;
  mrr: number;
  netMonth: number;
  overduePayments: number;
  tasksToday: number;
};

export const useKpi = create<{kpi: KPI; set:(k:Partial<KPI>)=>void}>(set=> ({
  kpi: { servicesActive:0, freeSlots:0, utilization:0, mrr:0, netMonth:0, overduePayments:0, tasksToday:0 },
  set: (k)=> set(s=>({kpi: {...s.kpi, ...k}}))
}));
