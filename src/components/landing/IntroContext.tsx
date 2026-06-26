'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface IntroContextValue {
  introDone: boolean;
  markIntroDone: () => void;
}

const IntroContext = createContext<IntroContextValue>({ introDone: false, markIntroDone: () => {} });

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [introDone, setIntroDone] = useState(false);
  const markIntroDone = useCallback(() => setIntroDone(true), []);
  return <IntroContext.Provider value={{ introDone, markIntroDone }}>{children}</IntroContext.Provider>;
}

export function useIntro() {
  return useContext(IntroContext);
}
