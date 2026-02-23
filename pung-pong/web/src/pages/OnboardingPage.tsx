import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { setError("Min 2 characters"); return; }
    setLoading(true); setError("");
    try { await api.setupUser({ displayName: name.trim() }); }
    catch (e: any) { setError(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-950 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-mint-400/6 rounded-full blur-[100px] animate-float" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-mint-400 to-pp-500 shadow-xl mb-5">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Welcome!</h1>
          <p className="text-dark-400">Choose your display name</p>
        </div>

        <form onSubmit={go} className="card-lg space-y-5">
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-2 uppercase tracking-wider">Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name..." className="input-pill" maxLength={30} autoFocus />
          </div>
          {error && <p className="text-coral-400 text-sm animate-fade-in">{error}</p>}
          <button type="submit" disabled={loading || !name.trim()} className="btn-pill w-full py-3 disabled:opacity-50">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up...</> : "Get my Connect Code →"}
          </button>
          <p className="text-center text-dark-600 text-xs">You'll get a unique code to share</p>
        </form>
      </div>
    </div>
  );
}
