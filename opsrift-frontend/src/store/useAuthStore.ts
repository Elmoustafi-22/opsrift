import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  title?: string;
  avatar?: string;
  isFirstLogin?: boolean;
  profile?: {
    phone?: string;
    avatar?: string;
    institution?: string;
    courseOfStudy?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    hasPaidCertificate?: boolean;
    certificatePaymentDate?: string | Date;
    certificateUrl?: string;
    isGraduated?: boolean;
    graduationDate?: string | Date;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
    }
  )
);
