// CoomerKemono Types
export interface Creator {
  favorited: number;
  id: string;
  indexed: number;
  name: string;
  service: string;
  updated: number;
}

export interface Profile {
  id: string;
  name: string;
  service: string;
  indexed: string;
  updated: string;
  public_id: string;
  relation_id: string | null;
  post_count: number;
  dm_count: number;
  share_count: number;
  chat_count: number;
}

export interface Post {
  id: string;
  user: string;
  service: string;
  title: string;
  content: string;
  published: string;
  file?: {
    name: string;
    path: string;
  };
  attachments: Array<{
    name: string;
    path: string;
  }>;
}

export interface ServiceOption {
  value: string;
  label: string;
  type: 'coomer' | 'kemono';
}

export const coomerServices: ServiceOption[] = [
  { value: 'onlyfans', label: 'OnlyFans', type: 'coomer' },
  { value: 'fansly', label: 'Fansly', type: 'coomer' },
  { value: 'candfans', label: 'CandFans', type: 'coomer' },
];

export const kemonoServices: ServiceOption[] = [
  { value: 'patreon', label: 'Patreon', type: 'kemono' },
  { value: 'fanbox', label: 'Fanbox', type: 'kemono' },
  { value: 'discord', label: 'Discord', type: 'kemono' },
  { value: 'fantia', label: 'Fantia', type: 'kemono' },
  { value: 'afdian', label: 'Afdian', type: 'kemono' },
  { value: 'boosty', label: 'Boosty', type: 'kemono' },
  { value: 'gumroad', label: 'Gumroad', type: 'kemono' },
  { value: 'subscribestar', label: 'SubscribeStar', type: 'kemono' },
];

export const allServices: ServiceOption[] = [
  { value: 'all', label: 'All Services', type: 'coomer' },
  ...coomerServices,
  { value: 'all-kemono', label: 'All Kemono', type: 'kemono' },
  ...kemonoServices,
];

export interface ViewMode {
  id: string;
  label: string;
  columns: number;
}

export const viewModes: ViewMode[] = [
  { id: 'comfortable', label: 'Comfortable', columns: 2 },
  { id: 'compact', label: 'Compact', columns: 3 },
  { id: 'minimal', label: 'Minimal', columns: 4 },
];
