import * as React from 'react';
import {
  ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  SortingState, VisibilityState,
} from '@tanstack/react-table';

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  initialSorting?: SortingState;
  onRowClick?: (row: TData)=>void;
};

export function DataTable<TData, TValue>({ columns, data, title, initialSorting, onRowClick }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? []);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function exportCSVVisible(){
    const headers = table.getVisibleLeafColumns().map(c=>c.id);
    const rows = table.getRowModel().rows.map(r=> {
      const values: Record<string, any> = {};
      r.getVisibleCells().forEach((cell, i)=>{
        const id = headers[i];
        values[id] = cell.getValue() as any;
      });
      return values;
    });
    const esc = (v:any)=> `"${String(v??'').replace(/"/g,'""')}"`;
    const csv = [headers.join(','), ...rows.map(r=> headers.map(h=> esc(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = (title?.toLowerCase().replace(/\s+/g,'-') || 'table') + '.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <div className="flex items-center gap-2">
          <input value={globalFilter ?? ''} onChange={(e)=> setGlobalFilter(e.target.value)} placeholder="Suche…" className="input w-64" aria-label="Tabelle durchsuchen"/>
          <div className="seg">
            {table.getAllLeafColumns().map(col=> (
              <button key={col.id} aria-pressed={col.getIsVisible()? 'true': 'false'} onClick={()=> col.toggleVisibility()}>{col.id}</button>
            ))}
          </div>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={exportCSVVisible}>CSV exportieren</button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="text-left font-medium px-3 py-2 select-none cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                    <div className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: '▲', desc:'▼' }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-t border-white/10 hover:bg-white/5" onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-3">
        <div className="text-xs opacity-70">
          {table.getFilteredRowModel().rows.length} Einträge
        </div>
        <div className="inline-flex items-center gap-2">
          <select className="input w-28" value={table.getState().pagination.pageSize} onChange={e=> table.setPageSize(Number(e.target.value))}>
            {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}/Seite</option>)}
          </select>
          <div className="seg">
            <button onClick={()=> table.firstPage()} disabled={!table.getCanPreviousPage()}>«</button>
            <button onClick={()=> table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
            <button onClick={()=> table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
            <button onClick={()=> table.lastPage()} disabled={!table.getCanNextPage()}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}