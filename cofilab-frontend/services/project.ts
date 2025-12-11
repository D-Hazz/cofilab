// src/services/projects.ts
import { api } from "@/lib/api";
import { Project } from "@/types/project";

const BASE = process.env.NEXT_PUBLIC_API_URL + "/projects/";

export async function getProjects(): Promise<Project[]> {
  return api<Project[]>(BASE);
}

export async function getProject(id: number): Promise<Project> {
  return api<Project>(`${BASE}${id}/`);
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return api<Project>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: number,
  data: Partial<Project>
): Promise<Project> {
  return api<Project>(`${BASE}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: number): Promise<void> {
  await api(`${BASE}${id}/`, { method: "DELETE" });
}
