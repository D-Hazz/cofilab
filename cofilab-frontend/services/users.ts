// src/services/users.ts
import { api } from "@/lib/api";
import { UserProfile } from "@/types/user";

const BASE = process.env.NEXT_PUBLIC_API_URL + "/users/";

export async function getUsers(): Promise<UserProfile[]> {
  return api<UserProfile[]>(BASE);
}

export async function getUser(id: number): Promise<UserProfile> {
  return api<UserProfile>(`${BASE}${id}/`);
}

export async function updateUser(
  id: number,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  return api<UserProfile>(`${BASE}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
