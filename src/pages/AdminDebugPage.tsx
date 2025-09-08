import AdminDebug from '../components/AdminDebug'
export default function AdminDebugPage(){
  return (
    <main className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Admin Debug</h2>
      <AdminDebug/>
      <div className="text-sm text-slate-400">
        Wenn <b>In admin_users: NEIN</b> → falsche UID eingetragen.<br/>
        Wenn <b>Requests sichtbar = 0</b> trotz Einträgen → RLS-Policy fehlt/falsch.<br/>
        Wenn <b>Error</b> → Policy oder Schema prüfen.
      </div>
    </main>
  )
}
