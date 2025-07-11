export type Game = {
  id: number;
  location: string;
  status: "PENDING" | "ACTIVE" | "FINISHED";
  createdAt: string;
  createdById: number;
  launchedById?: number | null;
};