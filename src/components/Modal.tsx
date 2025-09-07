
export default function Modal({children, onClose}:{children:React.ReactNode; onClose:()=>void}){
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
