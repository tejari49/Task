import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSound } from "../contexts/SoundContext";
import { api } from "../lib/api";
import { showToast } from "./Toast";
import Avatar from "./Avatar";
import { StatusType } from "../types";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { soundEnabled, toggleSound } = useSound();
  const [name, setName] = useState(profile?.displayName || "");
  const [statusMsg, setStatusMsg] = useState(profile?.statusMessage || "");
  const [status, setStatus] = useState<StatusType>(profile?.status || "online");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (name.trim() !== profile?.displayName) await api.setupUser({ displayName: name.trim() });
      await api.updatePresence({ status, statusMessage: statusMsg });
      showToast("Saved!", "success"); onClose();
    } catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setSaving(false); }
  };

  const copy = () => { if (profile?.code) { navigator.clipboard.writeText(profile.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  const statuses: { v: StatusType; l: string; c: string }[] = [
    { v: "online", l: "Online", c: "bg-mint-400" },
    { v: "away", l: "Away", c: "bg-amber-400" },
    { v: "busy", l: "Busy", c: "bg-coral-400" },
    { v: "invisible", l: "Invisible", c: "bg-dark-400" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="card-lg w-full max-w-md bg-dark-900 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="btn-icon text-dark-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="space-y-7">
          {/* Profile */}
          <div>
            <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-3">Profile</p>
            <div className="flex items-start gap-4">
              <Avatar src={profile?.photoURL} name={profile?.displayName || ""} size="xl" status={status} />
              <div className="flex-1 space-y-2">
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-pill" placeholder="Display name" maxLength={30} />
                <input type="text" value={statusMsg} onChange={e => setStatusMsg(e.target.value)} className="input-pill text-xs" placeholder="Status message (optional)" maxLength={100} />
              </div>
            </div>
          </div>

          {/* Connect Code */}
          <div>
            <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-3">Connect Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] font-mono text-lg tracking-[0.35em] font-bold text-pp-400">{profile?.code}</div>
              <button onClick={copy} className="btn-ghost px-5 py-3.5">{copied ? "✓ Copied" : "Copy"}</button>
            </div>
            <p className="text-[10px] text-dark-600 mt-2 text-center">Share this so friends can find you</p>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-3">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map(s => (
                <button key={s.v} onClick={() => setStatus(s.v)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ${status === s.v ? "border-pp-500/40 bg-pp-500/10" : "border-white/[0.04] hover:bg-white/[0.03]"}`}>
                  <span className={`w-3 h-3 rounded-full ${s.c}`} />
                  <span className="text-sm font-medium">{s.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-3">Preferences</p>
            <div className="space-y-1">
              <Toggle label="Dark Mode" icon="🌙" on={theme === "dark"} onToggle={toggle} />
              <Toggle label="Sounds" icon="🔊" on={soundEnabled} onToggle={toggleSound} />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-1">
            <button onClick={save} disabled={saving} className="btn-pill w-full py-3 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            <button onClick={() => { signOut(); onClose(); }} className="w-full py-3 rounded-full text-sm font-semibold text-coral-400 hover:bg-coral-400/10 transition-colors">Sign Out</button>
          </div>

          <p className="text-center text-[10px] text-dark-600 leading-relaxed">All messages auto-delete after 48h · No cloud storage used · Photos stored as base64 in Firestore only</p>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, icon, on, onToggle }: { label: string; icon: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2.5"><span>{icon}</span><span className="text-sm font-medium">{label}</span></div>
      <div className={`toggle-track ${on ? "on" : "off"}`}><div className="toggle-thumb" /></div>
    </button>
  );
}
