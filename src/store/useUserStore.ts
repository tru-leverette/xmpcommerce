import { create } from "zustand";
import axios, { type AxiosError } from "axios";


// Define a User type for the registration form
interface UserForm {
  name: string;
  email: string;
  password: string;
  password2: string;
  country: string;
}

interface UserState {
    loading: boolean;
    message: string;
    success: boolean;
    addUser: (form: UserForm, onSuccess: () => void) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setMessage: (message: string) => void;
    setSuccess: (success: boolean) => void;
    reset: () => void;
    updateUser: (email: string, updateData: Partial<UserForm>, onSuccess?: () => void) => Promise<void>;
}

const baseURL: string = process.env.NEXT_PUBLIC_API_URL as string;

const api = axios.create({
  baseURL: baseURL,
});

async function apiAddUser(data: UserForm) {
    const res = await api.post("/user", data);
    return { ok: res.status === 200, ...res.data };
}

async function apiFindUser(email: string) {
    const res = await api.get(`/user?email=${encodeURIComponent(email)}`);
    return res.data;
}

async function apiDeleteUser(email: string) {
  const res = await api.delete("/user", { data: { email } });
  return res.data;
}

async function apiUpdateUser(email: string, updateData: Partial<UserForm>) {
  const res = await api.patch("/user", { email, ...updateData });
  return res.data;
}

export const useUserStore = create<UserState>((set) => ({
    loading: false,
    message: "",
    success: false,
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
            // Do something with the user data
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
    updateUser: async (email: string, updateData: Partial<UserForm>, onSuccess?: () => void) => {
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