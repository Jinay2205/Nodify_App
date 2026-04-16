import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      
      // ✨ THE FIX: Send EVERYONE to the protected zone. 
      // The Traffic Cop (ProtectedRoute) will instantly catch them and route them 
      // to Onboarding or Dashboard while the loading spinner is active!
      navigate('/dashboard'); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✨ THE FIX: Let Google send them to the protected zone so the Cop catches them.
          redirectTo: window.location.origin + '/dashboard',
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#18181B] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          {/* ✨ THE REAL LOGO */}
          <img 
            src="/Logo_Front.png" 
            alt="Nodify Logo" 
            className="w-14 h-14 object-contain mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.15)]" 
          />          
          <h1 className="text-2xl text-white font-medium">
            {isSignUp ? "Create your node" : "Welcome back"}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-mono uppercase tracking-wider">
            Nodify Relationship Engine
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Google Auth Button */}
        <Button 
          type="button" 
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2 mb-6"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs font-mono uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Email Auth Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#4ADE80] transition-colors" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] text-white placeholder:text-zinc-600 h-11 w-full rounded-xl"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#4ADE80] transition-colors" />
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] text-white placeholder:text-zinc-600 h-11 w-full rounded-xl"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || isGoogleLoading || !email || !password} 
            className="w-full h-11 bg-[#4ADE80] hover:bg-[#22C55E] text-black font-medium rounded-xl transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up with Email" : "Log In with Email")}
          </Button>
        </form>

        {/* Toggle between Login / Signup */}
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </button>
        </div>

      </div>
    </div>
  );
}