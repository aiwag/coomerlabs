export type CarouselGender = "f" | "m" | "c" | "t" | "";

export interface Streamer {
  display_age: number | null;
  gender: string;
  location: string;
  current_show: string;
  username: string;
  tags: string[];
  is_new: boolean;
  num_users: number;
  num_followers: number;
  start_dt_utc: string;
  country: string;
  is_age_verified: boolean;
  label: string;
  img: string;
  subject: string;
  is_following?: boolean;
}

interface CarouselRoom { room: string; img: string; gender: string; subject: string; viewers: number; display_age: string | null; country: string; }
interface ListApiResponse { rooms: Streamer[]; total_count: number; limit?: number; }
interface CarouselApiResponse { rooms: CarouselRoom[]; }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/ts/';
const CHROME_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };

const normalizeRoomToStreamer = (room: CarouselRoom): Streamer => ({ username: room.room, img: room.img, gender: room.gender, subject: room.subject, num_users: room.viewers, display_age: room.display_age ? parseInt(room.display_age, 10) : null, country: room.country, tags: [], num_followers: 0, is_new: false, is_age_verified: false, location: "", current_show: "public", label: "public", start_dt_utc: new Date().toISOString() });

async function robustFetch(url: string, signal: AbortSignal): Promise<any> {
  const response = await fetch(url, { headers: CHROME_HEADERS, signal });
  if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
  return response.json();
}

// --- Helper for TRUE paginated endpoints ---
const getPaginatedList = async (endpoint: string, page: number, limit: number, signal: AbortSignal, params = ''): Promise<ListApiResponse> => {
  const offset = (page - 1) * limit;
  const url = `${API_BASE_URL}${endpoint}?limit=${limit}&offset=${offset}&require_fingerprint=false${params}`;
  const data = await robustFetch(url, signal);
  return { ...data, limit };
};

// --- Helper for NON-paginated carousel endpoints ---
const getCarouselList = async (endpoint: string, signal: AbortSignal, params = ''): Promise<ListApiResponse> => {
  const url = `${API_BASE_URL}${endpoint}${params}`;
  const response: CarouselApiResponse = await robustFetch(url, signal);
  return {
    rooms: response.rooms.map(normalizeRoomToStreamer),
    total_count: response.rooms.length,
    limit: response.rooms.length, // The limit is the total number of items
  };
};

// --- EXPORTED API FUNCTIONS ---
export const getMostViewedRooms = (page: number, limit: number, signal: AbortSignal, gender: CarouselGender = "") => getPaginatedList('roomlist/room-list/', page, limit, signal, gender ? `&genders=${gender}` : '');
export const searchRooms = (keywords: string, page: number, limit: number, signal: AbortSignal, gender: CarouselGender = "") => getPaginatedList('roomlist/room-list/', page, limit, signal, `&keywords=${encodeURIComponent(keywords)}${gender ? `&genders=${gender}` : ''}`);

// These are now correctly treated as single-fetch lists
export const getTopRatedRooms = (signal: AbortSignal, gender: CarouselGender = "") => getCarouselList(`discover/carousels/top-rated/`, signal, gender ? `?genders=${gender}` : '');
export const getTrendingRooms = (signal: AbortSignal, gender: CarouselGender = "") => getCarouselList(`discover/carousels/trending/`, signal, gender ? `?genders=${gender}` : '');