// frontend/src/api/activities.ts
import client from './client'
import type { Activity, ActivityCreate, ActivityUpdate } from '../types'

export const getActivities = async (tripId: string, dayId: string): Promise<Activity[]> => {
  const { data } = await client.get(`/trips/${tripId}/days/${dayId}/activities`)
  return data
}

export const getActivity = async (tripId: string, dayId: string, activityId: string): Promise<Activity> => {
  const { data } = await client.get(`/trips/${tripId}/days/${dayId}/activities/${activityId}`)
  return data
}

export const createActivity = async (tripId: string, dayId: string, activity: ActivityCreate): Promise<Activity> => {
  const { data } = await client.post(`/trips/${tripId}/days/${dayId}/activities`, activity)
  return data
}

export const updateActivity = async (tripId: string, dayId: string, activityId: string, activity: ActivityUpdate): Promise<Activity> => {
  const { data } = await client.patch(`/trips/${tripId}/days/${dayId}/activities/${activityId}`, activity)
  return data
}

export const deleteActivity = async (tripId: string, dayId: string, activityId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/days/${dayId}/activities/${activityId}`)
}