import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Loader2, User, Calendar, Percent } from "lucide-react";
import { Button } from "../components/ui/button";

export function SearchDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const USER_ID = "dummy-user-123";

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // 🚀 UPGRADED LOGGING CONTEXT 🚀
      console.log("----------------------------------------");
      console.log("🔍 INIT SEMANTIC SEARCH PIPELINE");
      console.log("👤 Auth:", USER_ID);
      console.log("📝 Raw Query:", query);
      console.log("⏳ Routing to Edge Function for vectorization...");

      const startTime = performance.now();

      const { data, error } = await supabase.functions.invoke('search-interactions', {
        body: { 
          search_query: query,
          user_id: USER_ID 
        }
      });

      if (error) throw error;
      
      const endTime = performance.now();
      
      console.log("✅ PIPELINE SUCCESS");
      console.log(`⏱️ Latency: ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Total Matches Found: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        console.log("🎯 TOP MATCH:");
        console.log(`   Confidence: ${Math.round(data.results[0].similarity * 100)}%`);
        console.log(`   Type: ${data.results[0].interaction_type}`);
        console.log(`   Note: "${data.results[0].notes}"`);
        console.log("📦 Full Database Payload:", data.results);
      } else {
        console.log("⚠️ No matches broke the similarity threshold.");
      }
      console.log("----------------------------------------");

      setResults(data.results || []);

    } catch (err) {
      console.error("❌ SEARCH PIPELINE FAILED:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white p-12 flex flex-col items-center">
      
      {/* Header & Search Bar */}
      <div className="w-full max-w-3xl space-y-8 mb-12">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-medium tracking-tight">Intelligence Search</h1>
          <p className="text-zinc-400">Search across all your network interactions by concept, not just keywords.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-[#4ADE80] transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'fast cars and corporate law' or 'Redmond intro'"
            className="w-full bg-[#18181B] border border-zinc-800 focus:border-[#4ADE80] rounded-2xl py-4 pl-12 pr-32 text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#4ADE80] transition-all shadow-lg"
          />
          <div className="absolute inset-y-2 right-2">
            <Button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-full bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium rounded-xl px-6"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </Button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      <div className="w-full max-w-3xl space-y-4">
        {isSearching ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            <p>Scanning your network's brain...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-20 bg-[#18181B] border border-zinc-800 rounded-2xl">
            <p className="text-zinc-400">No semantic matches found for "{query}".</p>
          </div>
        ) : (
          results.map((result, index) => (
            <div 
              key={index} 
              className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Contact Match</p>
                    <p className="text-xs text-zinc-500 font-mono">ID: {result.contact_id.substring(0, 8)}...</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-[#4ADE80]/10 border border-[#4ADE80]/20 px-3 py-1.5 rounded-full">
                  <Percent className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span className="text-xs font-mono text-[#4ADE80] font-medium">
                    {Math.round(result.similarity * 100)}% Match
                  </span>
                </div>
              </div>

              <div className="pl-13">
                <p className="text-zinc-300 leading-relaxed">
                  {result.notes}
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 uppercase">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(result.created_at)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                    {result.interaction_type}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}