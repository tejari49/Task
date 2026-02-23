import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFriends } from "../hooks/useFriends";
import Avatar from "./Avatar";
import { StatusLabel } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { FriendWithProfile } from "../types";

interface Props { activeChatId?: string; onAddFriend: () => void; onRequests: () => void; onSettings: () => void; }

export default function ContactList({ activeChatId, onAddFriend, onRequests, onSettings }: Props) {
  const nav = useNavigate();
  const { profile } = useAuth();
  const { friends, requests } = useFriends();
  const online = friends.filter(f => f.friendProfile.status === "online");
  const rest = friends.filter(f => f.friendProfile.status !== "online");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={profile?.photoURL} name={profile?.displayName || "You"} size="lg" status={profile?.status} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg truncate">{profile?.displayName}</h2>
            <p className="text-xs text-dark-400 font-mono tracking-wider">{profile?.code}</p>
            {profile?.statusMessage && <p className="text-xs text-dark-400 truncate italic mt-0.5">"{profile.statusMessage}"</p>}
          </div>
          <button onClick={onSettings} className="btn-icon text-dark-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onAddFriend} className="flex-1 btn-pill text-xs py-2.5">+ Add Friend</button>
          <button onClick={onRequests} className="relative btn-ghost text-xs py-2.5 px-4">
            Requests
            {requests.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pop">{requests.length}</span>}
          </button>
        </div>
      </div>

      {/* Friends */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-5xl mb-3 animate-float">🏓</div>
            <p className="text-dark-400 text-sm font-medium">No friends yet</p>
            <p className="text-dark-500 text-xs mt-1">Add friends with their connect code</p>
          </div>
        ) : (
          <>
            {online.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1.5 text-[10px] font-bold text-mint-400 uppercase tracking-widest">Online — {online.length}</p>
                {online.map(f => <Row key={f.id} f={f} active={activeChatId === f.id} go={() => nav(`/chat/${f.id}`)} />)}
              </div>
            )}
            {rest.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-[10px] font-bold text-dark-500 uppercase tracking-widest">{online.length > 0 ? "Others" : "Friends"} — {rest.length}</p>
                {rest.map(f => <Row key={f.id} f={f} active={activeChatId === f.id} go={() => nav(`/chat/${f.id}`)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ f, active, go }: { f: FriendWithProfile; active: boolean; go: () => void }) {
  const { friendProfile: p, chat } = f;
  return (
    <button onClick={go} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150 text-left mb-1 ${active ? "bg-pp-600/15 ring-1 ring-pp-500/30" : "hover:bg-white/[0.03]"}`}>
      <Avatar src={p.photoURL} name={p.displayName} status={p.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{p.displayName}</span>
          {chat?.lastMessageAt && <span className="text-[10px] text-dark-500 shrink-0">{formatDistanceToNow(chat.lastMessageAt.toDate(), { addSuffix: false })}</span>}
        </div>
        {p.statusMessage ? <p className="text-xs text-dark-400 truncate italic">{p.statusMessage}</p>
          : chat?.lastMessagePreview ? <p className="text-xs text-dark-500 truncate">{chat.lastMessagePreview}</p>
          : <StatusLabel status={p.status} />}
      </div>
      {chat && !chat.spamEnabled && chat.turnUid !== p.uid && <span className="shrink-0 text-xs bg-mint-500/15 text-mint-400 px-2 py-0.5 rounded-full font-semibold">YOU</span>}
    </button>
  );
}
