import React, { createContext, useContext, useState, useCallback } from "react";

const Ctx = createContext({ soundEnabled: true, toggleSound: () => {}, playSound: (_t: "message" | "nudge" | "notification") => {} });
export const useSound = () => useContext(Ctx);

function beep(freq: number, dur: number, type: OscillatorType = "sine") {
  try {
    const c = new AudioContext(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.start(); o.stop(c.currentTime + dur);
  } catch {}
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(() => localStorage.getItem("pp-sound") !== "false");
  const toggleSound = () => setOn(p => { localStorage.setItem("pp-sound", (!p).toString()); return !p; });
  const playSound = useCallback((t: "message" | "nudge" | "notification") => {
    if (!on) return;
    if (t === "message") { beep(800, 0.12); setTimeout(() => beep(1000, 0.08), 80); }
    else if (t === "nudge") { for (let i = 0; i < 4; i++) setTimeout(() => beep(500 + i * 120, 0.06, "square"), i * 70); }
    else { beep(523, 0.15); setTimeout(() => beep(659, 0.15), 120); setTimeout(() => beep(784, 0.2), 240); }
  }, [on]);
  return <Ctx.Provider value={{ soundEnabled: on, toggleSound, playSound }}>{children}</Ctx.Provider>;
}
