import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Sidebar } from "../components/Sidebar";
import {
  LayoutDashboard, Network, Users, UserPlus, Loader2, GraduationCap, MapPin, ArrowRight
} from "lucide-react";
import { MonoText } from "../components/nodify/mono-text";
import { StatusBadge } from "../components/nodify/status-badge";

export function Subnodes() {
  const navigate = useNavigate();
  
  const [userSchool, setUserSchool] = useState<string>("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubnodesData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('school')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const schoolTerm = profile?.school || "";
        setUserSchool(schoolTerm);

        if (!schoolTerm) {
          setIsLoading(false);
          return;
        }

        // ✨ THE SMART QUERY FIX: Strip common words so "Rice University" becomes "Rice"
        // This guarantees we catch alumni whether the AI saved them as "Rice" or "Rice University"
        const searchKeyword = schoolTerm.replace(/ University| College| Institute/gi, '').trim();

        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .ilike('school', `%${searchKeyword}%`) 
          .order('warmth_level', { ascending: false });

        if (contactsError) throw contactsError;
        setAlumni(contacts || []);

      } catch (error) {
        console.error("Error fetching subnodes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubnodesData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-gradient-to-br from-[#18181B] to-[#09090B] border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <GraduationCap className="w-32 h-32 text-[#4ADE80]" />
            </div>
            
            <h1 className="text-3xl text-white font-medium mb-2">University Subnode</h1>
            <p className="text-zinc-400 max-w-lg">
              Tap into your alumni network. These connections share your educational background, making them your warmest leads for introductions and advice.
            </p>
            
            <div className="mt-6 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
              <MapPin className="w-4 h-4 text-[#4ADE80]" />
              <MonoText className="text-sm text-white">Filtering by: {userSchool || "Your University"} Alumni</MonoText>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : !userSchool ? (
             <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 font-mono">You haven't set a university in your profile yet.</p>
            </div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 font-mono">No alumni found in your network yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alumni.map((person) => (
                <div 
                  key={person.id} 
                  onClick={() => navigate(`/connection/${person.id}`)}
                  className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all rounded-xl p-6 cursor-pointer group flex flex-col justify-between h-48"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg text-white font-medium group-hover:text-[#4ADE80] transition-colors">{person.name}</h3>
                        <p className="text-sm text-zinc-500 font-mono">{person.education_level || "Alumni"}</p>
                      </div>
                      {/* Safety fallback for warmth level */}
                      <StatusBadge level={person.warmth_level?.toLowerCase() || 'neutral'} />
                    </div>
                    
                    <div className="flex gap-1.5 flex-wrap">
                    {/* ✨ THE BULLETPROOF FIX: Check if it's actually an array before trying to slice it! */}
                    {Array.isArray(person.specializations) && person.specializations.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
                    <MonoText className="text-xs text-zinc-500">
                      {person.next_reconnect_date ? `Reconnect: ${new Date(person.next_reconnect_date + 'T12:00:00').toLocaleDateString()}` : "No reconn set"}
                    </MonoText>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#4ADE80] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}