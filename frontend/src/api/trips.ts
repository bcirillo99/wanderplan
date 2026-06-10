// frontend/src/api/trips.ts
import axios from 'axios'
import client from './client'
import type { Trip, TripCreate, TripUpdate } from '../types'

export interface DeletionItem {
  id: string
  label: string
  date: string | null
}

export interface CascadeDeletionPreview {
  activities: DeletionItem[]
  flights: DeletionItem[]
  transports: DeletionItem[]
  accommodations: DeletionItem[]
}

export class CascadeDeletionRequired extends Error {
  preview: CascadeDeletionPreview
  total: number
  constructor(detail: string, preview: CascadeDeletionPreview, total: number) {
    super(detail)
    this.name = 'CascadeDeletionRequired'
    this.preview = preview
    this.total = total
  }
}

export const getTrips = async (): Promise<Trip[]> => {
  const { data } = await client.get('/trips/')
  return data
}

export const getTrip = async (id: string): Promise<Trip> => {
  const { data } = await client.get(`/trips/${id}`)
  return data
}

export const createTrip = async (trip: TripCreate): Promise<Trip> => {
  const { data } = await client.post('/trips/', trip)
  return data
}

export const updateTrip = async (
  id: string,
  trip: TripUpdate,
  confirm = false,
): Promise<Trip> => {
  try {
    const { data } = await client.patch(`/trips/${id}`, trip, {
      params: confirm ? { confirm: true } : undefined,
    })
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.deletions) {
      throw new CascadeDeletionRequired(
        err.response.data.detail ?? 'Cascade deletion required',
        err.response.data.deletions,
        err.response.data.total ?? 0,
      )
    }
    throw err
  }
}

export const deleteTrip = async (id: string): Promise<void> => {
  await client.delete(`/trips/${id}`)
}