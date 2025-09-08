
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'system' | 'dark' | 'light';
export type Density = 'comfortable' | 'compact';

type PrefsState = {
  theme: Theme;
  density: Density;
  reduceMotion: boolean;
  accent: string; // CSS color string
  setTheme: (t: Theme)=>void;
  setDensity: (d: Density)=>void;
  setReduceMotion: (v: boolean)=>void;
  setAccent: (hex: string)=>void;
  applyToDOM: () => void;
};

export const usePrefs = create<PrefsState>()(persist((set, get)=>({
  theme: 'system',
  density: 'comfortable',
  reduceMotion: false,
  accent: '#0A84FF',
  setTheme: (theme)=>{ set({ theme }); get().applyToDOM(); },
  setDensity: (density)=>{ set({ density }); get().applyToDOM(); },
  setReduceMotion: (reduceMotion)=>{ set({ reduceMotion }); get().applyToDOM(); },
  setAccent: (accent)=>{ set({ accent }); get().applyToDOM(); },
  applyToDOM: ()=>{
    const { theme, density, reduceMotion, accent } = get();
    const html = document.documentElement;

    // theme
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;
    html.dataset.theme = resolved;

    // density
    html.dataset.density = density;

    // motion
    html.dataset.reduceMotion = reduceMotion ? '1' : '0';

    // accent
    html.style.setProperty('--gc-accent', accent);
  }
}), { name: 'giannicorp:prefs' }));
