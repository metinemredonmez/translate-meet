import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceLanguage, type AppLanguage } from '@/i18n/locale';

export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 2.0;
export const SPEECH_RATE_STEP = 0.1;

export function clampSpeechRate(v: number): number {
  const rounded = Math.round(v * 10) / 10;
  return Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, rounded));
}

interface SettingsState {
  appLanguage: AppLanguage;
  speechRate: number;
  autoPlay: boolean;
  setAppLanguage: (l: AppLanguage) => void;
  setSpeechRate: (r: number) => void;
  setAutoPlay: (v: boolean) => void;
}

/** Device-local preferences (not account data). */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      appLanguage: deviceLanguage(),
      speechRate: 1.0,
      autoPlay: true,
      setAppLanguage: (appLanguage) => set({ appLanguage }),
      setSpeechRate: (r) => set({ speechRate: clampSpeechRate(r) }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
    }),
    {
      name: 'tm:settings:v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ appLanguage: s.appLanguage, speechRate: s.speechRate, autoPlay: s.autoPlay }),
    },
  ),
);
