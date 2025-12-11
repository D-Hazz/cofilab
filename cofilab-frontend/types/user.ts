// src/types/user.ts
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
  created_at: string;
}
