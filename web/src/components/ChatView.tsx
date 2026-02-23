import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useChat } from "../hooks/useChat";
import { useFriends } from "../hooks/useFriends";
import { api } from "../lib/api";
import { timeLeft } from "../lib/cache";
import { showToast } from "./Toast";
import Avatar from "./Avatar";
import { StatusLabel } from "./StatusBadge";
import { EMOTICONS, Message } from "../types";
import imageCompression from "browser-image-compression";
import { formatDistanceToNow } from "date-fns";

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const { playSound } = useSound();
  const { messages, chat, loading, canSend, isMyTurn } = useChat(chatId);
  const { friends } = useFriends();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<{ base64: string; msgId: string } | null>(null);
  const [photoSending, setPhotoSending] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const friend = friends.find(f => f.id === chatId);
  const fp = friend?.friendProfile;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current) {
      const last = messages[messages.length - 1];
      if (last?.senderUid !== user?.uid) playSound("message");
    }
    prevCount.current = messages.length;
  }, [messages.length, user?.uid, playSound]);

  useEffect(() => {
    if (chat?.lastNudgeBy && chat.lastNudgeBy !== user?.uid && chat.lastNudgeAt) {
      if (Date.now() - chat.lastNudgeAt.toMillis() < 5000) {
        setNudging(true); playSound("nudge"); setTimeout(() => setNudging(false), 500);
      }
    }
  }, [chat?.lastNudgeAt, chat?.lastNudgeBy, user?.uid, playSound]);

  const emojify = (s: string) => {
    let r = s;
    for (const [k, v] of Object.entries(EMOTICONS)) r = r.replaceAll(k, v);
    return r;
  };

  const send = async () => {
    if (!text.trim() || !chatId || sending) return;
    const t = emojify(text.trim());
    setSending(true); setText("");
    try { await api.sendMessage({ chatId, text: t }); }
    catch (e: any) { showToast(e.message || "Send failed", "error"); setText(t); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const sendPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    setPhotoSending(true);
    try {
      const comp = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 800, useWebWorker: true });
      const reader = new FileReader();
      reader.onload = async () => {
        const b64 = (reader.result as string).split(",")[1];
        try {
          await api.sendMessage({ chatId, type: "photo_once", base64Photo: b64 });
          showToast("Photo sent! 📸", "success");
        } catch (e: any) { showToast(e.message || "Photo failed", "error"); }
        finally { setPhotoSending(false); }
      };
      reader.readAsDataURL(comp);
    } catch { showToast("Compression failed", "error"); setPhotoSending(false); }
    e.target.value = "";
  };

  const openPhoto = async (msg: Message) => {
    if (!chatId || msg.viewState === "deleted") return;
    try {
      const r = await api.viewOncePhoto({ chatId, messageId: msg.id });
      if (r.data.base64) setViewPhoto({ base64: r.data.base64, msgId: msg.id });
      else if (r.data.shouldDelete) {
        await api.deleteOncePhoto({ chatId, messageId: msg.id });
        showToast("Photo deleted", "info");
      }
    } catch (e: any) { showToast(e.message || "Can't view", "error"); }
  };

  const closePhoto = async () => {
    if (viewPhoto && chatId) {
      try { await api.deleteOncePhoto({ chatId, messageId: viewPhoto.msgId }); } catch {}
    }
    setViewPhoto(null);
  };

  const nudge = async () => {
    if (!chatId) return;
    try { await api.sendNudge({ chatId }); showToast("Nudge sent! 👋", "info"); }
    catch (e: any) { showToast(e.message || "Wait a bit", "error"); }
  };

  if (!chatId) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-float">🏓</div>
        <p className="font-display text-2xl font-bold text-dark-300">Select a chat</p>
        <p className="text-sm text-dark-500 mt-1">Pick a friend to start pong-ing</p>
      </div>
    </div>
  );

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-pp-500/30 border-t-pp-500 rounded-full animate-spin" /></div>;

  return (
    <div className={`flex flex-col h-full ${nudging ? "nudge-shake" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] shrink-0">
        <button onClick={() => nav("/")} className="md:hidden btn-icon text-dark-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
        {fp && <>
          <Avatar src={fp.photoURL} name={fp.displayName} status={fp.status} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{fp.displayName}</h3>
            <div className="flex items-center gap-2">
              <StatusLabel status={fp.status} />
              {fp.presence?.lastSeenAt && fp.status !== "online" && <span className="text-[10px] text-dark-500">{formatDistanceToNow(fp.presence.lastSeenAt.toDate(), { addSuffix: true })}</span>}
            </div>
          </div>
        </>}
        <div className="flex items-center gap-1.5">
          {chat?.spamEnabled && <span className="text-[10px] bg-violet-500/15 text-violet-400 px-3 py-1 rounded-full font-bold tracking-wider">∞ SPAM</span>}
          <button onClick={nudge} className="btn-icon" title="Nudge"><span className="text-xl">👋</span></button>
        </div>
      </div>

      {/* Turn bar */}
      {chat && !chat.spamEnabled && (
        <div className={`px-5 py-2 text-xs text-center font-semibold transition-colors ${isMyTurn ? "bg-mint-500/8 text-mint-400" : "bg-amber-500/8 text-amber-400"}`}>
          {isMyTurn ? "🏓 Your turn — send a message!" : `⏳ Waiting for ${fp?.displayName || "reply"}...`}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3 animate-float">💬</div>
            <p className="text-dark-400 text-sm font-medium">Start the conversation!</p>
          </div>
        )}
        {messages.map(m => <Bubble key={m.id} msg={m} mine={m.senderUid === user?.uid} onPhoto={() => openPhoto(m)} />)}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3.5 border-t border-white/[0.04] shrink-0 safe-b">
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={!canSend || photoSending} className="btn-icon text-violet-400 disabled:opacity-30" title="Photo">
            {photoSending ? <div className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> :
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={sendPhoto} className="hidden" />

          <button onClick={() => setShowEmoji(!showEmoji)} className="btn-icon"><span className="text-lg">😊</span></button>

          <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={!canSend} placeholder={canSend ? "Type a message..." : "Wait for reply..."} maxLength={2000}
            className="flex-1 input-pill disabled:opacity-30" />

          <button onClick={send} disabled={!text.trim() || !canSend || sending} className="btn-pill px-5 disabled:opacity-30">
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
          </button>
        </div>

        {showEmoji && (
          <div className="mt-3 card grid grid-cols-8 gap-1 animate-slide-up">
            {Object.entries(EMOTICONS).map(([k, v]) => (
              <button key={k} onClick={() => { setText(p => p + v); inputRef.current?.focus(); }}
                className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-lg" title={k}>{v}</button>
            ))}
          </div>
        )}
      </div>

      {/* Photo viewer */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6" onClick={closePhoto}>
          <p className="text-white/50 text-sm mb-6 font-medium">Tap anywhere to close & delete</p>
          <img src={`data:image/jpeg;base64,${viewPhoto.base64}`} alt="Once" className="max-w-full max-h-[65vh] rounded-3xl shadow-2xl" />
          <p className="text-white/30 text-xs mt-6">This photo will be deleted forever</p>
        </div>
      )}
    </div>
  );
}

function Bubble({ msg, mine, onPhoto }: { msg: Message; mine: boolean; onPhoto: () => void }) {
  const tl = timeLeft(msg.expireAt);

  if (msg.type === "photo_once") return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}>
      <button onClick={onPhoto} disabled={msg.viewState === "deleted"} className="photo-pill disabled:opacity-40 disabled:cursor-not-allowed">
        {msg.viewState === "deleted" ? <><span>🚫</span><span>Deleted</span></>
          : msg.viewState === "opened" ? <><span>👁</span><span>Tap to delete</span></>
          : <><div className="shimmer w-5 h-5 rounded-full" /><span>View photo</span></>}
      </button>
    </div>
  );

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className="group">
        <div className={`bubble ${mine ? "bubble-sent" : "bubble-recv"}`}>{msg.text}</div>
        <div className={`flex items-center gap-2 mt-1 px-2 ${mine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-dark-500">{msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
          <span className="text-[10px] text-dark-600 opacity-0 group-hover:opacity-100 transition-opacity">{tl}</span>
        </div>
      </div>
    </div>
  );
}
