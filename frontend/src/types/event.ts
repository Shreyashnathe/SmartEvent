export type EventCardData = {
  id?: string | number | null;
  title: string;
  category: string;
  mode?: 'Online' | 'Offline';
  location: string;
  eventDate: string;
  finalScore: string | number;
  explanation: string;
};
