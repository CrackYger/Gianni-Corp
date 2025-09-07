
export default function Page({title, actions, children}:{title:string; actions?:React.ReactNode; children:React.ReactNode}){
  return (
    <div className="page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
