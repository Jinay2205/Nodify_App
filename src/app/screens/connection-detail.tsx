import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { 
  Sparkles, Mail, Phone, Video, Play, Loader2, Coffee, ArrowLeft, Calendar, ChevronDown
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const getIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "email": return <Mail className="w-4 h-4 text-[#4ADE80]" />;
    case "phone": return <Phone className="w-4 h-4 text-[#4ADE80]" />;
    case "video": return <Video className="w-4 h-4 text-[#4ADE80]" />;
    case "in-person": return <Coffee className="w-4 h-4 text-[#4ADE80]" />;
    default: return <Mail className="w-4 h-4 text-[#4ADE80]" />;
  }
};

export function ConnectionDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // --- REAL DATABASE STATE ---
  const [contact, setContact] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);


  const [newNote, setNewNote] = useState("");
  const [interactionType, setInteractionType] = useState("video");
  const [isLogging, setIsLogging] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // --- RECONNECT LOGIC STATE ---
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [reconnectDate, setReconnectDate] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>(""); // Holds the date while typing

  // 1. FETCH THE PROFILE DATA
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', id)
          .single(); 

        if (error) throw error;
        setContact(data);
        setReconnectDate(data.next_reconnect_date); 
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [id]);

  // 2. FETCH THE TIMELINE HISTORY
  const fetchHistory = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('id, created_at, interaction_type, notes')
        .eq('contact_id', id) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [id]);

  // --- RECONNECT UPDATE FUNCTION ---
  const handleDateUpdate = async (value: string) => {
    if (value === "custom") {
      setShowCustomPicker(true);
      setTempDate(""); // Clear any old input
      return; 
    }

    setIsUpdatingDate(true);
    try {
      let newDateStr = value;

      // Handle the quick 7, 10, 15 day jumps
      if (value === "7" || value === "10" || value === "15") {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(value));
        newDateStr = futureDate.toISOString().split('T')[0]; 
      }

      // Final safety check to make sure we don't send an empty string to the DB
      if (!newDateStr) {
        setShowCustomPicker(false);
        return;
      }

      const { error } = await supabase
        .from('contacts')
        .update({ next_reconnect_date: newDateStr })
        .eq('id', id); 

      if (error) throw error;
      
      setReconnectDate(newDateStr);
      setShowCustomPicker(false); // Close the picker on success

    } catch (error) {
      console.error("Failed to update reconnect date:", error);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // 3. LOG NEW INTERACTION
  // 3. LOG NEW INTERACTION
  const handleLogInteraction = async () => {
    if (!newNote.trim() || !id) return;
    setIsLogging(true);

    try {
      // ✨ NEW: Dynamically grab the real, currently logged-in user!
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error } = await supabase.functions.invoke('embed-interaction', {
        body: {
          user_id: user.id,
          contact_id: id, 
          notes: newNote,
          interaction_type: interactionType,
          interaction_date: new Date().toISOString().split('T')[0] // ✨ ADDED THIS!
        }
      });

      if (error) throw error;
      
      setNewNote(""); 
      await fetchHistory(); 
    } catch (err) {
      console.error("Error logging interaction:", err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: { contact_id: id }
      });
      
      if (error) throw error;
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error generating suggestions:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Loading State
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
      </div>
    );
  }

  // Not Found State
  if (!contact) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-white space-y-4">
        <p>Contact not found.</p>
        <Button onClick={() => navigate('/')} className="bg-[#18181B] hover:bg-zinc-800 text-white border border-zinc-700">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      
      {/* Left Sidebar (Profile Details) */}
      <aside className="w-80 border-r border-zinc-800 p-8 flex flex-col gap-6 relative">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mt-8">
          <h1 className="text-3xl text-white font-medium">{contact.name}</h1>
          
          {/* --- RECONNECT DROPDOWN UI --- */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              NEXT RECONNECT
            </div>

            {showCustomPicker ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] rounded-lg px-3 py-1.5 text-sm text-white font-mono outline-none cursor-pointer [color-scheme:dark]"
                  autoFocus
                />
                <button 
                  onClick={() => handleDateUpdate(tempDate)}
                  disabled={!tempDate || isUpdatingDate}
                  className="text-xs bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {isUpdatingDate ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                </button>
                <button 
                  onClick={() => setShowCustomPicker(false)}
                  className="text-xs text-zinc-500 hover:text-white transition-colors px-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative group w-fit">
                <select
                  value=""
                  onChange={(e) => handleDateUpdate(e.target.value)}
                  disabled={isUpdatingDate}
                  className="appearance-none bg-[#18181B] border border-zinc-800 hover:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-sm text-[#4ADE80] font-mono cursor-pointer transition-colors outline-none focus:ring-1 focus:ring-[#4ADE80] disabled:opacity-50"
                >
                  <option value="" disabled hidden>
                    {reconnectDate 
                      ? new Date(reconnectDate + 'T12:00:00').toLocaleDateString() 
                      : "Set Date..."}
                  </option>
                  <option value="7" className="bg-zinc-900 text-white py-2">In 7 Days</option>
                  <option value="10" className="bg-zinc-900 text-white py-2">In 10 Days</option>
                  <option value="15" className="bg-zinc-900 text-white py-2">In 15 Days</option>
                  <option value="custom" className="bg-zinc-900 text-[#4ADE80] py-2">Custom Date...</option>
                </select>
                
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  {isUpdatingDate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4ADE80]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-mono text-zinc-500">School</p>
            <p className="text-sm text-white">{contact.school || "N/A"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono text-zinc-500">Education Level</p>
            <p className="text-sm text-white">{contact.education_level || "N/A"}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono text-zinc-500">Interests</p>
            <div className="flex gap-2 flex-wrap">
              {contact.specializations?.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-800 my-2" />

        <div className="space-y-3">
          <p className="text-xs font-mono text-zinc-500">Current Warmth Level</p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded font-mono capitalize">
              {contact.warmth_level || "Neutral"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content (Intelligence Feed) */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl space-y-8">
          
          {/* Action Card */}
          <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg text-white font-medium flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#4ADE80]" />
                  Next Interaction Suggestions
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Generate personalized icebreaker suggestions based on past interactions and mutual interests.
                </p>
              </div>
              
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
                className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Thinking...</>
                ) : "Generate Suggestions"}
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 space-y-3 pt-4 border-t border-zinc-800">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 leading-relaxed">
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Log Section */}
          <div className="space-y-6">
            <h3 className="text-white text-lg font-medium flex items-center gap-2">
              <Play className="w-3 h-3 text-[#4ADE80] fill-[#4ADE80]" />
              Relationship Log
            </h3>

            {/* Log Interaction Form */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-5 flex gap-4">
              <div className="w-32 shrink-0">
                <Select value={interactionType} onValueChange={setInteractionType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 space-y-3">
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4ADE80] resize-none"
                  placeholder={`Summarize your meeting notes with ${contact.name.split(' ')[0]} here...`}
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleLogInteraction}
                    disabled={!newNote.trim() || isLogging}
                    className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium"
                  >
                    {isLogging ? "Logging..." : "Log Interaction"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Timeline Feed */}
            <div className="relative pl-4 border-l border-zinc-800 ml-4 space-y-6 pt-2">
              {isLoadingHistory ? (
                <div className="text-zinc-500 text-sm ml-4">Loading history...</div>
              ) : interactions.length === 0 ? (
                <div className="text-zinc-500 text-sm ml-4">No interactions logged yet.</div>
              ) : (
                interactions.map((interaction) => (
                  <div key={interaction.id} className="relative">
                    <div className="absolute -left-[33px] top-1 w-8 h-8 rounded-full border border-zinc-700 bg-[#18181B] flex items-center justify-center">
                      {getIcon(interaction.interaction_type)}
                    </div>
                    <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-5 ml-4">
                      <p className="text-[#4ADE80] font-mono text-xs mb-2 uppercase tracking-wider">
                        {formatDate(interaction.created_at)} • {interaction.interaction_type}
                      </p>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {interaction.notes}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      </main>
      
    </div>
  );
}