import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type KeyboardContextType = {
  isKeyboardOpen: boolean;
  setKeyboardOpen: (open: boolean) => void;
};

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function useKeyboard() {
  return useContext(KeyboardContext);
}

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isKeyboardOpen, setKeyboardOpenState] = useState(false);
  const setKeyboardOpen = useCallback((open: boolean) => {
    setKeyboardOpenState(open);
  }, []);

  return (
    <KeyboardContext.Provider value={{ isKeyboardOpen, setKeyboardOpen }}>
      {children}
    </KeyboardContext.Provider>
  );
}
