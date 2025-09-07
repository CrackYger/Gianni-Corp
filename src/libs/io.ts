// src/libs/io.ts
export type CsvRow = Record<string, string | number | boolean | null | undefined>;

function toCSV(rows: CsvRow[], headers?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const cols = headers && headers.length ? headers : Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach(k => acc.add(k));
      return acc;
    }, new Set<string>())
  );

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

  const head = cols.join(',');
  const body = rows.map(r => cols.map(c => esc((r as any)[c])).join(',')).join('\n');
  return [head, body].join('\n');
}

export function exportCSV(filename: string, rows: CsvRow[], headers?: string[]) {
  const csv = toCSV(rows, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}