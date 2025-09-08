/**
 * IO utilities for downloads/shares on web + iOS Safari (PWA friendly).
 */

// JSON download or Share Sheet (iOS 16+)
export function downloadJSON(filename: string, data: unknown) {
  const name = filename.endsWith('.json') ? filename : `${filename}.json`;
  const json = (typeof data === 'string') ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(name, blob);
}

// CSV export with UTF-8 BOM for Excel compatibility
export function exportCSV(filename: string, rows: Record<string, any>[]) {
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  if (!rows || rows.length === 0) {
    const empty = new Blob(['\ufeff'], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(name, empty);
    return;
  }
  // union of headers across rows
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(',')].concat(
    rows.map(r => headers.map(h => escape(r[h])).join(','))
  );
  const csv = '\ufeff' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(name, blob);
}

// Back-compat helpers
export const backupJSON = downloadJSON;

// Shared download/share helper
function triggerDownload(name: string, blob: Blob){
  try {
    const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
    const nav: any = navigator;
    if (nav?.canShare && nav.share && nav.canShare({ files: [file] })) {
      nav.share({ files: [file], title: name }).catch(()=>{});
      return;
    }
  } catch {}
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
