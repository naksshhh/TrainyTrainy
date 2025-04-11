export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface Train {
  id: number;
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
}

export interface Booking {
  id: number;
  pnr_number: string;
  user_id: number;
  train_id: number;
  journey_date: Date;
  class: string;
  status: 'Confirmed' | 'Waitlist' | 'RAC' | 'Cancelled';
  total_fare: number;
  created_at: Date;
}

export interface Passenger {
  id: number;
  booking_id: number;
  name: string;
  age: number;
  gender: string;
  seat_number: string;
  status: string;
}

export interface Station {
  id: number;
  name: string;
  code: string;
}

export interface Route {
  id: number;
  train_id: number;
  station_id: number;
  arrival_time: string;
  departure_time: string;
  distance: number;
  sequence: number;
}

export interface SeatAvailability {
  train_id: number;
  journey_date: Date;
  class: string;
  available_seats: number;
} 