
import { NavLink, Outlet } from 'react-router-dom';
import MobileNav from '@/components/MobileNav';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Briefcase, Settings as SettingsIcon } from 'lucide-react';

function NavItem({to, icon, label}:{to:string; icon:JSX.Element; label:string}){
  return (
    <NavLink to={to} end className={({isActive})=>`sidebar-link ${isActive?'active':''}`}>
      {icon}<span>{label}</span>
    </NavLink>
  );
}

export default function App(){
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden md:block glass border-r border-white/10 p-4 space-y-4">
        <div className="text-lg font-semibold">Giannicorp Admin</div>
        <nav className="grid gap-1">
          <NavItem to="/" icon={<LayoutDashboard size={18}/>} label="Dashboard" />
          <NavItem to="/abos" icon={<CreditCard size={18}/>} label="Abos" />
          <NavItem to="/personen" icon={<Users size={18}/>} label="Personen" />
          <NavItem to="/finanzen" icon={<CreditCard size={18}/>} label="Finanzen" />
          <NavItem to="/aufgaben" icon={<CheckSquare size={18}/>} label="Aufgaben" />
          <NavItem to="/projekte" icon={<Briefcase size={18}/>} label="Projekte" />
          <NavItem to="/settings" icon={<SettingsIcon size={18}/>} label="Einstellungen" />
        </nav>
      </aside>
      {/* Content */}
      <div className="col-span-1">
        <main className="p-4 md:p-6 max-w-screen-xl mx-auto">
          <Outlet/>
        </main>
      </div>
      <MobileNav/>
    </div>
  );
}
