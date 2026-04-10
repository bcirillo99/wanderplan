// frontend/src/api/transports.ts
import client from './client'
import type { Transport, TransportCreate, TransportUpdate } from '../types'

export const getTransports = async (tripId: string): Promise<Transport[]> => {
  const { data } = await client.get(`/trips/${tripId}/transports`)
  return data
}

export const getTransport = async (tripId: string, transportId: string): Promise<Transport> => {
  const { data } = await client.get(`/trips/${tripId}/transports/${transportId}`)
  return data
}

export const createTransport = async (tripId: string, transport: TransportCreate): Promise<Transport> => {
  const { data } = await client.post(`/trips/${tripId}/transports`, transport)
  return data
}

export const updateTransport = async (tripId: string, transportId: string, transport: TransportUpdate): Promise<Transport> => {
  const { data } = await client.patch(`/trips/${tripId}/transports/${transportId}`, transport)
  return data
}

export const deleteTransport = async (tripId: string, transportId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/transports/${transportId}`)
}