// frontend/src/types/index.ts

export type Status = 'draft' | 'to_book' | 'booked' | 'cancelled' | 'completed'

export type AccommodationType = 'hotel' | 'hostel' | 'airbnb' | 'lodge' | 'camping' | 'resort' | 'apartment' | 'other'

export type TransportType = 'train' | 'bus' | 'car' | 'shuttle' | 'ferry' | 'taxi' | 'other'

export type PackingCategory = 'documents' | 'clothing' | 'medicine' | 'technology' | 'extras'

export type ExpenseCategory = 'accommodation' | 'transport' | 'activity' | 'food' | 'shopping' | 'other'

export interface Trip {
  id: string
  title: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  destination?: string | null
  cover_image?: string | null
}

export interface Day {
  id: string
  trip_id: string
  day_date: string
  location?: string | null
  notes?: string | null
}

export interface Activity {
  id: string
  day_id: string
  title?: string | null
  description?: string | null
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  status?: Status | null
  cost?: number | null
  pay_method?: string | null
  cancellation_date?: string | null
  link?: string | null
  notes?: string | null
}

export interface Flight {
  id: string
  trip_id: string
  origin: string
  destination: string
  departure_time?: string | null
  arrival_time?: string | null
  airline?: string | null
  flight_number?: string | null
  baggage_included?: boolean | null
  cost?: number | null
  status?: Status | null
  pay_method?: string | null
  booking_reference?: string | null
  link?: string | null
  notes?: string | null
}

export interface Accommodation {
  id: string
  trip_id: string
  name: string
  accommodation_type?: AccommodationType | null
  address?: string | null
  location?: string | null
  check_in?: string | null
  check_out?: string | null
  cost_per_night?: number | null
  total_cost?: number | null
  status?: Status | null
  pay_method?: string | null
  cancellation_date?: string | null
  link?: string | null
  extra_details?: Record<string, unknown> | null
  booking_reference?: string | null
  notes?: string | null
}

export interface Transport {
  id: string
  trip_id: string
  transport_type: TransportType
  origin: string
  destination: string
  departure_time?: string | null
  arrival_time?: string | null
  status?: Status | null
  cost?: number | null
  pay_method?: string | null
  link?: string | null
  operator?: string | null
  booking_reference?: string | null
  extra_details?: Record<string, unknown> | null
  notes?: string | null
}

export interface PackingItem {
  id: string
  trip_id: string
  name: string
  category?: PackingCategory | null
  checked: boolean
  notes?: string | null
}

export interface Expense {
  id: string
  trip_id: string
  category?: ExpenseCategory | null
  description?: string | null
  amount?: number | null
  is_estimated: boolean
  actual_amount?: number | null
  currency?: string | null
  notes?: string | null
}

export interface TripStats {
  flights: number
  transport: number
  accommodation: number
  activities: number
  expenses: number
  total: number
}

// ---- Create types ----

export type TripCreate = Omit<Trip, 'id'>
export type DayCreate = Omit<Day, 'id' | 'trip_id'>
export type ActivityCreate = Omit<Activity, 'id' | 'day_id'>
export type FlightCreate = Omit<Flight, 'id' | 'trip_id'>
export type AccommodationCreate = Omit<Accommodation, 'id' | 'trip_id' | 'total_cost'>
export type TransportCreate = Omit<Transport, 'id' | 'trip_id'>
export type PackingItemCreate = Omit<PackingItem, 'id' | 'trip_id' | 'checked'>
export type ExpenseCreate = Omit<Expense, 'id' | 'trip_id'>

// ---- Update types ----

export type TripUpdate = Partial<Omit<Trip, 'id'>>
export type DayUpdate = Partial<Omit<Day, 'id' | 'trip_id'>>
export type ActivityUpdate = Partial<Omit<Activity, 'id' | 'day_id'>>
export type FlightUpdate = Partial<Omit<Flight, 'id' | 'trip_id'>>
export type AccommodationUpdate = Partial<Omit<Accommodation, 'id' | 'trip_id' | 'total_cost'>>
export type TransportUpdate = Partial<Omit<Transport, 'id' | 'trip_id'>>
export type PackingItemUpdate = Partial<Omit<PackingItem, 'id' | 'trip_id'>>
export type ExpenseUpdate = Partial<Omit<Expense, 'id' | 'trip_id'>>