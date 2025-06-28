"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// Theme context for dark/light mode and gradient
const ThemeContext = createContext<any>(null);

export function useTheme() {
  return useContext(ThemeContext);
}

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Default: dark mode, Discord blue gradient
  const [theme, setThemeState] = useState<string>("dark");
  const [gradient, setGradientState] = useState<{ from: string; to: string }>({
    from: "#23272a",
    to: "#a5b4fc",
  });
  const [gradientOn, setGradientOnState] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [pendingGradient, setPendingGradient] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Fetch theme from backend on mount
  useEffect(() => {
    async function fetchTheme() {
      try {
        const res = await fetch(`${API_BASE}/theme`);
        if (!res.ok) throw new Error("Failed to fetch theme");
        const data = await res.json();
        setThemeState(data.theme || "dark");
        setGradientState({ from: data.gradient_from, to: data.gradient_to });
        setGradientOnState(data.gradient_on);
      } catch (e) {
        // fallback to defaults
      } finally {
        setLoading(false);
      }
    }
    fetchTheme();
  }, []);

  // Save theme to backend
  const saveTheme = async (next: {
    theme?: string;
    gradient?: { from: string; to: string };
    gradientOn?: boolean;
  }) => {
    const body = {
      theme: next.theme ?? theme,
      gradient_from: next.gradient?.from ?? gradient.from,
      gradient_to: next.gradient?.to ?? gradient.to,
      gradient_on: next.gradientOn ?? gradientOn,
    };
    await fetch(`${API_BASE}/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  // Debounce saveTheme for gradient changes
  useEffect(() => {
    if (!pendingGradient) return;
    const handler = setTimeout(() => {
      setGradientState(pendingGradient);
      saveTheme({ gradient: pendingGradient });
      setPendingGradient(null);
    }, 400);
    return () => clearTimeout(handler);
  }, [pendingGradient]);

  // Setters that also save to backend
  const setTheme = (t: string) => {
    setThemeState(t);
    saveTheme({ theme: t });
  };
  const setGradient = (g: { from: string; to: string }) => {
    setPendingGradient(g);
  };
  const setGradientOn = (on: boolean) => {
    setGradientOnState(on);
    saveTheme({ gradientOn: on });
  };

  // Set dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (loading) return null;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        gradient,
        setGradient,
        gradientOn,
        setGradientOn,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function ThemeSwitcher() {
  const { theme, setTheme, gradient, setGradient, gradientOn, setGradientOn } =
    useTheme();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 bg-black/30 dark:bg-black/60 rounded-xl p-4 shadow-lg">
      <button
        className="mb-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-white">Gradient</label>
        <input
          type="checkbox"
          checked={gradientOn}
          onChange={(e) => setGradientOn(e.target.checked)}
          className="w-5 h-5 cursor-pointer accent-blue-600"
        />
        <span className="text-xs text-white">{gradientOn ? "On" : "Off"}</span>
      </div>
      <div
        className="flex items-center gap-2"
        style={{
          opacity: gradientOn ? 1 : 0.5,
          pointerEvents: gradientOn ? "auto" : "none",
        }}
      >
        <label className="text-xs text-white">Gradient from</label>
        <input
          type="color"
          value={gradient.from}
          onChange={(e) => setGradient({ ...gradient, from: e.target.value })}
          className="w-8 h-8 border-none bg-transparent cursor-pointer"
        />
        <label className="text-xs text-white">to</label>
        <input
          type="color"
          value={gradient.to}
          onChange={(e) => setGradient({ ...gradient, to: e.target.value })}
          className="w-8 h-8 border-none bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
}

export function ThemeBackground() {
  const { gradient, theme, gradientOn } = useTheme();
  // Use a lighter moon in light mode
  const moonColor = theme === "dark" ? "bg-blue-200/30" : "bg-blue-300/40";
  if (!gradientOn) {
    return (
      <>
        <div
          className={`fixed inset-0 -z-10 ${
            theme === "dark" ? "bg-[#23272a]" : "bg-white"
          }`}
        />
        <div
          className={`fixed top-[-120px] right-[-120px] w-[300px] h-[300px] rounded-full blur-3xl -z-10 ${moonColor}`}
        />
      </>
    );
  }
  return (
    <>
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      />
      <div
        className={`fixed top-[-120px] right-[-120px] w-[300px] h-[300px] rounded-full blur-3xl -z-10 ${moonColor}`}
      />
    </>
  );
}

export default ThemeProvider;
