import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getUsersData,
  setCurrentUserId,
  setUsersData,
  addUser as addAppUser,
  findUserByPhoneAndPassword,
  updateAppUser,
  getAppUserById,
  getStorageKey,
  type AppUser,
} from "@/lib/userStorage";

const LEGACY_USER_KEY = "reformator_bio_user";

function migrateLegacyUserIfNeeded(): void {
  const data = getUsersData();
  if (data.users.length > 0) return;
  try {
    const raw = localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    const id = typeof legacy.id === "string" ? legacy.id : `legacy_${Date.now()}`;
    const user: AppUser = {
      id,
      phone: String(legacy.phone ?? ""),
      nickname: String(legacy.nickname ?? legacy.firstName ?? ""),
      password: String(legacy.password ?? ""),
      createdAt: Date.now(),
      firstName: legacy.firstName as string | undefined,
      lastName: legacy.lastName as string | undefined,
      email: legacy.email as string | undefined,
      avatar: legacy.avatar as string | undefined,
      dob: legacy.dob as string | undefined,
      activityLevel: legacy.activityLevel as string | undefined,
      wearable: legacy.wearable as string | undefined,
      height: legacy.height as number | undefined,
      weight: legacy.weight as number | undefined,
      goal: legacy.goal as AppUser["goal"],
    };
    if (!user.phone || !user.password) return;
    setUsersData({ currentUserId: id, users: [user] });
    const nutRaw = localStorage.getItem("reformator_bio_nutrition");
    if (nutRaw) localStorage.setItem(getStorageKey(id, "nutrition"), nutRaw);
    const waterRaw = localStorage.getItem("reformator_bio_water");
    if (waterRaw) localStorage.setItem(getStorageKey(id, "water"), waterRaw);
    const workoutRaw = localStorage.getItem("reformator_bio_workout_history");
    if (workoutRaw) localStorage.setItem(getStorageKey(id, "workout_history"), workoutRaw);
    const labsRaw = localStorage.getItem("reformator_bio_labs");
    if (labsRaw) localStorage.setItem(getStorageKey(id, "labs"), labsRaw);
  } catch {
    // ignore
  }
}

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
  isVerified?: boolean;
  city?: string;
  mentalHealthScore?: number;
  mentalHealthStatus?: string;
}

export type ProfileUpdates = Partial<
  Pick<
    StoredUser,
    | "firstName"
    | "lastName"
    | "nickname"
    | "email"
    | "avatar"
    | "dob"
    | "activityLevel"
    | "height"
    | "weight"
    | "goal"
    | "wearable"
    | "isVerified"
    | "city"
    | "mentalHealthScore"
    | "mentalHealthStatus"
  >
>;

export type UserWithFullName = StoredUser & { fullName: string; id: string };

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserWithFullName | null;
  login: (loginId: string, password: string) => { success: boolean; error?: string };
  register: (data: {
    phone: string;
    password: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  hasUser: () => boolean;
  updateUser: (updates: ProfileUpdates) => void;
}

function appUserToStored(app: AppUser): StoredUser {
  const { id, createdAt, ...rest } = app;
  return rest;
}

function withFullName(app: AppUser): UserWithFullName {
  const fullName =
    app.nickname?.trim() ||
    [app.firstName, app.lastName].filter(Boolean).join(" ").trim() ||
    "Пользователь";
  return { ...appUserToStored(app), fullName, id: app.id };
}

function getCurrentStoredUser(): UserWithFullName | null {
  const { currentUserId, users } = getUsersData();
  if (!currentUserId) return null;
  const app = users.find((u) => u.id === currentUserId) ?? getAppUserById(currentUserId);
  return app ? withFullName(app) : null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithFullName | null>(() => {
    migrateLegacyUserIfNeeded();
    return getCurrentStoredUser();
  });
  const isAuthenticated = !!user?.id;

  useEffect(() => {
    const current = getCurrentStoredUser();
    setUser(current);
  }, []);

  const updateUser = useCallback((updates: ProfileUpdates) => {
    const current = getCurrentStoredUser();
    if (!current) return;
    updateAppUser(current.id, updates);
    const next = getCurrentStoredUser();
    setUser(next);
  }, []);

  const hasUser = useCallback(() => !!getCurrentStoredUser(), []);

  const register = useCallback(
    (data: {
      phone: string;
      password: string;
      nickname: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    }): { success: boolean; error?: string } => {
      const result = addAppUser({
        phone: data.phone.trim(),
        password: data.password,
        nickname: data.nickname.trim(),
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
        email: data.email?.trim() || undefined,
      });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      setCurrentUserId(result.user.id);
      setUser(withFullName(result.user));
      return { success: true };
    },
    []
  );

  const login = useCallback((loginId: string, password: string): { success: boolean; error?: string } => {
    const found = findUserByPhoneAndPassword(loginId.trim(), password);
    if (!found) {
      return { success: false, error: "Неверный логин или пароль." };
    }
    setCurrentUserId(found.id);
    setUser(withFullName(found));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
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
