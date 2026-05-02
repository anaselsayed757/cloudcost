import { useState, useEffect } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark(d => !d);

  const theme = {
    bg:         dark ? "#13131f" : "#f0f2f5",
    surface:    dark ? "#2a2a3e" : "#ffffff",
    surface2:   dark ? "#1e1e2e" : "#f8f9fa",
    border:     dark ? "#333"    : "#e0e0e0",
    text:       dark ? "#ffffff" : "#1a1a2e",
    textSub:    dark ? "#888"    : "#666",
    textMuted:  dark ? "#666"    : "#999",
    headerBg:   dark ? "#1e1e2e" : "#ffffff",
    inputBg:    dark ? "#1e1e2e" : "#f8f9fa",
    cardBg:     dark ? "#2a2a3e" : "#ffffff",
    gridLine:   dark ? "#333"    : "#e8e8e8",
  };

  return { dark, toggle, theme };
}
