import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation(); // Helps us know what page they are trying to access
  const [isLoading, setIsLoading] = useState(true); // Default to true!

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Not logged in? Kick them to the login screen.
      if (!session) {
        navigate('/');
        return;
      }

      // 2. Safely grab the timestamps
      // (Fallback to created_at if last_sign_in_at is undefined for some reason)
      const createdAt = new Date(session.user.created_at).getTime();
      const lastSignIn = new Date(session.user.last_sign_in_at || session.user.created_at).getTime();

      // ✨ THE FIX: Supabase timestamps can sometimes be a few milliseconds apart. 
      // Checking if they happened within 5 seconds of each other is bulletproof.
      const isNewUser = Math.abs(lastSignIn - createdAt) < 5000;

      // 3. The Traffic Cop Logic
      if (isNewUser && location.pathname !== '/onboarding') {
        // If they are new, but trying to go anywhere else, force them to onboarding
        navigate('/onboarding');
      } else {
        // If they are an old user, OR if they are already on the onboarding page, let them render the page!
        setIsLoading(false); 
      }
    };
    
    checkAuthAndRoute();
  }, [navigate, location.pathname]);

  // While the traffic cop is thinking, show a sleek full-screen loader. 
  // No dashboard flicker!
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

  // Once isLoading is false, paint the actual page.
  return <>{children}</>;
}