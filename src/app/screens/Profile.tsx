import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Sidebar } from "../components/Sidebar"; 
import {
  User, Loader2, Save, Copy, Check
} from "lucide-react";

export function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✨ NEW: State to hold the User ID and copy status
  const [userId, setUserId] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  // Profile State
  const [formData, setFormData] = useState({
    full_name: "",
    school: "",
    education_level: "",
    primary_interest: "",
    specializations: "" 
  });

  // 1. Fetch the user's data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        // ✨ NEW: Save the ID to state immediately
        setUserId(user.id);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            full_name: data.full_name || "",
            school: data.school || "",
            education_level: data.education_level || "",
            primary_interest: data.primary_interest || "",
            specializations: data.specializations ? data.specializations.join(", ") : ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);

  // ✨ NEW: Function to handle copying the ID to the clipboard
  const handleCopyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000); // Reset the checkmark after 2 seconds
  };

  // 2. Save the updated data
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const specsArray = formData.specializations
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          school: formData.school,
          education_level: formData.education_level,
          primary_interest: formData.primary_interest,
          specializations: specsArray
        })
        .eq('id', user.id);

      if (error) throw error;
      
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert("Error saving profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8 mt-4">
          
          <div className="space-y-2">
            <h1 className="text-3xl text-white font-medium flex items-center gap-3">
              <User className="w-8 h-8 text-[#4ADE80]" />
              Your Profile
            </h1>
            <p className="text-zinc-400">
              Manage your personal intelligence profile and industry interests.
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : (
            <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-8 space-y-6">
              
              {/* ✨ NEW: The Extension ID Block */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2">
                <Label className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                  Chrome Extension ID
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={userId}
                    readOnly
                    className="bg-zinc-950 border-zinc-800 text-zinc-500 font-mono text-xs cursor-not-allowed focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyId}
                    className={`${hasCopied ? "bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30" : "bg-zinc-800 text-white hover:bg-zinc-700"} px-3 transition-colors`}
                  >
                    {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Paste this ID into the Chrome Extension to sync your captured profiles.
                </p>
              </div>

              {/* Standard Profile Fields */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">University / School</Label>
                  <Input
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Education Level</Label>
                  <Input
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Primary Industry Interest</Label>
                <Input
                  value={formData.primary_interest}
                  onChange={(e) => setFormData({ ...formData, primary_interest: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Specializations (Comma separated)</Label>
                <Input
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  placeholder="e.g. Machine Learning, Product Management, FinTech"
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}