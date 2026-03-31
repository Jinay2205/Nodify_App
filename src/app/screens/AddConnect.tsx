import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase"; 
import { Button } from "../components/ui/button";
import { ArrowLeft, UploadCloud, Sparkles, Loader2, CheckCircle2, FileSpreadsheet } from "lucide-react";

export function AddConnect() {
  const navigate = useNavigate();
  
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // --- DRAG AND DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILE HANDLING LOGIC ---
  const processFile = (file: File) => {
    // Check if it's a CSV or TXT file
    if (file.type !== "text/csv" && file.type !== "text/plain" && !file.name.endsWith('.csv')) {
      setError("Please upload a .csv or .txt file. PDFs require premium processing.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setRawText(text); // Instantly dump the file contents into the textbox!
        setError(null);
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // --- AI IMPORT LOGIC ---
  const handleAIImport = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setError(null);
    setSuccessCount(null);

    try {
      // ✨ NEW: Dynamically grab the real, currently logged-in user!
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error: funcError } = await supabase.functions.invoke('parse-network', {
        body: { 
            raw_text: rawText, 
            user_id: user.id,
            source: "csv" // Tells the AI: "This is a list, grab EVERYONE!"
          }
      });

      if (funcError) throw funcError;
      if (data.error) throw new Error(data.error);

      setSuccessCount(data.inserted);
      setRawText(""); // Clear the box on success
    } catch (err: any) {
      console.error("Import failed:", err);
      setError(err.message || "Failed to parse the network data. Try formatting it slightly differently.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col p-8">
      <div className="max-w-3xl mx-auto w-full space-y-8 mt-12">
        
        <button 
          onClick={() => navigate('/dashboard')} 
          className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl text-white font-medium flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-[#4ADE80]" />
            Import Network
          </h1>
          <p className="text-zinc-400">
            Drag and drop your LinkedIn export or a CSV list. Our AI will automatically extract their names, schools, and specializations.
          </p>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 space-y-6 shadow-2xl">
          
          {/* DRAG AND DROP ZONE */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? "border-[#4ADE80] bg-[#4ADE80]/5" 
                : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".csv,.txt" 
              className="hidden" 
            />
            <FileSpreadsheet className={`w-10 h-10 mb-4 ${isDragging ? "text-[#4ADE80]" : "text-zinc-500"}`} />
            <p className="text-white font-medium mb-1">
              {isDragging ? "Drop your file here!" : "Click or drag a CSV file here"}
            </p>
            <p className="text-sm text-zinc-500 font-mono">
              Supports .csv and .txt exports
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800"></div>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Or paste raw text</span>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>

          <textarea
            className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4ADE80] font-mono resize-y"
            placeholder="e.g.&#10;John Doe, Stanford University, Product Manager at Google&#10;Sarah Chen, Harvard Business School, VC at Sequoia&#10;..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isProcessing}
          />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono">
              ❌ {error}
            </div>
          )}

          {successCount !== null && (
            <div className="p-4 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-lg text-[#4ADE80] text-sm font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Successfully imported {successCount} new connections!
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleAIImport}
              disabled={!rawText.trim() || isProcessing}
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium px-6 py-5 text-base flex items-center gap-2 shadow-lg shadow-[#4ADE80]/20"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing Data...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Auto-Extract Contacts</>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}