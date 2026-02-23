import { type EventCardData } from '../types';

export type EventCardProps = EventCardData;

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
}: EventCardProps) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {category}
        </span>
      </div>

      <div className="space-y-2.5 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-700">Location:</span> {location}
        </p>
        <p>
          <span className="font-medium text-slate-700">Date:</span> {eventDate}
        </p>
        <p>
          <span className="font-medium text-slate-700">Final Score:</span> {finalScore}
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3.5">
        <p className="text-sm italic leading-6 text-slate-600">{explanation}</p>
      </div>
    </article>
  );
}
