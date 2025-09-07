import React, { useEffect, useMemo, useState } from 'react';
import { db, Income, Expense } from '@/db/schema';
import { ensureSeed } from '@/db/seed';
import IncomeForm from '@/components/forms/IncomeForm';
import ExpenseForm from '@/components/forms/ExpenseForm';
import Page from '@/components/Page';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { db as _db2, Service as _Service } from '@/db/schema';
import { exportCSV } from '@/libs/io';

export default function Finance() {
  // data
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [services, setServices] = useState<_Service[]>([]);
  const [modal, setModal] = useState<React.ReactNode | null>(null);

  // month filter
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // yyyy-mm

  // seed & load
  useEffect(() => {
    (async () => {
      try {
        await ensureSeed();
        setIncomes(await db.incomes.toArray());
        setExpenses(await db.expenses.toArray());
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // load services (for grouping)
  useEffect(() => {
    (async () => {
      try {
        setServices(await _db2.services.toArray());
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // helpers
  const byMonth = (d: string) => d?.startsWith(month);
  const incomesM = useMemo(() => incomes.filter(i => byMonth(i.date)), [incomes, month]);
  const expensesM = useMemo(() => expenses.filter(e => byMonth(e.date)), [expenses, month]);
  const sum = (arr: { amount: number }[]) => arr.reduce((a, b) => a + (b.amount || 0), 0);
  const net = +(sum(incomesM) - sum(expensesM)).toFixed(2);

  // delete actions
  async function delIncome(id: string) {
    if (!confirm('Einnahme löschen?')) return;
    await db.incomes.delete(id);
    setIncomes(await db.incomes.toArray());
  }
  async function delExpense(id: string) {
    if (!confirm('Ausgabe löschen?')) return;
    await db.expenses.delete(id);
    setExpenses(await db.expenses.toArray());
  }

  // === Charts Data ===
  const monthsBack = 12;
  const monthKeys = useMemo(() => {
    const arr: string[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < monthsBack; i++) {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      arr.unshift(`${y}-${m}`);
      d.setMonth(d.getMonth() - 1);
    }
    return arr;
  }, []);

  const monthlySeries = useMemo(() => {
    const byMonth: Record<string, { income: number; expense: number; net: number }> =
      Object.fromEntries(monthKeys.map(k => [k, { income: 0, expense: 0, net: 0 }])) as Record<string, { income: number; expense: number; net: number }>;

    for (const inc of incomes) {
      const k = inc.date.slice(0, 7);
      if (byMonth[k]) byMonth[k].income += inc.amount || 0;
    }
    for (const exp of expenses) {
      const k = exp.date.slice(0, 7);
      if (byMonth[k]) byMonth[k].expense += exp.amount || 0;
    }
    Object.keys(byMonth).forEach(k => {
      byMonth[k].net = +(byMonth[k].income - byMonth[k].expense).toFixed(2);
    });
    return monthKeys.map(k => ({ month: k, ...byMonth[k] }));
  }, [incomes, expenses, monthKeys]);

  const [topExp, setTopExp] = useState(8);
  const expenseByService = useMemo(() => {
    const map = new Map<string, number>();
    const monthPrefix = month + '-';
    const svcById = new Map<string, _Service>(services.map(s => [s.id, s]));
    for (const exp of expenses) {
      if (!exp.date.startsWith(monthPrefix)) continue;
      const name = (exp.serviceId && svcById.get(exp.serviceId)?.name) || 'Unbekannt';
      map.set(name, (map.get(name) || 0) + (exp.amount || 0));
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topExp);
  }, [expenses, month, topExp, services]);

  const toolbar = (
    <div className="toolbar">
      <input
        aria-label="Monat"
        className="input w-[150px]"
        type="month"
        value={month}
        onChange={e => setMonth((e.target as HTMLInputElement).value)}
      />
      <button className="btn" onClick={exportCSV}>Export CSV</button>
      <button className="btn btn-primary" onClick={() => setModal(<IncomeForm onClose={() => setModal(null)} />)}>Einnahme +</button>
      <button className="btn btn-primary" onClick={() => setModal(<ExpenseForm onClose={() => setModal(null)} />)}>Ausgabe +</button>
    </div>
  );

  return (
    <Page title="Finanzen" actions={toolbar}>
      <div className="grid gap-4">
        <div className="card">Netto {month}: <b>{net} €</b></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <div className="font-semibold mb-2">Einnahmen</div>
            <ul className="text-sm space-y-1">
              {incomesM.map(i => (
                <li key={i.id} className="flex items-center justify-between">
                  <span>{i.date} — {i.amount.toFixed(2)} € {i.memo ? `• ${i.memo}` : ''}</span>
                  <button className="btn btn-danger px-2 py-1" onClick={() => delIncome(i.id)}>Del</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="font-semibold mb-2">Ausgaben</div>
            <ul className="text-sm space-y-1">
              {expensesM.map(e => (
                <li key={e.id} className="flex items-center justify-between">
                  <span>{e.date} — {e.amount.toFixed(2)} € {e.memo ? `• ${e.memo}` : ''}</span>
                  <button className="btn btn-danger px-2 py-1" onClick={() => delExpense(e.id)}>Del</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Netto pro Monat (12 Monate)</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Einnahmen" />
                  <Line type="monotone" dataKey="expense" name="Ausgaben" />
                  <Line type="monotone" dataKey="net" name="Netto" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Ausgaben nach Service ({month})</div>
              <div className="seg">
                {[5, 8, 12].map(n => (
                  <button key={n} aria-pressed={topExp === n} onClick={() => setTopExp(n)}>{n}</button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" name="Ausgaben" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {modal}
      </div>
    </Page>
  );
}