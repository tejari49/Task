import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, Timestamp, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Message, Chat } from "../types";
import { isExpired } from "../lib/cache";

export function useChat(chatId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;
    return onSnapshot(doc(db, "chats", chatId), s => {
      if (s.exists()) setChat({ id: s.id, ...s.data() } as Chat);
    });
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("expireAt", ">", Timestamp.now()),
      orderBy("expireAt", "asc"),
      limit(200)
    );
    return onSnapshot(q, s => {
      const msgs: Message[] = [];
      s.docs.forEach(d => {
        const m = { id: d.id, ...d.data() } as Message;
        if (!isExpired(m.expireAt)) msgs.push(m);
      });
      msgs.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      setMessages(msgs);
      setLoading(false);
    }, () => setLoading(false));
  }, [chatId, user]);

  return { messages, chat, loading, isMyTurn: chat?.turnUid === user?.uid, canSend: chat?.spamEnabled || chat?.turnUid === user?.uid };
}
