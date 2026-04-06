import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Sidebar } from "../components/Sidebar";
import { Loader2, GraduationCap, MapPin, UserPlus, Check, Clock, UserMinus } from "lucide-react";
import { MonoText } from "../components/nodify/mono-text";

export function Subnodes() {
  const navigate = useNavigate();
  
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [userSchool, setUserSchool] = useState<string>("");
  const [globalAlumni, setGlobalAlumni] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);

  useEffect(() => {
    fetchSubnodesData();
  }, [navigate]);

  const fetchSubnodesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setActiveUserId(user.id);

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

      // 1. Get everyone from my school
      const searchKeyword = schoolTerm.replace(/ University| College| Institute/gi, '').trim();
      const { data: alumniData, error: alumniError } = await supabase
        .from('users')
        .select('*')
        .ilike('school', `%${searchKeyword}%`)
        .neq('id', user.id); 

      if (alumniError) throw alumniError;
      setGlobalAlumni(alumniData || []);

      // 2. Get my connection requests to check statuses
      const { data: requestData, error: requestError } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (requestError) throw requestError;
      setRequests(requestData || []);

    } catch (error) {
      console.error("Error fetching subnodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    setIsSending(targetUserId);
    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: activeUserId,
          receiver_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;
      await fetchSubnodesData(); // Instantly refresh
    } catch (error: any) {
      console.error("Error sending request:", error);
      alert("Could not send request: " + error.message);
    } finally {
      setIsSending(null);
    }
  };
  // ✨ FUNCTION TO REMOVE A CONNECTION
  // ✨ OPTION B: THE COMPLETE NUKE FUNCTION
  const handleRemoveConnection = async (person: any) => {
    const targetUserId = person.id;
    const targetName = person.full_name || person.name;

    // 1. Find the specific request ID linking you two
    const req = requests.find(r => 
      (r.sender_id === activeUserId && r.receiver_id === targetUserId) ||
      (r.receiver_id === activeUserId && r.sender_id === targetUserId)
    );

    if (!req) return;

    // 2. Ask for confirmation
    if (!window.confirm(`Are you sure? This will permanently remove ${targetName} from your CRM.`)) return;

    setIsSending(targetUserId);
    try {
      // 3. Get your own name so we can remove YOU from THEIR CRM
      const { data: myProfile } = await supabase.from('users').select('full_name, name').eq('id', activeUserId).single();
      const myName = myProfile?.full_name || myProfile?.name;

      // 4. Break the social link (Delete from connection_requests)
      await supabase.from('connection_requests').delete().eq('id', req.id);

      // 5. NUKE THEM from YOUR CRM (Delete from contacts)
      await supabase.from('contacts').delete()
        .eq('user_id', activeUserId)
        .eq('name', targetName);

      // 6. NUKE YOU from THEIR CRM (Delete from contacts)
      if (myName) {
        await supabase.from('contacts').delete()
          .eq('user_id', targetUserId)
          .eq('name', myName);
      }
      
      // 7. Refresh the UI
      await fetchSubnodesData();
    } catch (error: any) {
      console.error("Error removing connection:", error);
      alert("Could not remove connection: " + error.message);
    } finally {
      setIsSending(null);
    }
  };

  const getConnectionStatus = (targetUserId: string) => {
    const req = requests.find(r => 
      (r.sender_id === activeUserId && r.receiver_id === targetUserId) ||
      (r.receiver_id === activeUserId && r.sender_id === targetUserId)
    );

    if (!req) return 'none';
    if (req.status === 'accepted') return 'accepted';
    if (req.status === 'declined') return 'declined';
    if (req.status === 'pending' && req.sender_id === activeUserId) return 'sent';
    if (req.status === 'pending' && req.receiver_id === activeUserId) return 'received';
    return 'none';
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-gradient-to-br from-[#18181B] to-[#09090B] border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <GraduationCap className="w-32 h-32 text-[#4ADE80]" />
            </div>
            
            <h1 className="text-3xl text-white font-medium mb-2">Global Alumni Network</h1>
            <p className="text-zinc-400 max-w-lg">
              Discover other Nodify users from your university. Connect to add them to your CRM.
            </p>
            
            <div className="mt-6 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
              <MapPin className="w-4 h-4 text-[#4ADE80]" />
              <MonoText className="text-sm text-white">Filtering by: {userSchool || "Your University"}</MonoText>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : globalAlumni.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 font-mono">No other users from your university are on Nodify yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalAlumni.map((person) => {
                const status = getConnectionStatus(person.id);

                return (
                  <div key={person.id} className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between h-48">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg text-white font-medium">{person.full_name || person.name}</h3>
                        <p className="text-sm text-zinc-500 font-mono">{person.primary_interest || "Still Exploring"}</p>
                      </div>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.isArray(person.specializations) && person.specializations.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md font-mono">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
                      <MonoText className="text-xs text-zinc-500">{person.education_level || "Alumni"}</MonoText>
                      
                      {/* Replace the static "Connected" text with the Disconnect button */}
                      {status === 'accepted' && (
                        <button 
                          onClick={() => handleRemoveConnection(person)} 
                          disabled={isSending === person.id}
                          className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {isSending === person.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                          Disconnect
                        </button>
                      )},
                      {status === 'sent' && <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-full"><Clock className="w-3 h-3" /> Request Sent</div>}
                      {status === 'received' && <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">Check Inbox</div>}
                      {status === 'declined' && <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">Declined</div>}
                      {status === 'none' && (
                        <button 
                          onClick={() => handleSendRequest(person.id)}
                          disabled={isSending === person.id}
                          className="flex items-center gap-1.5 text-xs text-black font-medium bg-white hover:bg-zinc-200 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                          {isSending === person.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}