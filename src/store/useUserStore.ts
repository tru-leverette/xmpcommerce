import { create } from "zustand";
import { type AxiosError } from "axios";
import type { User, UserRegistrationForm } from "@/types/auth";
import { apiAddUser, apiDeleteUser, apiFindUser, apiUpdateUser } from "./userActions";

// Define a User type for the registration form

interface UserState {
  loading: boolean;
  message: string;
  success: boolean;
  user: User | null; // <-- add this
  isRegistered: boolean; // <-- add this
  setUser: (user: User) => void; // <-- add this
  setIsRegistered: (isRegistered: boolean) => void; // <-- add this
  clearUser: () => void; // <-- add this
  addUser: (form: UserRegistrationForm, onSuccess: () => void) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setMessage: (message: string) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  updateUser: (email: string, updateData: Partial<UserRegistrationForm>, onSuccess?: () => void) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  loading: false,
  message: "",
  success: false,
  user: null,
  isRegistered: false,
  setUser: (user) => set({
    user,
    isRegistered: Array.isArray(user.participants)
      ? user.participants.some((p) => p.participantStatus === "PENDING" || p.participantStatus === "ACTIVE")
      : false,
  }),
  setIsRegistered: (isRegistered) => set({ isRegistered }),
  clearUser: () => set({ user: null, isRegistered: false }),
  setLoading: (loading) => set({ loading }),
  setMessage: (message) => set({ message }),
  setSuccess: (success) => set({ success }),
  reset: () => set({ loading: false, message: "", success: false }),
  addUser: async (form, onSuccess) => {
        set({ loading: true, success: false });
        try {
            const result = await apiAddUser(form);
            if (result.ok) {
                set({ success: true });
                setTimeout(() => {
                    onSuccess();
                }, 2000)
            } else {
                set({ message: result.message || "User creation failed.", loading: false });
            }
        } catch (error: unknown) {
            const err = error as AxiosError<{ message?: string }>;
            set({
                message: err.response?.data?.message || "User creation failed due to server error.",
                loading: false,
            });
        }
    },
    findUser: async (email: string) => {
        try {
            const user = await apiFindUser(email);
            set({ message: `User found: ${user.name}` });
        } catch (error: unknown) {
            const err = error as AxiosError<{ message?: string }>;
            set({
                message: err.response?.data?.message || "User not found.",
            });
        }
    },
    deleteUser: async (email: string, onSuccess?: () => void) => {
        set({ loading: true, success: false });
        try {
            const result = await apiDeleteUser(email);
            if (result.success) {
                set({ success: true, message: result.message, loading: false });
                if (onSuccess) onSuccess();
            } else {
                set({ message: result.message || "User deletion failed.", loading: false });
            }
        } catch (error: unknown) {
            const err = error as AxiosError<{ message?: string }>;
            set({
                message: err.response?.data?.message || "User deletion failed due to server error.",
                loading: false,
            });
        }
    },
    updateUser: async (email: string, updateData: Partial<UserRegistrationForm>, onSuccess?: () => void) => {
        set({ loading: true, success: false });
        try {
            const result = await apiUpdateUser(email, updateData);
            if (result.success) {
                set({ success: true, message: "User updated.", loading: false });
                if (onSuccess) onSuccess();
            } else {
                set({ message: result.message || "User update failed.", loading: false });
            }
        } catch (error: unknown) {
            const err = error as AxiosError<{ message?: string }>;
            set({
                message: err.response?.data?.message || "User update failed due to server error.",
                loading: false,
            });
        }
    },
}));