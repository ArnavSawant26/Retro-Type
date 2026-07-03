import { useEffect, useState } from "react";
import { AppearanceContext } from "./appearanceState";

const STORAGE_KEY = "rt_appearance";

const DEFAULT_APPEARANCE = {
  theme: "retro-green",
  font: "jetbrains",
  fontSize: 20,
  cursorStyle: "line",
  cursorBlink: true,
  effects: {
    scanlines: true,
    flicker: false,
    glow: true,
    noise: false,
    vignette: true,
  },
};

const FONT_STACKS = {
  jetbrains: "'JetBrains Mono', 'Consolas', monospace",
  fira: "'Fira Code', 'Consolas', monospace",
  cascadia: "'Cascadia Code', 'Cascadia Mono', 'Consolas', monospace",
  ibm: "'IBM Plex Mono', 'Consolas', monospace",
};

const loadAppearance = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...DEFAULT_APPEARANCE,
      ...saved,
      effects: { ...DEFAULT_APPEARANCE.effects, ...saved?.effects },
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
};

export const AppearanceProvider = ({ children }) => {
  const [appearance, setAppearance] = useState(loadAppearance);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = appearance.theme;
    root.dataset.cursorStyle = appearance.cursorStyle;
    root.dataset.cursorBlink = appearance.cursorBlink ? "on" : "off";
    root.style.setProperty("--font-mono", FONT_STACKS[appearance.font]);
    root.style.setProperty("--typing-font-size", `${appearance.fontSize}px`);

    Object.entries(appearance.effects).forEach(([effect, enabled]) => {
      root.dataset[`effect${effect[0].toUpperCase()}${effect.slice(1)}`] = enabled ? "on" : "off";
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance]);

  const updateAppearance = (key, value) => {
    setAppearance((current) => ({ ...current, [key]: value }));
  };

  const updateEffect = (effect, enabled) => {
    setAppearance((current) => ({
      ...current,
      effects: { ...current.effects, [effect]: enabled },
    }));
  };

  const resetAppearance = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAppearance({
      ...DEFAULT_APPEARANCE,
      effects: { ...DEFAULT_APPEARANCE.effects },
    });
  };

  return (
    <AppearanceContext.Provider
      value={{ appearance, updateAppearance, updateEffect, resetAppearance }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};
