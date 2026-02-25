import { useCallback, useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EventCard, { getEventCardKey } from '../components/EventCard';
import Navbar from '../components/Navbar';
import { getTrendingEvents } from '../services/eventService';
import { getLiveRecommendations } from '../services/recommendationService';
import {
  addUserBookmark,
  getUserBookmarks,
  removeUserBookmark,
} from '../services/userService';
import SkeletonCard from '../components/SkeletonCard';
import { type EventCardData } from '../types';
import { resolveApiErrorMessage } from '../utils/apiError';

type EventMode = 'Online' | 'Offline';
type ModeFilter = 'All' | EventMode;
type SortFilter = 'score' | 'date';

function getBookmarkId(event: Pick<EventCardData, 'id'>): string | null {
  if (event.id === null || event.id === undefined || event.id === '') {
    return null;
  }

  return String(event.id);
}

function formatScore(value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return 'N/A';
  }

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return 'N/A';
  }

  return parsed.toFixed(2);
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
  hasAnyEvents: boolean;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (event: EventCardData) => void;
  emptyStateSubtitle?: string;
};

function EventSection({
  title,
  events,
  hasAnyEvents,
  bookmarkedIds,
  onToggleBookmark,
  emptyStateSubtitle,
}: EventSectionProps) {
  const emptySubtitle =
    emptyStateSubtitle ??
    (hasAnyEvents ? 'No events match your filters.' : 'No events available right now.');

  return (
    <section className="animate-section-fade">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <EmptyState subtitle={emptySubtitle} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const bookmarkId = getBookmarkId(event);

            return (
            <EventCard
              key={getEventCardKey(event)}
              id={event.id}
              title={event.title}
              category={event.category}
              location={event.location}
              eventDate={event.eventDate}
              finalScore={formatScore(event.finalScore)}
              explanation={event.explanation}
              isBookmarked={bookmarkId ? bookmarkedIds.has(bookmarkId) : false}
              isBookmarkDisabled={!bookmarkId}
              onToggleBookmark={() => onToggleBookmark(event)}
            />
            );
          })}
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
        <span className="text-sm text-slate-400">Loading...</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={`${title}-skeleton-${index}`} staggerIndex={index} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const toast = useToast();
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardData[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<EventCardData[]>([]);
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const bookmarkedIdSet = useMemo(() => new Set(bookmarkedEventIds), [bookmarkedEventIds]);

  const bookmarkedEvents = useMemo(() => {
    const eventMap = new Map<string, EventCardData>();

    [...recommendedEvents, ...trendingEvents].forEach((event) => {
      const bookmarkId = getBookmarkId(event);

      if (!bookmarkId) {
        return;
      }

      if (!eventMap.has(bookmarkId)) {
        eventMap.set(bookmarkId, event);
      }
    });

    return bookmarkedEventIds
      .map((bookmarkId) => eventMap.get(bookmarkId))
      .filter((event): event is EventCardData => Boolean(event));
  }, [bookmarkedEventIds, recommendedEvents, trendingEvents]);

  const filteredBookmarkedEvents = useMemo(
    () => applyFilters(bookmarkedEvents, modeFilter, categoryFilter, sortFilter),
    [bookmarkedEvents, modeFilter, categoryFilter, sortFilter]
  );

  const filteredRecommendedEvents = useMemo(
    () => applyFilters(recommendedEvents, modeFilter, categoryFilter, sortFilter),
    [recommendedEvents, modeFilter, categoryFilter, sortFilter]
  );

  const filteredTrendingEvents = useMemo(
    () => applyFilters(trendingEvents, modeFilter, categoryFilter, sortFilter),
    [trendingEvents, modeFilter, categoryFilter, sortFilter]
  );

  const fetchEvents = useCallback(async (
    showFullLoading: boolean,
    shouldApplyResult: () => boolean = () => true
  ) => {
    if (showFullLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const [recommendedResult, trendingResult] = await Promise.allSettled([
      getLiveRecommendations(),
      getTrendingEvents(),
    ]);

    if (!shouldApplyResult()) {
      return;
    }

    if (recommendedResult.status === 'fulfilled') {
      setRecommendedEvents(recommendedResult.value);
    } else {
      setRecommendedEvents([]);
      toast.error(
        resolveApiErrorMessage(
          recommendedResult.reason,
          'Unable to load recommended events right now. Please try again.'
        )
      );
    }

    if (trendingResult.status === 'fulfilled') {
      setTrendingEvents(trendingResult.value);
    } else {
      setTrendingEvents([]);
      toast.error(
        resolveApiErrorMessage(
          trendingResult.reason,
          'Unable to load trending events right now. Please try again.'
        )
      );
    }

    if (showFullLoading) {
      setIsLoading(false);
    } else {
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      const [eventsResult, bookmarksResult] = await Promise.allSettled([
        fetchEvents(true, () => isMounted),
        getUserBookmarks(),
      ]);

      if (!isMounted) {
        return;
      }

      if (bookmarksResult.status === 'fulfilled') {
        setBookmarkedEventIds(bookmarksResult.value);
      } else {
        setBookmarkedEventIds([]);
        toast.error(
          resolveApiErrorMessage(
            bookmarksResult.reason,
            'Unable to load bookmarks right now. Please try again.'
          )
        );
      }

      if (eventsResult.status === 'rejected') {
        return;
      }
    };

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [fetchEvents]);

  const handleRefresh = async () => {
    if (isLoading || isRefreshing) {
      return;
    }

    await fetchEvents(false);
  };

  const toggleBookmarkedEvent = useCallback(async (event: EventCardData) => {
    const bookmarkId = getBookmarkId(event);

    if (!bookmarkId) {
      return;
    }

    const wasBookmarked = bookmarkedIdSet.has(bookmarkId);
    const previousIds = bookmarkedEventIds;
    const nextIds = wasBookmarked
      ? bookmarkedEventIds.filter((id) => id !== bookmarkId)
      : [...bookmarkedEventIds, bookmarkId];

    setBookmarkedEventIds(nextIds);

    try {
      if (wasBookmarked) {
        await removeUserBookmark(bookmarkId);
      } else {
        await addUserBookmark(bookmarkId);
      }
    } catch (error: unknown) {
      setBookmarkedEventIds(previousIds);
      toast.error(
        resolveApiErrorMessage(
          error,
          'Unable to update bookmark right now. Please try again.'
        )
      );
    }
  }, [bookmarkedEventIds, bookmarkedIdSet, toast]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar onLogout={logout} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">Dashboard</h1>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
            >
              {isRefreshing ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-600 dark:border-t-slate-200"
                />
              ) : null}
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-300">Discover personalized and trending events.</p>
        </header>

        <section className="mb-8 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="modeFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Mode
              </label>
              <select
                id="modeFilter"
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
              >
                <option value="All">All</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
              >
                {categoryOptions.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sortFilter" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sort by
              </label>
              <select
                id="sortFilter"
                value={sortFilter}
                onChange={(event) => setSortFilter(event.target.value as SortFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
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
            <EventSection
              title="Bookmarked Events"
              events={filteredBookmarkedEvents}
              hasAnyEvents={bookmarkedEvents.length > 0}
              bookmarkedIds={bookmarkedIdSet}
              onToggleBookmark={toggleBookmarkedEvent}
              emptyStateSubtitle={
                bookmarkedEventIds.length > 0
                  ? 'No events match your filters.'
                  : 'Bookmark events to quickly access them here.'
              }
            />
            <EventSection
              title="Recommended for You"
              events={filteredRecommendedEvents}
              hasAnyEvents={recommendedEvents.length > 0}
              bookmarkedIds={bookmarkedIdSet}
              onToggleBookmark={toggleBookmarkedEvent}
            />
            <EventSection
              title="Trending Events"
              events={filteredTrendingEvents}
              hasAnyEvents={trendingEvents.length > 0}
              bookmarkedIds={bookmarkedIdSet}
              onToggleBookmark={toggleBookmarkedEvent}
            />
          </div>
        )}
      </main>
    </div>
  );
}
