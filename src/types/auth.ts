export interface User {
  id: number;
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  avatar?: string;
  participants?: Participant[]
}

export interface Participant {
  id: number;
  gameId: number;
  registrationDate: string;
  participantStatus: string;
}

export type UserRegistrationForm = {
  name: string;
  email: string;
  password: string;
  password2: string;
  country: string;
}

export type LoginResponse = {
  success?: boolean;
  error?: string;
  user?: User;
};