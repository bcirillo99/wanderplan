// frontend/src/api/accommodations.ts
import client from './client'
import type { Accommodation, AccommodationCreate, AccommodationUpdate } from '../types'

export const getAccommodations = async (tripId: string): Promise<Accommodation[]> => {
  const { data } = await client.get(`/trips/${tripId}/accommodations`)
  return data
}

export const getAccommodation = async (tripId: string, accommodationId: string): Promise<Accommodation> => {
  const { data } = await client.get(`/trips/${tripId}/accommodations/${accommodationId}`)
  return data
}

export const createAccommodation = async (tripId: string, accommodation: AccommodationCreate): Promise<Accommodation> => {
  const { data } = await client.post(`/trips/${tripId}/accommodations`, accommodation)
  return data
}

export const updateAccommodation = async (tripId: string, accommodationId: string, accommodation: AccommodationUpdate): Promise<Accommodation> => {
  const { data } = await client.patch(`/trips/${tripId}/accommodations/${accommodationId}`, accommodation)
  return data
}

export const deleteAccommodation = async (tripId: string, accommodationId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/accommodations/${accommodationId}`)
}