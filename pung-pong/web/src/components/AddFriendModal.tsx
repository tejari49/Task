import React, { useState } from "react";
import { api } from "../lib/api";
import { showToast } from "./Toast";
import Avatar from "./Avatar";

export default function AddFriendModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<{ uid: string; displayName: string; photoURL: string; status: string } | null>(null);
  const [sending, setSending] = useState(false);

  const lookup = async () => {
    if (!code.trim()) return;
    setLoading(true); setFound(null);
    try { setFound((await api.lookupUserByCode({ code: code.trim() })).data); }
    catch (e: any) { showToast(e.message || "Not found", "error"); }
    finally { setLoading(false); }
  };

  const sendReq = async () => {
    if (!found) return;
    setSending(true);
    try {
      const r = await api.sendFriendRequest({ toUid: found.uid });
      showToast(r.data.status === "accepted" ? "You're friends! 🎉" : "Request sent!", "success");
      onClose();
    } catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="card-lg w-full max-w-sm bg-dark-900 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Add Friend</h2>
          <button onClick={onClose} className="btn-icon text-dark-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-2 uppercase tracking-wider">Connect Code</label>
            <div className="flex gap-2">
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ABC12345" maxLength={8} onKeyDown={e => e.key === "Enter" && lookup()}
                className="input-pill flex-1 font-mono tracking-[0.25em] text-center uppercase" />
              <button onClick={lookup} disabled={!code.trim() || loading} className="btn-pill px-6 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Find"}
              </button>
            </div>
          </div>
          {found && (
            <div className="card animate-pop">
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={found.photoURL} name={found.displayName} size="lg" showStatus={false} />
                <div><p className="font-semibold">{found.displayName}</p><p className="text-xs text-dark-400 capitalize">{found.status}</p></div>
              </div>
              <button onClick={sendReq} disabled={sending} className="btn-pill w-full disabled:opacity-50">{sending ? "Sending..." : "Send Request"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
