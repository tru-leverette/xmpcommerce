import { create } from "zustand";
import axios from "axios";

interface RegistrationState {
    loading: boolean;
    message: string;
    success: boolean;
    registerUser: (form: any, onSuccess: () => void) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setMessage: (message: string) => void;
    setSuccess: (success: boolean) => void;
    reset: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
    loading: false,
    message: "",
    success: false,
    setLoading: (loading) => set({ loading }),
    setMessage: (message) => set({ message }),
    setSuccess: (success) => set({ success }),
    reset: () => set({ loading: false, message: "", success: false }),
    registerUser: async (form, onSuccess) => {
        set({ loading: true, success: false });
        try {
            console.log('hitting registerUser with form:', form);
            const result = await apiRegisterUser(form);
            if (result.ok) {
                set({ success: true });
                setTimeout(() => {
                    set({ loading: false });
                    onSuccess();
                }, 2000); // 2 second delay
            } else {
                set({ message: result.message || "Registration failed.", loading: false });
            }
        } catch (error: any) {
            set({
                message: error?.response?.data?.message || "Registration failed due to server error.",
                loading: false,
            });
        }
    },
}));

async function apiRegisterUser(data: any) {
    console.log('hitting apiRegisterUser with data:', data);
    const res = await axios.post("http://localhost:5000/api/register", data);
    return { ok: res.status === 200, ...res.data };
}