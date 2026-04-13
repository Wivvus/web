export interface EventFilters {
  minPace?: number;
  maxPace?: number;
  minLength?: number;
  maxLength?: number;
  dateFrom?: string;
}

export interface Location {
  lat: number | null;
  long: number | null;
}

export class Event {
  constructor(
    public id: number = 0,
    public name: string = "",
    public description: string = "",
    public start_time: string = "",
    public distance_km: number | null = null,
    public pace_min_km: number | null = null,
    public all_paces: boolean = false,
    public location: Location = { lat: null, long: null },
    public creator_id: number = 0,
    public creator_name: string = "",
    public creator_avatar_url: string = "",
    public attendee_count: number = 0,
    public creator_rating: number | null = null,
  ) { }
}

export interface RatingInfo {
  user_name: string;
  avatar_url: string;
  score: number;
  comment?: string;
}

export interface RatingInfoWithEvent extends RatingInfo {
  event_name: string;
  event_id: number;
}
