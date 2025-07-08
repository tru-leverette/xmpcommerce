import { create } from "zustand";
import axios, { type AxiosError } from "axios";


// Define a type for the registration form
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
}

const baseURL: string = process.env.NEXT_PUBLIC_API_URL as string;

const api = axios.create({
  baseURL: baseURL,
});

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
}));

async function apiAddUser(data: UserForm) {
    const res = await api.post("/user", data);
    return { ok: res.status === 200, ...res.data };
}