import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Sidebar } from "../components/Sidebar"; 
import confetti from "canvas-confetti";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { StatusBadge } from "../components/nodify/status-badge";
import { MonoText } from "../components/nodify/mono-text";
import {
  Search, Loader2, Percent, Calendar, Users, Mail, AlertCircle
} from "lucide-react";

 

export function Dashboard() {
  const navigate = useNavigate();
  // ✨ NEW: Mad Libs Onboarding State
  const [vipName, setVipName] = useState("");
  const [isAddingVip, setIsAddingVip] = useState(false);

  const [isFounderModalOpen, setIsFounderModalOpen] = useState(false);
  const [founderContactId, setFounderContactId] = useState<string | null>(null);
  // Add this right next to your other state variables
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeUserId, setActiveUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  // ✨ 1. Split the greeting and name into two separate states
  const [timeGreeting, setTimeGreeting] = useState("Hello");
  const [userName, setUserName] = useState("");
  // ✨ NEW: AI Draft Modal State
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftContact, setDraftContact] = useState<any>(null);
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    // ✨ 2. Calculate the time ONCE when the component loads
    const hour = new Date().getHours();
    
    // Added a custom greeting for late-night coding sessions!
    if (hour >= 0 && hour < 4) setTimeGreeting("You're up late"); 
    else if (hour < 12) setTimeGreeting("Good morning");
    else if (hour < 18) setTimeGreeting("Good afternoon");
    else setTimeGreeting("Good evening");

    // ✨ NEW: Function to instantly add the VIP
  
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Let the Traffic Cop handle kicking unauthenticated users out!
        if (!user) return; 

        setActiveUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, full_name') 
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile data:", profileError);
        }

        // ✨ We only set the name if it exists. No routing happens here!
        if (profile && profile.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }

        // 1. Fetch the Daily Action Candidates from your new SQL View
        const { data: actionsData, error: actionsError } = await supabase
          .from('daily_action_candidates')
          .select('*')
          .eq('user_id', user.id)
          .limit(3);

        if (actionsError) throw actionsError;
        setActionItems(actionsData || []);

        // 2. Fetch the full network for the table below
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('next_reconnect_date', { ascending: true });

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate, greeting]);
  const handleAddVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipName.trim() || !activeUserId) return;
    
    setIsAddingVip(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{
          user_id: activeUserId,
          name: vipName.trim(),
          warmth_level: 'warm' 
        }]);

      if (error) throw error;
      
      // 🎉 BOOM! Fire the confetti with custom Nodify colors
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ADE80', '#ffffff', '#22C55E'] 
      });
      
      setVipName("");
      
      // Delay the page reload for 1.5 seconds so they can see the confetti fall!
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);
      
    } catch (err) {
      console.error("Failed to add VIP:", err);
    } finally {
      setIsAddingVip(false);
    }
  };
  // ✨ NEW: Function to remove the Founder Easter Egg
  const handleRemoveFounder = async () => {
    if (!founderContactId) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', founderContactId);

      if (error) throw error;
      
      setIsFounderModalOpen(false);

      // ✨ NEW: Drop a cookie/flag in their browser so we remember!
      
      
      window.location.reload();
    } catch (err) {
      console.error("Failed to remove founder:", err);
    }
  };


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
  // ✨ NEW: The function that triggers the AI
  const handleOpenDraft = async (contact: any) => {
    // 1. Open the modal and set loading state
    setDraftContact(contact);
    setGeneratedDraft("");
    setIsDrafting(true);
    setIsDraftModalOpen(true);

    try {
      // 2. Call your new Edge Function
      const { data, error } = await supabase.functions.invoke('generate-email-draft', {
        body: { contact_id: contact.contact_id } // Note: daily_action_candidates uses 'contact_id'
      });

      if (error) throw error;
      
      // 3. Save the AI's response to state
      setGeneratedDraft(data.draft);
    } catch (err: any) {
      console.error("Draft generation failed:", err);
      setGeneratedDraft("Failed to generate draft. Please check your console.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendDraft = () => {
    // Opens the user's email client with the generated text pre-filled
    const subject = encodeURIComponent("Catching up!");
    const body = encodeURIComponent(generatedDraft);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsDraftModalOpen(false);
  };

  // Helper function to calculate the "Decay" text
  const getActionReason = (dateString: string) => {
    if (!dateString) return "No history recorded.";
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    
    if (days === 0) return "Added recently, needs initial outreach.";
    if (days < 30) return `Haven't spoken in ${days} days. Keep the momentum going.`;
    return `Relationship decaying. Haven't spoken in ${days} days.`;
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header & Search */}
          <div className="space-y-4">
          <h1 className="text-3xl text-white font-medium tracking-tight">
              {timeGreeting}{userName ? `, ${userName}` : ''}.
            </h1>
            <form onSubmit={handleSearch} className="relative flex items-center group">
              <Search className="absolute left-4 w-5 h-5 text-zinc-500 group-focus-within:text-[#4ADE80] transition-colors pointer-events-none" />
              <Input
                placeholder="Search your network brain (e.g., 'Who is dealing with startup law?')"
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

          {isSearching ? (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
              <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Scanning Network Brain...</p>
            </div>
          ) : hasSearched ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Semantic Matches</h2>
              {/* ... (Keep existing search results rendering exactly as it was) ... */}
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
                          </div>
                        </div>
                        <div className="flex-1 px-4">
                          <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-zinc-800 pl-4">"{result.notes}"</p>
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
            <div className="space-y-10 animate-in fade-in duration-300">
              {isLoading ? (
                <div className="text-center py-20 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
                  Loading your network...
                </div>
              ) : (
                <>
                  {/* ✨ THE NEW DAILY ACTION DASHBOARD */}
                  <div className="space-y-4">
                    <h2 className="text-lg text-white font-medium flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#4ADE80]" />
                      Needs Your Attention Today
                    </h2>
                    
                    <div className="grid gap-4">
                      {actionItems.length === 0 ? (
                        <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 text-center">
                          <p className="text-zinc-400">Your network is perfectly maintained. No immediate actions needed.</p>
                        </div>
                      ) : (
                        actionItems.map((item) => (
                          <div key={item.contact_id} className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl p-5 flex items-center justify-between group">
                            <div 
                              className="flex items-center gap-4 cursor-pointer" 
                              onClick={() => {
                                // ✨ HIJACK THE CLICK IF IT'S THE FOUNDER
                                if (item.name === 'Aadi Chahal') {
                                  setFounderContactId(item.contact_id);
                                  setIsFounderModalOpen(true);
                                } else {
                                  navigate(`/connection/${item.contact_id}`);
                                }
                              }}
                            >
                              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-[#4ADE80]">
                                {item.name === 'Aadi Chahal' ? '👋' : item.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-white font-medium group-hover:text-[#4ADE80] transition-colors">{item.name}</h3>
                                <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-2">
                                  {/* ✨ CUSTOM OVERRIDE FOR THE SUBTEXT */}
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.name === 'Aadi Chahal' ? 'bg-[#4ADE80]' : 'bg-red-500 animate-pulse'}`}></span>
                                  {item.name === 'Aadi Chahal' 
                                    ? "Click to read a message from the founder." 
                                    : getActionReason(item.last_touch_date)}
                                </p>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDraft(item); // ✨ Hijacked!
                              }}
                              className="bg-white hover:bg-zinc-200 text-black font-medium h-9 px-4 rounded-lg flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Draft Message
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ✨ CONDITIONAL: Mad Libs UI vs. The Full Table */}
                  {contacts.length === 0 || (contacts.length === 1 && contacts[0].name === 'Aadi Chahal') ? (
                    <div className="pt-12 pb-8 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-500">
                      <div className="text-center space-y-6 max-w-lg w-full">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-2xl">🌱</span>
                        </div>
                        <h2 className="text-2xl text-white font-medium">Let's plant the first seed.</h2>
                        <p className="text-zinc-400 text-sm">
                          Don't worry about uploading your entire address book right now. Just think about your immediate circle.
                        </p>
                        
                        <form onSubmit={handleAddVip} className="mt-8 relative group">
                          <p className="text-left text-sm font-mono text-[#4ADE80] mb-3 ml-2 uppercase tracking-wider">
                            Who is the last person you had coffee with?
                          </p>
                          <input
                            type="text"
                            value={vipName}
                            onChange={(e) => setVipName(e.target.value)}
                            disabled={isAddingVip}
                            placeholder="Type their name and press Enter..."
                            className="w-full bg-[#18181B] border-2 border-zinc-800 focus:border-[#4ADE80] focus:ring-0 text-white rounded-xl px-6 py-5 text-lg outline-none transition-all placeholder:text-zinc-600 disabled:opacity-50"
                            autoFocus
                          />
                          {isAddingVip && (
                            <Loader2 className="absolute right-6 top-[3.25rem] w-5 h-5 animate-spin text-[#4ADE80]" />
                          )}
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-zinc-800/50 animate-in fade-in duration-500">
                      <h2 className="text-lg text-white font-medium">Full Network Directory</h2>
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
                                    {connection.specializations?.slice(0, 2).map((tag: string) => (
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
                  )}

                </>
              )}
            </div>
          )}
        </div>
      </main>
      {/* ✨ NEW: The AI Draft Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <span className="text-[#4ADE80]">✨</span> Drafting to {draftContact?.name}
                </h3>
                <button 
                  onClick={() => setIsDraftModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {isDrafting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
                  <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Generating...</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <textarea 
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                    className="w-full h-48 bg-[#09090B] border border-zinc-800 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] rounded-xl p-4 text-zinc-300 text-sm leading-relaxed resize-none transition-all"
                    placeholder="Your draft will appear here..."
                  />
                  <div className="flex justify-end gap-3">
                    <Button 
                      onClick={() => setIsDraftModalOpen(false)}
                      variant="ghost" 
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendDraft}
                      className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium px-6"
                    >
                      Open in Email App
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ✨ NEW: Paste the Founder Welcome Modal right here! */}
      {isFounderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-8 space-y-6">
              
              <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl">
                  👋
                </div>
                <div>
                  <h3 className="text-xl text-white font-medium">Welcome to Nodify.</h3>
                  <p className="text-[#4ADE80] text-sm font-mono tracking-wide">BY AADI CHAHAL</p>
                </div>
              </div>

              <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                <p>Hey there,</p>
                <p>
                  I built Nodify because I realized something important: maintaining a strong network shouldn't feel like a chore, and you shouldn't have to stare at a blank screen wondering what to say to someone you haven't spoken to in months.
                </p>
                <p>
                  Nodify is designed to be your relationship intelligence layer. It tells you who you need to talk to, and uses AI to help you figure out exactly what to say based on your past interactions. 
                </p>
                <p>
                  This profile is just a sandbox for you to test out the "Draft Message" feature. Once you get the hang of it, feel free to remove me and start adding your own real network. 
                </p>
                <p className="font-medium text-white pt-2">
                  Happy connecting,<br/>Aadi
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-zinc-800/50">
                <Button 
                  onClick={() => setIsFounderModalOpen(false)}
                  variant="ghost" 
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Keep on Dashboard
                </Button>
                <Button 
                  onClick={handleRemoveFounder}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-medium px-6 border border-red-500/20 transition-all"
                >
                  Remove Founder
                </Button>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}