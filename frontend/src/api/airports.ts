// frontend/src/api/airports.ts
import client from './client'

export interface AirportResult {
  code: string
  name: string
  city: string
  country: string
}

export const searchAirports = async (q: string): Promise<AirportResult[]> => {
  if (q.length < 2) return []
  const { data } = await client.get('/airports/search', { params: { q } })
  return data
}

export const getAirport = async (code: string): Promise<AirportResult | null> => {
  const { data } = await client.get(`/airports/${code}`)
  return data
}
