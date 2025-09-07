import React from "react";

type AnySub = { [k: string]: any };

export default function PeopleTable() {
  // This is a safe placeholder table that tolerates different subscription shapes.
  const subs: AnySub[] = Array.isArray((window as any).__SUBS__)
    ? (window as any).__SUBS__
    : [];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Abos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subs.map((s, i) => {
          const price =
            typeof s.pricePerMonth === "number"
              ? s.pricePerMonth
              : typeof s.price === "number"
              ? s.price
              : 0;
          return (
            <div key={i} className="border rounded-xl p-3">
              <div className="text-sm opacity-70">{s.name ?? "Abo"}</div>
              <div className="text-xl font-bold">
                {price.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}