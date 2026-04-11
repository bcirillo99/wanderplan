// frontend/src/api/daily_summary.ts
import client from './client'
import type { DailySummaryItem } from '../types'
 
export const getDailySummary = async (tripId: string, date: string): Promise<DailySummaryItem[]> => {
  const { data } = await client.get(`/trips/${tripId}/days/${date}/summary`)
  return data
}
 