import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axios';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import EventCard, { getEventCardKey, type EventCardProps } from '../components/EventCard';
import Navbar from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import { type EventCardData } from '../types';

type ApiEventRecord = Record<string, unknown>;
type EventMode = 'Online' | 'Offline';
type ModeFilter = 'All' | EventMode;
type SortFilter = 'score' | 'date';

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

function normalizeEvent(item: ApiEventRecord): EventCardProps {
  const id = (item.id as string | number | null | undefined) ?? (item.eventId as string | number | null | undefined) ?? null;
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
  const finalScore = (item.finalScore as string | number) ?? (item.score as string | number) ?? 'N/A';
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

function parseScore(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? -Infinity : parsed;
}

function parseDateValue(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function applyFilters(
  events: EventCardData[],
  modeFilter: ModeFilter,
  categoryFilter: string,
  sortFilter: SortFilter
): EventCardData[] {
  const filtered = events.filter((event) => {
    const modeMatch = modeFilter === 'All' || event.mode === modeFilter;
    const categoryMatch = categoryFilter === 'All' || event.category === categoryFilter;
    return modeMatch && categoryMatch;
  });

  return [...filtered].sort((left, right) => {
    if (sortFilter === 'score') {
      return parseScore(right.finalScore) - parseScore(left.finalScore);
    }

    return parseDateValue(right.eventDate) - parseDateValue(left.eventDate);
  });
}

type EventSectionProps = {
  title: string;
  events: EventCardData[];
};

function EventSection({ title, events }: EventSectionProps) {
  return (
    <section className="animate-section-fade">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <EmptyState subtitle="Try changing filters or check back shortly for new recommendations." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={getEventCardKey(event)}
              id={event.id}
              title={event.title}
              category={event.category}
              location={event.location}
              eventDate={event.eventDate}
              finalScore={event.finalScore}
              explanation={event.explanation}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type EventSectionSkeletonProps = {
  title: string;
};

function EventSectionSkeleton({ title }: EventSectionSkeletonProps) {
  return (
    <section className="animate-section-fade">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <span className="text-sm text-slate-400">Loading...</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={`${title}-skeleton-${index}`} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardData[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<EventCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortFilter, setSortFilter] = useState<SortFilter>('score');

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();

    [...recommendedEvents, ...trendingEvents].forEach((event) => {
      categories.add(event.category);
    });

    return ['All', ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [recommendedEvents, trendingEvents]);

  const filteredRecommendedEvents = useMemo(
    () => applyFilters(recommendedEvents, modeFilter, categoryFilter, sortFilter),
    [recommendedEvents, modeFilter, categoryFilter, sortFilter]
  );

  const filteredTrendingEvents = useMemo(
    () => applyFilters(trendingEvents, modeFilter, categoryFilter, sortFilter),
    [trendingEvents, modeFilter, categoryFilter, sortFilter]
  );

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setIsLoading(true);

      const [recommendedResult, trendingResult] = await Promise.allSettled([
        axiosInstance.get('/api/recommendations/live'),
        axiosInstance.get('/api/events/trending'),
      ]);

      if (!mounted) {
        return;
      }

      if (recommendedResult.status === 'fulfilled') {
        setRecommendedEvents(normalizeEvents(recommendedResult.value.data));
      } else {
        setRecommendedEvents([]);
      }

      if (trendingResult.status === 'fulfilled') {
        setTrendingEvents(normalizeEvents(trendingResult.value.data));
      } else {
        setTrendingEvents([]);
      }

      setIsLoading(false);
    };

    fetchEvents();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={logout} />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Discover personalized and trending events.</p>
        </header>

        <section className="mb-8 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="modeFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Mode
              </label>
              <select
                id="modeFilter"
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="All">All</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {categoryOptions.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sortFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Sort by
              </label>
              <select
                id="sortFilter"
                value={sortFilter}
                onChange={(event) => setSortFilter(event.target.value as SortFilter)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="score">Score</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-10">
            <EventSectionSkeleton title="Recommended for You" />
            <EventSectionSkeleton title="Trending Events" />
          </div>
        ) : (
          <div className="space-y-12">
            <EventSection title="Recommended for You" events={filteredRecommendedEvents} />
            <EventSection title="Trending Events" events={filteredTrendingEvents} />
          </div>
        )}
      </main>
    </div>
  );
}
