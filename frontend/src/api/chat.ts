import client from './client'

export interface ProposedAction {
  entity_type: string
  data: Record<string, unknown>
}

export interface ChatResponse {
  type: 'text' | 'action'
  content?: string | null
  action?: ProposedAction | null
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export const sendChatMessage = async (
  tripId: string,
  message: string,
  history: HistoryMessage[],
): Promise<ChatResponse> => {
  const { data } = await client.post<ChatResponse>(`/trips/${tripId}/chat/`, { message, history })
  return data
}
