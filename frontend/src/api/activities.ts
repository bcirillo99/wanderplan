// frontend/src/api/activities.ts
import client from './client'
import type { Activity, ActivityCreate, ActivityUpdate } from '../types'

export const getActivities = async (tripId: string): Promise<Activity[]> => {
  const { data } = await client.get(`/trips/${tripId}/activities`)
  return data
}

export const getActivity = async (tripId: string, activityId: string): Promise<Activity> => {
  const { data } = await client.get(`/trips/${tripId}/activities/${activityId}`)
  return data
}

export const createActivity = async (tripId: string, activity: ActivityCreate): Promise<Activity> => {
  const { data } = await client.post(`/trips/${tripId}/activities`, activity)
  return data
}

export const updateActivity = async (tripId: string, activityId: string, activity: ActivityUpdate): Promise<Activity> => {
  const { data } = await client.patch(`/trips/${tripId}/activities/${activityId}`, activity)
  return data
}

export const deleteActivity = async (tripId: string, activityId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/activities/${activityId}`)
}