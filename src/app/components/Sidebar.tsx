import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard, Network, Users, UserPlus, User, LogOut, Inbox
} from "lucide-react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); 

  // ✨ NEW: State to hold the number of unread requests
  const [pendingCount, setPendingCount] = useState(0);

  // ✨ NEW: Fetch the count of pending requests
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // We use { count: 'exact', head: true } because we don't need the actual data, just the number!
        const { count, error } = await supabase
          .from('connection_requests')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchPendingCount();
  }, [location.pathname]); // Re-runs every time the user navigates to a new page!

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

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
        
        {/* ✨ UPDATED INBOX BUTTON WITH NOTIFICATION BADGE */}
        <button onClick={() => navigate('/inbox')} className={`${baseBtnClass} ${isActive('/inbox') ? activeBtnClass : inactiveBtnClass} justify-between`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Inbox className="w-4 h-4" />
              {/* Little red dot on the icon itself */}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#09090B]" />
              )}
            </div>
            <span className="text-sm font-medium">Inbox</span>
          </div>
          
          {/* Number badge on the right side */}
          {pendingCount > 0 && (
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full animate-in zoom-in duration-300">
              {pendingCount}
            </span>
          )}
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