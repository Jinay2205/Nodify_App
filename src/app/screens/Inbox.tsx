import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Sidebar } from "../components/Sidebar";
import { Loader2, Inbox as InboxIcon, Check, X } from "lucide-react";
import { MonoText } from "../components/nodify/mono-text";

export function Inbox() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/auth');

      // 1. Get MY profile (we need this to inject into the sender's contacts)
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      // 2. Fetch requests where I am the RECEIVER and status is pending
      const { data: requests } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (!requests || requests.length === 0) {
        setPendingRequests([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch the profile details of the SENDERS
      const senderIds = requests.map(r => r.sender_id);
      const { data: senders } = await supabase
        .from('users')
        .select('*')
        .in('id', senderIds);

      // 4. Combine the request data with the sender's profile data
      const enrichedRequests = requests.map(req => ({
        ...req,
        sender: senders?.find(s => s.id === req.sender_id)
      }));

      setPendingRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching inbox:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (request: any) => {
    setProcessingId(request.id);
    try {
      // 1. Update request status to accepted
      await supabase.from('connection_requests').update({ status: 'accepted' }).eq('id', request.id);

      const sender = request.sender;

      // 2. Add Sender to MY private CRM (contacts table)
      await supabase.from('contacts').insert({
        user_id: myProfile.id,
        name: sender.full_name || sender.name,
        school: sender.school,
        primary_interest: sender.primary_interest,
        specializations: sender.specializations || [],
        warmth_level: 'warm'
      });

      // 3. Add ME to Sender's private CRM (contacts table)
      await supabase.from('contacts').insert({
        user_id: sender.id,
        name: myProfile.full_name || myProfile.name,
        school: myProfile.school,
        primary_interest: myProfile.primary_interest,
        specializations: myProfile.specializations || [],
        warmth_level: 'warm'
      });

      // Refresh list
      await fetchInbox();
    } catch (error) {
      console.error("Failed to accept:", error);
      alert("Error accepting request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await supabase.from('connection_requests').update({ status: 'declined' }).eq('id', requestId);
      await fetchInbox();
    } catch (error) {
      console.error("Failed to decline:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <InboxIcon className="w-6 h-6 text-[#4ADE80]" />
            </div>
            <div>
              <h1 className="text-2xl text-white font-medium">Connection Inbox</h1>
              <p className="text-sm text-zinc-400">Manage your incoming network requests.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <InboxIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-mono">No pending connection requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  
                  <div>
                    <h3 className="text-lg text-white font-medium">{req.sender?.full_name}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{req.sender?.school} • {req.sender?.primary_interest}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.isArray(req.sender?.specializations) && req.sender.specializations.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md font-mono">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleDecline(req.id)}
                      disabled={processingId === req.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors"
                    >
                      <X className="w-4 h-4" /> Decline
                    </button>
                    <button 
                      onClick={() => handleAccept(req)}
                      disabled={processingId === req.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black bg-[#4ADE80] hover:bg-[#22C55E] transition-colors"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
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