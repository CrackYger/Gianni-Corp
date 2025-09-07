import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from "recharts";

type SeriesPoint = { month: string; income: number; expense: number; net: number };
type ExpenseByService = { name: string; amount: number };

const MONTH_FORMATTER = (d: Date) => d.toISOString().slice(0, 7); // YYYY-MM

export default function Finance() {
  // State FIRST to avoid "used before declaration"
  const [month, setMonth] = useState<string>(MONTH_FORMATTER(new Date()));
  const monthsBack = 12;

  const monthKeys = useMemo(() => {
    const base = new Date(`${month}-01T00:00:00`);
    const keys: string[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setMonth(d.getMonth() - i);
      keys.push(MONTH_FORMATTER(d));
    }
    return keys;
  }, [month]);

  // TODO: Replace with your real data source if available
  const monthlySeries: SeriesPoint[] = useMemo(() => {
    // generate neutral data so charts render even if no backend exists
    return monthKeys.map((m, idx) => {
      const income = Math.max(0, 1000 + (idx % 5) * 150);
      const expense = Math.max(0, 600 + ((idx + 2) % 6) * 90);
      return { month: m, income, expense, net: income - expense };
    });
  }, [monthKeys]);

  const expenseByService: ExpenseByService[] = useMemo(() => {
    // placeholder grouping – replace with real aggregation if you have it
    return [
      { name: "Abos", amount: 120 },
      { name: "Apps", amount: 80 },
      { name: "Sonstiges", amount: 60 },
    ];
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm opacity-80">Monat:</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-md px-2 py-1"
        />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={monthlySeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" />
            <Line type="monotone" dataKey="expense" />
            <Line type="monotone" dataKey="net" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={expenseByService}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}