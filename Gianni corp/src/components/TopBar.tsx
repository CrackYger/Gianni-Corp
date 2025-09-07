
import { Search } from 'lucide-react';
export default function TopBar({title}:{title:string}){
  return (
    <header className="sticky top-0 z-30 glass backdrop-blur-md border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-lg md:text-xl font-semibold">{title}</div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <Search size={16}/><input className="bg-transparent outline-none flex-1" placeholder="Suche (Ctrl+K)"/>
        </div>
      </div>
    </header>
  );
}
