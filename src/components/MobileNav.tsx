
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Briefcase, Settings } from 'lucide-react';
export default function MobileNav(){
  const Item = ({to, icon, label}:{to:string; icon:JSX.Element; label:string}) => (
    <NavLink to={to} end className={({isActive})=>`flex flex-col items-center justify-center flex-1 py-2 ${isActive?'text-gc-accent':''}`}>
      {icon}
      <span className="text-[10px] mt-0.5 opacity-80">{label}</span>
    </NavLink>
  );
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 glass backdrop-blur-md safe-b">
      <div className="flex px-2">
        <Item to="/" icon={<LayoutDashboard size={18}/>} label="Home"/>
        <Item to="/abos" icon={<CreditCard size={18}/>} label="Abos"/>
        <Item to="/personen" icon={<Users size={18}/>} label="Personen"/>
        <Item to="/aufgaben" icon={<CheckSquare size={18}/>} label="Tasks"/>
        <Item to="/projekte" icon={<Briefcase size={18}/>} label="Projekte"/>
        <Item to="/settings" icon={<Settings size={18}/>} label="Einst." />
      </div>
    </div>
  );
}
