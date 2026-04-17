// frontend/src/api/notes.ts
import client from './client'
import type { Note, NoteCreate, NoteUpdate } from '../types'

export const getNotes = async (tripId: string): Promise<Note[]> => {
  const { data } = await client.get(`/trips/${tripId}/notes`)
  return data
}

export const createNote = async (tripId: string, note: NoteCreate): Promise<Note> => {
  const { data } = await client.post(`/trips/${tripId}/notes`, note)
  return data
}

export const updateNote = async (tripId: string, noteId: string, note: NoteUpdate): Promise<Note> => {
  const { data } = await client.patch(`/trips/${tripId}/notes/${noteId}`, note)
  return data
}

export const deleteNote = async (tripId: string, noteId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/notes/${noteId}`)
}
