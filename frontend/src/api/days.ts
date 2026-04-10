// frontend/src/api/days.ts
import client from './client'
import type { Day, DayCreate, DayUpdate } from '../types'

export const getDays = async (tripId: string): Promise<Day[]> => {
  const { data } = await client.get(`/trips/${tripId}/days`)
  return data
}

export const getDay = async (tripId: string, dayId: string): Promise<Day> => {
  const { data } = await client.get(`/trips/${tripId}/days/${dayId}`)
  return data
}

export const createDay = async (tripId: string, day: DayCreate): Promise<Day> => {
  const { data } = await client.post(`/trips/${tripId}/days`, day)
  return data
}

export const updateDay = async (tripId: string, dayId: string, day: DayUpdate): Promise<Day> => {
  const { data } = await client.patch(`/trips/${tripId}/days/${dayId}`, day)
  return data
}

export const deleteDay = async (tripId: string, dayId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/days/${dayId}`)
}