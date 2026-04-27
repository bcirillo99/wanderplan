// frontend/src/api/flights.ts
import client from './client'
import type { Flight, FlightCreate, FlightUpdate, FlightSearchResult } from '../types'

export const searchFlights = async (
  origin: string,
  destination: string,
  date: string,
  cabin = 'economy',
): Promise<FlightSearchResult[]> => {
  const { data } = await client.get('/flights/search', {
    params: { origin, destination, date, cabin },
  })
  return data
}

export const getFlights = async (tripId: string): Promise<Flight[]> => {
  const { data } = await client.get(`/trips/${tripId}/flights`)
  return data
}

export const getFlight = async (tripId: string, flightId: string): Promise<Flight> => {
  const { data } = await client.get(`/trips/${tripId}/flights/${flightId}`)
  return data
}

export const createFlight = async (tripId: string, flight: FlightCreate): Promise<Flight> => {
  const { data } = await client.post(`/trips/${tripId}/flights`, flight)
  return data
}

export const updateFlight = async (tripId: string, flightId: string, flight: FlightUpdate): Promise<Flight> => {
  const { data } = await client.patch(`/trips/${tripId}/flights/${flightId}`, flight)
  return data
}

export const deleteFlight = async (tripId: string, flightId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/flights/${flightId}`)
}