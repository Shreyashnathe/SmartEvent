import axiosInstance from '../api/axios';
import type { EventCardData } from '../types';

type ApiEventRecord = Record<string, unknown>;

function formatEventDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const container = payload as Record<string, unknown>;
    const keys = ['data', 'items', 'events', 'results'];

    for (const key of keys) {
      if (Array.isArray(container[key])) {
        return container[key] as unknown[];
      }
    }
  }

  return [];
}

function normalizeEvent(item: ApiEventRecord): EventCardData {
  const id =
    (item.id as string | number | null | undefined) ??
    (item.eventId as string | number | null | undefined) ??
    null;
  const title = (item.title as string) || (item.name as string) || 'Untitled Event';
  const category = (item.category as string) || 'General';
  const location = (item.location as string) || 'TBD';
  const mode =
    ((item.mode as string) || (item.eventMode as string))?.toLowerCase() === 'online' ||
    item.isOnline === true
      ? 'Online'
      : 'Offline';
  const rawDate =
    (item.eventDate as string) ||
    (item.date as string) ||
    (item.startDate as string) ||
    'TBA';
  const finalScore =
    (item.finalScore as string | number) ?? (item.score as string | number) ?? 'N/A';
  const explanation =
    (item.explanation as string) ||
    (item.description as string) ||
    'No additional event details are available yet.';

  return {
    id,
    title,
    category,
    mode,
    location,
    eventDate: formatEventDate(rawDate),
    finalScore,
    explanation,
  };
}

function normalizeEvents(payload: unknown): EventCardData[] {
  return getArrayPayload(payload)
    .filter((item): item is ApiEventRecord => Boolean(item && typeof item === 'object'))
    .map(normalizeEvent);
}

export async function getLiveRecommendations(): Promise<EventCardData[]> {
  const { data } = await axiosInstance.get<unknown>('/api/recommendations/live');
  return normalizeEvents(data);
}
