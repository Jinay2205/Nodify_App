import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Sidebar } from "../components/Sidebar"; 
import {
  LayoutDashboard, Network, Users, UserPlus, Loader2, FolderHeart, ArrowRight, Briefcase
} from "lucide-react";
import { MonoText } from "../components/nodify/mono-text";
import { StatusBadge } from "../components/nodify/status-badge";

export function MyNodes() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllContacts = async () => {
      try {
        // ✨ NEW: Dynamically grab the real, currently logged-in user!
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id) // ✨ Uses the real ID securely
          .order('name', { ascending: true });

        if (error) throw error;
        setContacts(data || []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllContacts();
  }, [navigate]);

  // GROUP THE CONTACTS BY PRIMARY INTEREST
  const groupedContacts = contacts.reduce((acc: any, contact: any) => {
    const category = contact.primary_interest || "Uncategorized / Exploring";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(contact);
    return acc;
  }, {});

  // Sort categories alphabetically, but push "Uncategorized" to the bottom
  const sortedCategories = Object.keys(groupedContacts).sort((a, b) => {
    if (a.includes("Uncategorized")) return 1;
    if (b.includes("Uncategorized")) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="space-y-2">
            <h1 className="text-3xl text-white font-medium flex items-center gap-3">
              <Network className="w-8 h-8 text-[#4ADE80]" />
              Network Directory
            </h1>
            <p className="text-zinc-400">
              A complete bird's-eye view of your entire network, automatically grouped by industry and primary interest.
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 font-mono">Your network is empty. Time to add some nodes!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedCategories.map((category) => (
                <div key={category} className="space-y-4">
                  
                  {/* Category Header */}
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                    <div className="p-1.5 bg-[#4ADE80]/10 rounded-md">
                      {category.includes("Uncategorized") ? (
                        <FolderHeart className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Briefcase className="w-4 h-4 text-[#4ADE80]" />
                      )}
                    </div>
                    <h2 className="text-lg font-medium text-white">{category}</h2>
                    <MonoText className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full ml-2">
                      {groupedContacts[category].length} Nodes
                    </MonoText>
                  </div>

                  {/* Grid of Contacts in this Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedContacts[category].map((person: any) => (
                      <div 
                        key={person.id} 
                        onClick={() => navigate(`/connection/${person.id}`)}
                        className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all rounded-xl p-5 cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-base text-white font-medium group-hover:text-[#4ADE80] transition-colors truncate pr-2">
                              {person.name}
                            </h3>
                            <StatusBadge level={person.warmth_level?.toLowerCase()} />
                          </div>
                          
                          <div className="flex gap-1.5 flex-wrap">
                            {person.specializations?.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded-md font-mono truncate max-w-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-auto">
                          <MonoText className="text-[10px] text-zinc-500">
                            {person.school || "Unknown Alma Mater"}
                          </MonoText>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#4ADE80] transition-colors shrink-0" />
                        </div>
                      </div>
                    ))}
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