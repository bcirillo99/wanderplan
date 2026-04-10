// frontend/src/api/trips.ts
import client from './client'
import type { Trip, TripCreate, TripUpdate } from '../types'

export const getTrips = async (): Promise<Trip[]> => {
  const { data } = await client.get('/trips')
  return data
}

export const getTrip = async (id: string): Promise<Trip> => {
  const { data } = await client.get(`/trips/${id}`)
  return data
}

export const createTrip = async (trip: TripCreate): Promise<Trip> => {
  const { data } = await client.post('/trips', trip)
  return data
}

export const updateTrip = async (id: string, trip: TripUpdate): Promise<Trip> => {
  const { data } = await client.patch(`/trips/${id}`, trip)
  return data
}

export const deleteTrip = async (id: string): Promise<void> => {
  await client.delete(`/trips/${id}`)
}