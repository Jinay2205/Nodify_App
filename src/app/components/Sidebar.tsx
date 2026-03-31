import { useNavigate, useLocation } from "react-router";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard, Network, Users, UserPlus, User, LogOut
} from "lucide-react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // ✨ MAGIC: Gets the current URL path!

  // Helper function to figure out if a button should be highlighted
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Shared CSS for all buttons so we don't repeat Tailwind classes
  const baseBtnClass = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors";
  const inactiveBtnClass = "text-zinc-400 hover:bg-zinc-900 hover:text-white";
  const activeBtnClass = "bg-zinc-900 text-white";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col justify-start shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <img src="/Logo.png" alt="Nodify Logo" className="w-8 h-8 object-contain" />
        <div className="flex flex-col">
          <h2 className="text-xl text-white font-mono leading-none tracking-wide">Nodify</h2>
          <p className="text-[10px] font-mono text-[#4ADE80] mt-1.5 uppercase tracking-wider">Relationship Manager</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2 flex-1">
        <button onClick={() => navigate('/dashboard')} className={`${baseBtnClass} ${isActive('/dashboard') ? activeBtnClass : inactiveBtnClass}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </button>
        <button onClick={() => navigate('/mynodes')} className={`${baseBtnClass} ${isActive('/mynodes') ? activeBtnClass : inactiveBtnClass}`}>
          <Network className="w-4 h-4" />
          <span className="text-sm font-medium">My Nodes</span>
        </button>
        <button onClick={() => navigate('/subnodes')} className={`${baseBtnClass} ${isActive('/subnodes') ? activeBtnClass : inactiveBtnClass}`}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Subnodes</span>
        </button>
        <button onClick={() => navigate('/add')} className={`${baseBtnClass} ${isActive('/add') ? activeBtnClass : inactiveBtnClass}`}>
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Connect</span>
        </button>
      </nav>

      {/* Bottom Action Menu */}
      <div className="mt-auto pt-6 border-t border-zinc-800 space-y-2">
        <button onClick={() => navigate('/profile')} className={`${baseBtnClass} ${isActive('/profile') ? activeBtnClass : inactiveBtnClass}`}>
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Profile Settings</span>
        </button>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}