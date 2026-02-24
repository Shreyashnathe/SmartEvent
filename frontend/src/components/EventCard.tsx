import { useMemo, useState } from 'react';
import { type EventCardData } from '../types';

export type EventCardProps = EventCardData & {
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  isBookmarkDisabled?: boolean;
};

export function getEventCardKey(event: Pick<EventCardProps, 'id' | 'title' | 'eventDate'>): string {
  if (event.id !== null && event.id !== undefined && event.id !== '') {
    return `event-${String(event.id)}`;
  }

  return `event-${event.title}-${event.eventDate}`;
}

export default function EventCard({
  title,
  category,
  location,
  eventDate,
  finalScore,
  explanation,
  isBookmarked = false,
  onToggleBookmark,
  isBookmarkDisabled = false,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanedExplanation = useMemo(() => explanation.trim(), [explanation]);
  const shouldTruncate = cleanedExplanation.length > 120;
  const displayedExplanation =
    shouldTruncate && !isExpanded
      ? `${cleanedExplanation.slice(0, 120).trimEnd()}...`
      : cleanedExplanation;

  return (
    <article className="relative rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggleBookmark}
        disabled={isBookmarkDisabled || !onToggleBookmark}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition duration-150 hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" />
        </svg>
      </button>

      <div className="mb-3.5 flex items-start justify-between gap-3 pr-10">
        <h3 className="text-lg font-semibold leading-6 tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {category}
        </span>
      </div>

      <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Location:</span> {location}
        </p>
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Date:</span> {eventDate}
        </p>
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Final Score:</span> {finalScore}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3.5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-amber-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.75c.73.55 1 1.14 1 1.75V17h6v-.5c0-.61.27-1.2 1-1.75A7 7 0 0 0 12 2Z" />
            </svg>
          </span>

          <div className="min-w-0">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{displayedExplanation}</p>

            {shouldTruncate ? (
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="mt-2 text-sm font-medium text-indigo-600 transition duration-150 hover:text-indigo-700"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
