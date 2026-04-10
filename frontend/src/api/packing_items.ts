// frontend/src/api/packing_items.ts
import client from './client'
import type { PackingItem, PackingItemCreate, PackingItemUpdate } from '../types'

export const getPackingItems = async (tripId: string): Promise<PackingItem[]> => {
  const { data } = await client.get(`/trips/${tripId}/packing_items`)
  return data
}

export const getPackingItem = async (tripId: string, itemId: string): Promise<PackingItem> => {
  const { data } = await client.get(`/trips/${tripId}/packing_items/${itemId}`)
  return data
}

export const createPackingItem = async (tripId: string, item: PackingItemCreate): Promise<PackingItem> => {
  const { data } = await client.post(`/trips/${tripId}/packing_items`, item)
  return data
}

export const updatePackingItem = async (tripId: string, itemId: string, item: PackingItemUpdate): Promise<PackingItem> => {
  const { data } = await client.patch(`/trips/${tripId}/packing_items/${itemId}`, item)
  return data
}

export const togglePackingItem = async (tripId: string, itemId: string): Promise<PackingItem> => {
  const { data } = await client.patch(`/trips/${tripId}/packing_items/${itemId}/toggle`)
  return data
}

export const deletePackingItem = async (tripId: string, itemId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/packing_items/${itemId}`)
}