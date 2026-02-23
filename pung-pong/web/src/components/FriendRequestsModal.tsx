import React, { useState } from "react";
import { useFriends } from "../hooks/useFriends";
import { api } from "../lib/api";
import { showToast } from "./Toast";
import Avatar from "./Avatar";

export default function FriendRequestsModal({ onClose }: { onClose: () => void }) {
  const { requests } = useFriends();
  const [busy, setBusy] = useState<string | null>(null);

  const accept = async (id: string) => {
    setBusy(id);
    try { await api.acceptFriendRequest({ requestId: id }); showToast("Friend added! 🎉", "success"); }
    catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setBusy(null); }
  };

  const reject = async (id: string) => {
    setBusy(id);
    try { await api.rejectFriendRequest({ requestId: id }); showToast("Declined", "info"); }
    catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="card-lg w-full max-w-sm bg-dark-900 animate-slide-up max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Requests</h2>
          <button onClick={onClose} className="btn-icon text-dark-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-dark-400 text-sm">No pending requests</p>
            </div>
          ) : requests.map(r => (
            <div key={r.id} className="card animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={r.fromProfile?.photoURL} name={r.fromProfile?.displayName || "?"} showStatus={false} />
                <div className="flex-1"><p className="font-semibold text-sm">{r.fromProfile?.displayName || "Unknown"}</p><p className="text-xs text-dark-400">wants to connect</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => accept(r.id)} disabled={busy === r.id} className="flex-1 btn-pill text-xs py-2 disabled:opacity-50">Accept</button>
                <button onClick={() => reject(r.id)} disabled={busy === r.id} className="flex-1 btn-ghost text-xs py-2 text-coral-400 disabled:opacity-50">Decline</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
