import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMsg, VAPID_KEY } from "../lib/firebase";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";

export function useNotifications() {
  const { user } = useAuth();
  const { playSound } = useSound();
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const m = await getMsg();
        if (!m) return;
        if ((await Notification.requestPermission()) !== "granted") return;
        const t = await getToken(m, { vapidKey: VAPID_KEY });
        if (t) await api.registerFcmToken({ token: t });
        onMessage(m, p => {
          p.data?.type === "nudge" ? playSound("nudge") : playSound("notification");
        });
      } catch {}
    })();
  }, [user, playSound]);
}
