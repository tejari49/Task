import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { UserProfile } from "../types";

interface Ctx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isOnboarded: boolean;
}

const AuthCtx = createContext<Ctx>({ user: null, profile: null, loading: true, signIn: async () => {}, signOut: async () => {}, isOnboarded: false });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); if (!u) { setProfile(null); setLoading(false); } });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), s => {
      setProfile(s.exists() ? { uid: s.id, ...s.data() } as UserProfile : null);
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  const signIn = async () => { await signInWithPopup(auth, googleProvider); };
  const signOut = async () => { await fbSignOut(auth); setProfile(null); };

  return <AuthCtx.Provider value={{ user, profile, loading, signIn, signOut, isOnboarded: !!profile?.code }}>{children}</AuthCtx.Provider>;
}
