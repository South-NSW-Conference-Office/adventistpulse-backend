import { apiClient } from "./client";

export interface EntityOption {
  _id:   string;
  name:  string;
  code:  string;
  level: string;
}

export async function getDivisions(): Promise<EntityOption[]> {
  const body = await apiClient<{ data: EntityOption[] }>("/api/v1/entities/divisions");
  return body.data;
}

export async function getEntityChildren(code: string): Promise<EntityOption[]> {
  const body = await apiClient<{ data: EntityOption[] }>(`/api/v1/entities/${code}/children`);
  return body.data;
}
