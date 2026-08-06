export type UserRole =
  | "customer"
  | "merchant"
  | "organization"
  | "admin";

export type UserStatus =
  | "pending"
  | "active"
  | "suspended";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}