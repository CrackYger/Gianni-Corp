/**
 * IO utilities – resilient to different call sites in the app.
 * Includes legacy-compatible exports: backupJSON / restoreJSON.
 */


export function downloadJSON(filename: string, data: unknown) {
  const name = filename.endsWith(".json") ? filename : `${filename}.json`;
  const json = (typeof data === "string") ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const file = new File([blob], name, { type: "application/json" });

  // Try Web Share Level 2 (iOS 16+ supports files in share sheet)
  const nav: any = navigator;
  if (nav?.canShare && nav.canShare({ files: [file] }) && nav.share) {
    nav.share({ files: [file], title: name, text: "Giannicorp Backup" }).catch(()=>{});
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  // iOS/PWA can ignore download attr; open in a new tab as fallback so user can "Teilen"/"In Dateien sichern"
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();

  // Additional safety: open window if anchor click is blocked
  try { window.open(url, "_blank"); } catch {}

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 2000);
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