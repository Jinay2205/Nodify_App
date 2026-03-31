import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Ask Supabase if there is a mathematically valid login token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/'); // ✨ Kicks them back to your root Auth screen!
      } else {
        setIsAuthenticated(true); // Let them in
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
      </div>
    );
  }

  return <>{children}</>;
}