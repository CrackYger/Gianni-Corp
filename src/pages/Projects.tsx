import React from "react";

type AnyProject = { [k: string]: any };

export default function Projects() {
  const projects: AnyProject[] = Array.isArray((window as any).__PROJECTS__)
    ? (window as any).__PROJECTS__
    : [];

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Projekte</h2>
      {projects.length === 0 && <div className="opacity-70 text-sm">Keine Projekte</div>}
      {projects.map((p, idx) => (
        <div key={idx} className="border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{p.title ?? p.name ?? "Projekt"}</div>
            <div className="text-sm opacity-70">
              Owner: {p.owner ?? p.createdBy ?? p.assignee ?? "—"}
            </div>
          </div>
          <div className="text-sm opacity-70">
            Status: {p.status ?? "offen"}
          </div>
        </div>
      ))}
    </div>
  );
}