// frontend/src/api/extras.ts
import client from './client'
import type { Extra, ExtraCreate, ExtraUpdate } from '../types'

export const getExtras = async (tripId: string): Promise<Extra[]> => {
  const { data } = await client.get(`/trips/${tripId}/extras`)
  return data
}

export const getExtra = async (tripId: string, extraId: string): Promise<Extra> => {
  const { data } = await client.get(`/trips/${tripId}/extras/${extraId}`)
  return data
}

export const createExtra = async (tripId: string, extra: ExtraCreate): Promise<Extra> => {
  const { data } = await client.post(`/trips/${tripId}/extras`, extra)
  return data
}

export const updateExtra = async (tripId: string, extraId: string, extra: ExtraUpdate): Promise<Extra> => {
  const { data } = await client.patch(`/trips/${tripId}/extras/${extraId}`, extra)
  return data
}

export const deleteExtra = async (tripId: string, extraId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/extras/${extraId}`)
}
