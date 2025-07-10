export type User = {
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
};

export type LoginResponse = {
  success?: boolean;
  error?: string;
  user?: User;
};