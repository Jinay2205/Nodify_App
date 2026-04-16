import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router"; 
import { supabase } from "../../lib/supabase"; 
import { Loader2 } from "lucide-react";

// ✨ FIX 1: No more { children } props!
export function ProtectedRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      // 1. Check for a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      // ✨ FIX 2: The Bulletproof Database Check
      // We ask the database if they have a name saved instead of guessing with timestamps.
      const { data: profile } = await supabase
        .from('users')
        .select('full_name') // (Change this to 'has_onboarded' if you added that column!)
        .eq('id', session.user.id)
        .single();

      // If they don't have a name saved, they need to onboard.
      const needsOnboarding = !profile?.full_name;

      // 3. The Traffic Cop Directives
      if (needsOnboarding && location.pathname !== '/onboarding') {
        // Stop! You haven't finished onboarding.
        navigate('/onboarding');
      } else if (!needsOnboarding && location.pathname === '/onboarding') {
        // Stop! You already onboarded, you shouldn't be here.
        navigate('/dashboard');
      } else {
        // Green light! 
        setIsLoading(false); 
      }
    };
    
    checkAuthAndRoute();
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80] mb-4" />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Authenticating Node...
        </p>
      </div>
    );
  }

  // ✨ FIX 3: Return <Outlet /> so React Router can inject the correct page
  return <Outlet />;
}