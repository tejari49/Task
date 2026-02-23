import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { purgeExpiredLocal } from "../lib/cache";
import ContactList from "../components/ContactList";
import ChatView from "../components/ChatView";
import AddFriendModal from "../components/AddFriendModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import SettingsModal from "../components/SettingsModal";

export default function HomePage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { profile } = useAuth();
  const [addFriend, setAddFriend] = useState(false);
  const [requests, setRequests] = useState(false);
  const [settings, setSettings] = useState(false);

  useNotifications();

  useEffect(() => {
    purgeExpiredLocal();
    const i = setInterval(purgeExpiredLocal, 3600000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!profile) return;
    import("../lib/api").then(({ api }) => api.updatePresence({ status: "online" }));
    const h = () => import("../lib/api").then(({ api }) => api.updatePresence({ status: document.hidden ? "away" : "online" }));
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [profile]);

  return (
    <div className="h-screen flex overflow-hidden bg-dark-950 safe-t">
      <div className={`${!chatId ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-white/[0.04] shrink-0`}>
        <ContactList activeChatId={chatId} onAddFriend={() => setAddFriend(true)} onRequests={() => setRequests(true)} onSettings={() => setSettings(true)} />
      </div>
      <div className={`${chatId ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
        <ChatView />
      </div>
      {addFriend && <AddFriendModal onClose={() => setAddFriend(false)} />}
      {requests && <FriendRequestsModal onClose={() => setRequests(false)} />}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}
