import React, { createContext, useContext, useEffect, useState } from "react";
type Theme = "dark" | "light";
const Ctx = createContext({ theme: "dark" as Theme, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("pp-theme") as Theme) || "dark");
  useEffect(() => {
    localStorage.setItem("pp-theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") }}>{children}</Ctx.Provider>;
}
