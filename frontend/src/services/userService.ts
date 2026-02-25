import axiosInstance from '../api/axios';
import type { UserProfile } from '../types';

type ApiRecord = Record<string, unknown>;
type ApiBookmarkRecord = {
  eventId?: string | number | null;
};

export type UserProfileDetails = UserProfile & {
  createdAt?: string;
};

export type UpdatePreferencesRequest = {
  codingPreference: number;
  communicationPreference: number;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return clamp01(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : clamp01(parsed);
  }

  return fallback;
}

function extractRoot(payload: unknown): ApiRecord {
  const data = (payload ?? {}) as ApiRecord;
  return ((data.data as ApiRecord | undefined) ?? data) as ApiRecord;
}

function normalizeUserProfile(payload: unknown): UserProfileDetails {
  const nested = extractRoot(payload);

  return {
    email:
      (nested.email as string) ||
      (nested.userEmail as string) ||
      (nested.username as string) ||
      'Not available',
    createdAt:
      (nested.createdAt as string) ||
      (nested.createdDate as string) ||
      (nested.created_on as string) ||
      undefined,
    codingPreferenceWeight: toNumber(
      nested.codingPreferenceWeight ?? nested.codingPreference ?? nested.codingWeight,
      0.5
    ),
    communicationPreferenceWeight: toNumber(
      nested.communicationPreferenceWeight ??
        nested.communicationPreference ??
        nested.communicationWeight,
      0.5
    ),
  };
}

function normalizeBookmarkIds(payload: unknown): string[] {
  const root = extractRoot(payload);
  const candidates = [payload, root, root.items, root.events, root.bookmarks, root.data];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    return candidate
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item);
        }

        if (item && typeof item === 'object') {
          const record = item as ApiBookmarkRecord;

          if (record.eventId !== undefined && record.eventId !== null && record.eventId !== '') {
            return String(record.eventId);
          }
        }

        return null;
      })
      .filter((item): item is string => Boolean(item));
  }

  return [];
}

export async function getCurrentUserProfile(): Promise<UserProfileDetails> {
  const { data } = await axiosInstance.get<unknown>('/api/users/me');
  return normalizeUserProfile(data);
}

export async function updateUserPreferences(
  payload: UpdatePreferencesRequest
): Promise<void> {
  await axiosInstance.put<unknown, unknown, UpdatePreferencesRequest>(
    '/api/users/preferences',
    payload
  );
}

export async function changeUserPassword(
  payload: ChangePasswordRequest
): Promise<void> {
  await axiosInstance.put<unknown, unknown, ChangePasswordRequest>(
    '/api/users/change-password',
    payload
  );
}

export async function getUserBookmarks(): Promise<string[]> {
  const { data } = await axiosInstance.get<unknown>('/api/users/bookmarks');
  return normalizeBookmarkIds(data);
}

export async function addUserBookmark(eventId: string): Promise<void> {
  await axiosInstance.post(`/api/users/bookmarks/${encodeURIComponent(eventId)}`);
}

export async function removeUserBookmark(eventId: string): Promise<void> {
  await axiosInstance.delete(`/api/users/bookmarks/${encodeURIComponent(eventId)}`);
}
