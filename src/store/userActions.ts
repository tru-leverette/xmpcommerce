import { UserRegistrationForm } from "@/types/auth";
import { baseURL } from "./baseUrlEvn";
import axios from "axios";

const api = axios.create({
  baseURL: baseURL,
});

export async function apiAddUser(data: UserRegistrationForm) {
    const res = await api.post("/user", data);
    return { ok: res.status === 200, ...res.data };
}

export async function apiFindUser(email: string) {
    const res = await api.get(`/user?email=${encodeURIComponent(email)}`);
    return res.data;
}

export async function apiDeleteUser(email: string) {
  const res = await api.delete("/user", { data: { email } });
  return res.data;
}

export async function apiUpdateUser(email: string, updateData: Partial<UserRegistrationForm>) {
  const res = await api.patch("/user", { email, ...updateData });
  return res.data;
}