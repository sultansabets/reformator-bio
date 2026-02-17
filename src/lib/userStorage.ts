/**
 * Multi-user local storage (up to 5 users for testing).
 * Key: reformator_users
 * Structure: { currentUserId: string | null, users: AppUser[] }
 * Per-user data keys: user_{id}_nutrition, user_{id}_water, user_{id}_workout_history, user_{id}_workouts, user_{id}_labs
 */

export const USERS_STORAGE_KEY = "reformator_users";
export const MAX_USERS = 5;

export interface AppUser {
  id: string;
  phone: string;
  nickname: string;
  password: string;
  createdAt: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  dob?: string;
  activityLevel?: string;
  wearable?: string;
  height?: number;
  weight?: number;
  goal?: "gain" | "maintain" | "lose";
}

export interface UsersData {
  currentUserId: string | null;
  users: AppUser[];
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getUsersData(): UsersData {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  const data = safeParse<UsersData>(raw, { currentUserId: null, users: [] });
  if (!data || !Array.isArray(data.users)) {
    return { currentUserId: null, users: [] };
  }
  return {
    currentUserId: data.currentUserId ?? null,
    users: data.users,
  };
}

export function setUsersData(data: UsersData): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getCurrentUserId(): string | null {
  return getUsersData().currentUserId;
}

export function setCurrentUserId(userId: string | null): void {
  const data = getUsersData();
  data.currentUserId = userId;
  setUsersData(data);
}

export function getStorageKey(userId: string, suffix: string): string {
  return `user_${userId}_${suffix}`;
}

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function addUser(
  user: Omit<AppUser, "id" | "createdAt">
): { success: true; user: AppUser } | { success: false; error: string } {
  const data = getUsersData();
  if (data.users.length >= MAX_USERS) {
    return { success: false, error: "Достигнут лимит пользователей (5)." };
  }
  const newUser: AppUser = {
    ...user,
    id: generateId(),
    createdAt: Date.now(),
  };
  data.users.push(newUser);
  setUsersData(data);
  return { success: true, user: newUser };
}

export function findUserByPhoneAndPassword(
  phoneOrEmail: string,
  password: string
): AppUser | null {
  const { users } = getUsersData();
  const id = phoneOrEmail.trim();
  const found = users.find(
    (u) => (u.phone === id || u.email === id) && u.password === password
  );
  return found ?? null;
}

export function updateAppUser(userId: string, updates: Partial<AppUser>): void {
  const data = getUsersData();
  const index = data.users.findIndex((u) => u.id === userId);
  if (index === -1) return;
  data.users[index] = { ...data.users[index], ...updates };
  setUsersData(data);
}

export function getAppUserById(userId: string): AppUser | null {
  const { users } = getUsersData();
  return users.find((u) => u.id === userId) ?? null;
}
