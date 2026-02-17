import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const AUTH_KEY = "reformator_bio_auth";
const USER_KEY = "reformator_bio_user";

export interface StoredUser {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  phone: string;
  email?: string;
  password: string;
  avatar?: string;
  dob?: string;
  activityLevel?: string;
  wearable?: string;
  height?: number;
  weight?: number;
  goal?: "gain" | "maintain" | "lose";
}

export type ProfileUpdates = Partial<
  Pick<StoredUser, "firstName" | "lastName" | "nickname" | "email" | "avatar" | "dob" | "activityLevel" | "height" | "weight" | "goal" | "wearable">
>;

interface AuthContextType {
  isAuthenticated: boolean;
  user: (StoredUser & { fullName: string }) | null;
  login: (loginId: string, password: string) => { success: boolean; error?: string };
  register: (data: {
    phone: string;
    password: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => void;
  logout: () => void;
  hasUser: () => boolean;
  updateUser: (updates: ProfileUpdates) => void;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

function withFullName(stored: StoredUser): StoredUser & { fullName: string } {
  const fullName =
    stored.nickname?.trim() ||
    [stored.firstName, stored.lastName].filter(Boolean).join(" ").trim() ||
    "Пользователь";
  return { ...stored, fullName };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState<(StoredUser & { fullName: string }) | null>(() => {
    if (typeof localStorage === "undefined" || localStorage.getItem(AUTH_KEY) !== "true") return null;
    const stored = getStoredUser();
    return stored ? withFullName(stored) : null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, String(isAuthenticated));
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredUser();
      setUser(stored ? withFullName(stored) : null);
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  const updateUser = useCallback((updates: ProfileUpdates) => {
    const current = getStoredUser();
    if (!current) return;
    const updated: StoredUser = { ...current, ...updates };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(withFullName(updated));
    } catch {
      // ignore
    }
  }, []);

  const hasUser = useCallback(() => !!getStoredUser(), []);

  const register = useCallback(
    (data: {
      phone: string;
      password: string;
      nickname: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    }) => {
      const newUser: StoredUser = {
        phone: data.phone.trim(),
        password: data.password,
        nickname: data.nickname.trim(),
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
        email: data.email?.trim() || undefined,
      };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setUser(withFullName(newUser));
        setIsAuthenticated(true);
      } catch {
        // ignore
      }
    },
    []
  );

  const login = useCallback((loginId: string, password: string): { success: boolean; error?: string } => {
    const stored = getStoredUser();
    if (!stored) {
      return { success: false, error: "Неверный логин или пароль." };
    }
    const id = loginId.trim();
    const match =
      (stored.phone === id || stored.email === id) && stored.password === password;
    if (!match) {
      return { success: false, error: "Неверный логин или пароль." };
    }
    setUser(withFullName(stored));
    setIsAuthenticated(true);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        hasUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
