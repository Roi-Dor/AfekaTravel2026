export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  distance: number;
  startPoint: Coordinates;
  endPoint: Coordinates;
  waypoints: Coordinates[];
  highlights: string[];
}

export interface WeatherDay {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}

export interface TripPlan {
  id?: string;
  country: string;
  city: string;
  tripType: 'trek' | 'bike';
  duration: number;
  title: string;
  summary: string;
  totalDistance: number;
  days: DayPlan[];
  weather: WeatherDay[];
  imageUrl: string;
  createdAt?: string;
}

export interface TripRequest {
  country: string;
  city: string;
  tripType: 'trek' | 'bike';
  duration: number;
}
