import { apiClient } from "./client";

const BASE = "/api/v1/onboarding";

export interface OnboardingProfileData {
  phone?:           string | null;
  country:          string;
  division:         string;
  union:            string;
  conference:       string;
  divisionId?:      string | null;
  unionId?:         string | null;
  conferenceId?:    string | null;
  localChurch:      string;
  churchRole:       string;
  roleDescription?: string | null;
  purposeStatement: string;
}

export interface OnboardingStatus {
  accountStatus:   string;
  rejectionReason: string | null;
  profile:         OnboardingProfileData | null;
}

interface ApiWrapper<T> { data: T; }

export async function getOnboardingStatus(accessToken: string): Promise<OnboardingStatus> {
  const res = await apiClient<ApiWrapper<OnboardingStatus>>(BASE, { accessToken });
  return res.data;
}

export async function submitOnboarding(
  accessToken: string,
  data: OnboardingProfileData
): Promise<{ accountStatus: string }> {
  const res = await apiClient<ApiWrapper<{ accountStatus: string }>>(`${BASE}/submit`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(data),
  });
  return res.data;
}
