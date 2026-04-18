import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Sidebar } from "../components/Sidebar"; 
import { Telescope, Search, Loader2, UserPlus, CheckCircle2, Info } from "lucide-react";

export function GrowPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const [fetchingEmailIdx, setFetchingEmailIdx] = useState<number | null>(null);
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [customReasons, setCustomReasons] = useState<Record<number, string>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ✨ THE FIX 1: The Lasso. We store the interval ID here so it can't escape and become a ghost.
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✨ THE FIX 2: Cleanup on Unmount. If the user clicks the Sidebar and goes to the 
  // Dashboard while a search is running, this instantly kills the background polling.
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleFindEmail = async (person: any, idx: number) => {
    setFetchingEmailIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('sixtyfour-email', {
        body: { name: person.name, company: person.company }
      });

      if (error) throw error;

      const foundEmail = data.email && data.email.length > 0 ? data.email[0][0] : "No email found";
      setEmails(prev => ({ ...prev, [idx]: foundEmail }));
    } catch (err) {
      console.error(err);
      setEmails(prev => ({ ...prev, [idx]: "Error finding email" }));
    } finally {
      setFetchingEmailIdx(null);
    }
  };

  const evaluateProfiles = async (scoutedProfiles: any[], originalQuery: string) => {
    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('llama-evaluator', {
        body: { originalQuery, profiles: scoutedProfiles }
      });

      if (error) throw error;

      const reasonsMap: Record<number, string> = {};
      data.reasons.forEach((reason: string, idx: number) => {
        reasonsMap[idx] = reason;
      });
      
      setCustomReasons(reasonsMap);
    } catch (err) {
      console.error("Llama Evaluation Failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    // ✨ THE FIX 3: If they somehow start a new search, violently kill the old polling loop first.
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setIsSearching(true);
    setResults([]);
    setStatusMessage("Initializing AI Scout...");

    const numbersFound = query.match(/\d+/g); 
    let displayLimit = 10; 

    if (numbersFound) {
      let firstNum = parseInt(numbersFound[0], 10);
      if (firstNum > 50) {
        displayLimit = 10; 
      } else {
        displayLimit = firstNum;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('sixtyfour-grow', {
        body: { query },
      });

      if (error) throw error;

      const taskId = data.task_id;
      let attempts = 0;
      const maxAttempts = 40; 

      // ✨ THE FIX 4: Assign the loop to our lasso (useRef)
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        setStatusMessage(`Agent is researching live web... (${attempts})`);
        
        const { data: statusData, error: pollError } = await supabase.functions.invoke('sixtyfour-status', {
          body: { task_id: taskId }
        });

        // ✨ THE FIX 5: The 502 Bypass. 
        // If Cloudflare throws a fit and drops a packet, we DO NOT crash the app anymore.
        // We just log a warning and let the interval try again in 3 seconds.
        if (pollError) {
          console.warn("Network hiccup during poll, trying again...", pollError);
          return; // Exits this specific loop cycle, but keeps the interval alive!
        }

        if (statusData?.status === "completed" || statusData?.status === "finished") {
          const extractedResults = 
            statusData.results || 
            statusData.output?.people || 
            statusData.output || 
            statusData.data || 
            [];
            
          const finalArray = Array.isArray(extractedResults) ? extractedResults : [];
          
          setResults(finalArray.slice(0, displayLimit));
          evaluateProfiles(finalArray.slice(0, displayLimit), query);
          
          setIsSearching(false);
          setStatusMessage("");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }

        if (attempts >= maxAttempts) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsSearching(false);
          setStatusMessage("Search timed out. Try a more specific prompt.");
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setIsSearching(false);
      setStatusMessage("Error connecting to AI Scout.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex"> 
        <Sidebar /> 
      <main className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Telescope className="w-6 h-6 text-[#4ADE80]" />
          <h1 className="text-2xl font-semibold text-white">Network Growth Engine</h1>
        </div>
        <p className="text-zinc-400">Describe your ideal nodes. Our AI agent will scout the web to find them.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-12">
        <div className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Rice University alumni at Evercore in Houston..."
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#4ADE80] rounded-xl px-5 py-4 text-white outline-none transition-all pr-32"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 bottom-2 bg-[#4ADE80] hover:bg-[#22C55E] disabled:bg-zinc-800 disabled:text-zinc-500 text-black px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isSearching ? "Scouting..." : "Grow"}
          </button>
        </div>
        {statusMessage && (
          <p className="mt-3 text-xs font-mono text-zinc-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-pulse" />
            {statusMessage}
          </p>
        )}
      </form>

      {/* Results Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.length > 0 && results.map((person, idx) => (
          <div key={idx} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col justify-between">
            
            {/* Top section: Name, Title, Reason */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-medium text-lg">{person.name || person.full_name}</h3>
                  <p className="text-[#4ADE80] text-sm">{person.role || person.job_title || person.current_role}</p>
                  <p className="text-zinc-500 text-xs mt-1">{person.company || person.organization}</p>
                </div>
                <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#4ADE80] transition-colors">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50 mb-4 min-h-[60px]">
                {isEvaluating && !customReasons[idx] ? (
                  <p className="text-zinc-500 text-xs italic flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-[#4ADE80]" />
                    Llama is evaluating strategic fit...
                  </p>
                ) : (
                  <p className="text-zinc-300 text-xs leading-relaxed italic">
                    "{customReasons[idx] || person.reasoning || "Matched based on your query criteria."}"
                  </p>
                )}
              </div>
            </div>

            {/* Bottom row: LinkedIn Link and Email Unlock Button */}
            <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-3">
              
              {/* Left side: LinkedIn */}
              <div>
                {(person.linkedin || person.linkedin_url) ? (
                  <a 
                    href={person.linkedin || person.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-block text-[10px] text-zinc-500 font-mono hover:text-[#4ADE80] uppercase tracking-widest transition-colors"
                  >
                    View Profile →
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">No Profile</span>
                )}
              </div>

              {/* Right side: Email Unlocker */}
              <div className="text-right">
                {emails[idx] ? (
                  <span className="text-sm font-mono text-[#4ADE80] select-all bg-[#4ADE80]/10 px-2 py-1 rounded">
                    {emails[idx]}
                  </span>
                ) : (
                  <button 
                    onClick={() => handleFindEmail(person, idx)}
                    disabled={fetchingEmailIdx === idx || !person.company}
                    className="text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                  >
                    {fetchingEmailIdx === idx ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      "Unlock Email"
                    )}
                  </button>
                )}
              </div>
              
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!isSearching && results.length === 0 && (
        <div className="max-w-4xl mx-auto border border-dashed border-zinc-800 rounded-2xl py-20 text-center">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">Your AI Scout is standing by.</p>
        </div>
      )}
      </main>
    </div>
  );
}