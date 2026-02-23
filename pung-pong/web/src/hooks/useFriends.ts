import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Friendship, FriendRequest, UserProfile, FriendWithProfile, Chat } from "../types";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [requests, setRequests] = useState<(FriendRequest & { fromProfile?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let fA: Friendship[] = [], fB: Friendship[] = [];

    const u1 = onSnapshot(query(collection(db, "friendships"), where("aUid", "==", uid)), s => {
      fA = s.docs.map(d => ({ id: d.id, ...d.data() } as Friendship)); merge();
    });
    const u2 = onSnapshot(query(collection(db, "friendships"), where("bUid", "==", uid)), s => {
      fB = s.docs.map(d => ({ id: d.id, ...d.data() } as Friendship)); merge();
    });

    async function merge() {
      const all = [...fA, ...fB];
      const enriched: FriendWithProfile[] = [];
      for (const f of all) {
        const fuid = f.aUid === uid ? f.bUid : f.aUid;
        try {
          const ps = await getDoc(doc(db, "users", fuid));
          const cs = await getDoc(doc(db, "chats", f.id));
          if (ps.exists()) enriched.push({
            ...f,
            friendProfile: { uid: ps.id, ...ps.data() } as UserProfile,
            chat: cs.exists() ? { id: cs.id, ...cs.data() } as Chat : undefined,
          });
        } catch {}
      }
      enriched.sort((a, b) => {
        const o = { online: 0, away: 1, busy: 2, invisible: 3 };
        const d = (o[a.friendProfile.status] ?? 3) - (o[b.friendProfile.status] ?? 3);
        if (d !== 0) return d;
        return (b.chat?.lastMessageAt?.toMillis() ?? 0) - (a.chat?.lastMessageAt?.toMillis() ?? 0);
      });
      setFriends(enriched);
      setLoading(false);
    }
    return () => { u1(); u2(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, "friendRequests"), where("toUid", "==", user.uid)), async s => {
      const r: (FriendRequest & { fromProfile?: UserProfile })[] = [];
      for (const d of s.docs) {
        const req = { id: d.id, ...d.data() } as FriendRequest;
        try {
          const ps = await getDoc(doc(db, "users", req.fromUid));
          r.push({ ...req, fromProfile: ps.exists() ? { uid: ps.id, ...ps.data() } as UserProfile : undefined });
        } catch { r.push(req); }
      }
      setRequests(r);
    });
  }, [user]);

  return { friends, requests, loading };
}
