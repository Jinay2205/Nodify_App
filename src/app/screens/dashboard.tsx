import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Sidebar } from "../components/Sidebar"; 
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { StatusBadge } from "../components/nodify/status-badge";
import { MonoText } from "../components/nodify/mono-text";
import {
  Search, TrendingUp, TrendingDown, Minus, Loader2, Percent, Calendar, Users
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // ✨ NEW: Global state to hold the real user ID for the search bar
  const [activeUserId, setActiveUserId] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // 1. Ask Supabase who just landed on this page
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/'); // ✨ Updated to point to your root auth page
          return;
        }

        // ✨ Save the real ID to state so handleSearch can use it!
        setActiveUserId(user.id);

        // 2. THE NEW BOUNCER: Check if they exist in your public table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        // If there is an error finding them, it means they don't exist yet!
        if (profileError || !profile) {
          navigate('/onboarding');
          return; // Stop running the dashboard logic and route them away
        }

        // 3. They exist! Fetch their specific contacts using their real ID
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('next_reconnect_date', { ascending: true });

        if (error) throw error;
        setContacts(data || []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    
    fetchContacts();
  }, [navigate]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !activeUserId) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // ✨ Cleaned this up! The library will automatically attach the Token AND the API Key.
      const { data, error } = await supabase.functions.invoke('search-interactions', {
        body: { search_query: searchQuery, user_id: activeUserId } 
      });
      
      if (error) throw error;
      
      setSearchResults(data.results || []);
    } catch (err: any) {
      console.error("Search failed:", err);
      alert("Search Error: " + (err.message || "Check the console for details."));
    } finally {
      setIsSearching(false);
    }
  };
  
  const nextReconns = [...contacts]
    .filter(c => c.next_reconnect_date)
    .sort((a, b) => new Date(a.next_reconnect_date).getTime() - new Date(b.next_reconnect_date).getTime())
    .slice(0, 3);

  const warmthStats = {
    warm: contacts.filter((c) => c.warmth_level?.toLowerCase() === "warm").length,
    neutral: contacts.filter((c) => c.warmth_level?.toLowerCase() === "neutral").length,
    cool: contacts.filter((c) => c.warmth_level?.toLowerCase() === "cool").length,
  };

  const totalConnections = contacts.length || 1; 

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header & Search */}
          <div className="space-y-4">
            <h1 className="text-2xl text-white font-medium">Welcome to Nodify</h1>
            <form onSubmit={handleSearch} className="relative flex items-center group">
              <Search className="absolute left-4 w-5 h-5 text-zinc-500 group-focus-within:text-[#4ADE80] transition-colors pointer-events-none" />
              <Input
                placeholder="e.g., 'Who is dealing with startup law and likes F1?'"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === "") {
                    setHasSearched(false);
                    setSearchResults([]);
                  }
                }}
                className="pl-12 pr-24 bg-[#18181B] border-zinc-800 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] text-white placeholder:text-zinc-600 h-14 w-full rounded-xl text-base transition-all"
              />
              <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="absolute right-2 h-10 px-6 bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium rounded-lg">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </form>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          {isSearching ? (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
              <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Scanning Network Brain...</p>
            </div>
          ) : hasSearched ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Semantic Matches</h2>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-16 bg-[#18181B] border border-zinc-800 rounded-xl">
                  <p className="text-zinc-400">No semantic matches found for "{searchQuery}".</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {searchResults.map((result, index) => (
                    <div key={index} onClick={() => navigate(`/connection/${result.contact_id}`)} className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all rounded-xl p-6 cursor-pointer group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                            <Users className="w-5 h-5 text-zinc-400 group-hover:text-[#4ADE80] transition-colors" />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-[#4ADE80] transition-colors">{result.contact_name}</p>
                            <p className="text-xs text-zinc-500 font-mono">ID: {result.contact_id.substring(0, 8)}...</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 px-4">
                          <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-zinc-800 pl-4">"{result.notes}"</p>
                          <div className="flex items-center gap-4 mt-3 pl-4">
                            <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 uppercase">
                              <Calendar className="w-3 h-3" />
                              {new Date(result.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                              {result.interaction_type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#4ADE80]/10 border border-[#4ADE80]/20 px-3 py-1.5 rounded-full shrink-0">
                          <Percent className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span className="text-xs font-mono text-[#4ADE80] font-medium">{Math.round(result.similarity * 100)}% Match</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {isLoadingContacts ? (
                <div className="text-center py-20 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
                  Loading your network...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 space-y-4">
                      <h3 className="text-white flex items-center gap-2 font-medium">
                        <span className="text-[#4ADE80]">▸</span> Next Reconns
                      </h3>
                      <div className="space-y-1">
                        {nextReconns.map((person) => (
                          <div key={person.id} onClick={() => navigate(`/connection/${person.id}`)} className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors">
                            <div className="flex flex-col gap-1.5">
                              <MonoText className="text-sm text-white font-medium">{person.name}</MonoText>
                              <MonoText className="text-xs text-zinc-500">
                                {person.next_reconnect_date ? `Reconnect by: ${new Date(person.next_reconnect_date + 'T12:00:00').toLocaleDateString()}` : "No date set"}
                              </MonoText>
                            </div>
                            <StatusBadge level={person.warmth_level?.toLowerCase()} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 space-y-5">
                      <h3 className="text-white flex items-center gap-2 font-medium">
                        <span className="text-[#4ADE80]">▸</span> Warmth Scale
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                          <div className="flex-1 bg-zinc-900 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(warmthStats.warm / totalConnections) * 100}%` }} />
                          </div>
                          <MonoText className="text-xs w-20 text-right">{warmthStats.warm} Warm</MonoText>
                        </div>
                        <div className="flex items-center gap-3">
                          <Minus className="w-4 h-4 text-zinc-400" />
                          <div className="flex-1 bg-zinc-900 rounded-full h-2">
                            <div className="bg-zinc-500 h-2 rounded-full" style={{ width: `${(warmthStats.neutral / totalConnections) * 100}%` }} />
                          </div>
                          <MonoText className="text-xs w-20 text-right">{warmthStats.neutral} Neutral</MonoText>
                        </div>
                        <div className="flex items-center gap-3">
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                          <div className="flex-1 bg-zinc-900 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(warmthStats.cool / totalConnections) * 100}%` }} />
                          </div>
                          <MonoText className="text-xs w-20 text-right">{warmthStats.cool} Cool</MonoText>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl text-white font-medium">Your Network</h2>
                    </div>

                    <div className="bg-[#18181B] border border-zinc-800 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">Name</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">School</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">Education Level</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">ICP</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">Next Reconnect</TableHead>
                            <TableHead className="text-zinc-400 font-mono text-xs h-10">Warmth</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((connection) => (
                            <TableRow key={connection.id} className="border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors" onClick={() => navigate(`/connection/${connection.id}`)}>
                              <TableCell className="text-white font-medium py-3">{connection.name}</TableCell>
                              <TableCell className="py-3"><MonoText className="text-sm text-zinc-300">{connection.school}</MonoText></TableCell>
                              <TableCell className="py-3"><MonoText className="text-sm text-zinc-300">{connection.education_level}</MonoText></TableCell>
                              
                              <TableCell className="py-3">
                                <div className="flex gap-1.5 flex-wrap">
                                  {connection.specializations?.map((tag: string) => (
                                    <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md font-mono">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              
                              <TableCell className="py-3">
                                <MonoText className="text-sm text-zinc-300">
                                  {connection.next_reconnect_date ? new Date(connection.next_reconnect_date + 'T12:00:00').toLocaleDateString() : 'N/A'}
                                </MonoText>
                              </TableCell>
                              
                              <TableCell className="py-3">
                                <StatusBadge level={connection.warmth_level?.toLowerCase()} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}