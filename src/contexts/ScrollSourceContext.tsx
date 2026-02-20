import { createContext, useContext, useCallback, useState, useMemo, type ReactNode } from "react";

type ScrollSourceContextType = {
  registerScrollRef: (el: HTMLElement | null) => void;
  activeScrollElement: HTMLElement | null;
};

const ScrollSourceContext = createContext<ScrollSourceContextType | null>(null);

export function useScrollSource() {
  return useContext(ScrollSourceContext);
}

export function ScrollSourceProvider({ children }: { children: ReactNode }) {
  const [activeScrollElement, setActiveScrollElement] = useState<HTMLElement | null>(null);

  const registerScrollRef = useCallback((el: HTMLElement | null) => {
    setActiveScrollElement((prev) => (prev !== el ? el : prev));
  }, []);

  const value = useMemo(
    () => ({ registerScrollRef, activeScrollElement }),
    [registerScrollRef, activeScrollElement]
  );

  return (
    <ScrollSourceContext.Provider value={value}>
      {children}
    </ScrollSourceContext.Provider>
  );
}
