// --- TYPES ---
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

export interface CreatorApiResponse {
  message: string;
  timestamp: number;
  data: Creator[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
    isNextPage: boolean;
    isPrevPage: boolean;
  };
}
