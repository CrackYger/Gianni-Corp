/**
 * IO utilities – resilient to different call sites in the app.
 * Includes legacy-compatible exports: backupJSON / restoreJSON.
 */

export function downloadJSON(filename: string, data: unknown) {
  const name = filename.endsWith(".json") ? filename : `${filename}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename: string, rows: Array<Record<string, any>>) {
  const name = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  const headers = rows?.length ? Object.keys(rows[0]) : [];
  const csv = rows?.length
    ? [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const v = row[h];
              const s = v == null ? "" : String(v);
              return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            })
            .join(",")
        ),
      ].join("\n")
    : "# empty CSV";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function saveText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Legacy-compatible wrappers ---------- */

/**
 * Legacy alias used in Settings.tsx – simply calls downloadJSON.
 * Some call sites may have swapped arguments; we tolerate both orders.
 */
export function backupJSON(a: string | unknown, b?: unknown | string) {
  if (typeof a === "string") {
    return downloadJSON(a, b as unknown);
  }
  // if first arg is data and second is filename
  const filename = typeof b === "string" ? b : "backup.json";
  return downloadJSON(filename, a as unknown);
}

/**
 * Reads a JSON file and returns the parsed object.
 * Accepts File, an <input type="file"> element, or a change Event from that input.
 */
export async function restoreJSON(
  source: File | HTMLInputElement | Event
): Promise<any> {
  let file: File | null = null;

  if (source instanceof File) {
    file = source;
  } else if (source instanceof HTMLInputElement) {
    file = source.files && source.files[0] ? source.files[0] : null;
  } else if (source instanceof Event) {
    const target = source.target as HTMLInputElement | null;
    if (target && target.files && target.files[0]) file = target.files[0];
  }

  if (!file) throw new Error("No file provided for restoreJSON");
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }
}