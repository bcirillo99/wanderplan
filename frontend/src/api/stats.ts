// frontend/src/api/stats.ts
import client from './client'
import type { TripStats } from '../types'

export const getTripStats = async (tripId: string): Promise<TripStats> => {
  const { data } = await client.get(`/trips/${tripId}/stats`)
  return data
}

export const getDayStats = async (tripId: string, dayId: string): Promise<TripStats> => {
  const { data } = await client.get(`/trips/${tripId}/days/${dayId}/stats`)
  return data
}