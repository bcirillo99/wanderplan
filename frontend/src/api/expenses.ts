// frontend/src/api/expenses.ts
import client from './client'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types'

export const getExpenses = async (tripId: string): Promise<Expense[]> => {
  const { data } = await client.get(`/trips/${tripId}/expenses`)
  return data
}

export const getExpense = async (tripId: string, expenseId: string): Promise<Expense> => {
  const { data } = await client.get(`/trips/${tripId}/expenses/${expenseId}`)
  return data
}

export const createExpense = async (tripId: string, expense: ExpenseCreate): Promise<Expense> => {
  const { data } = await client.post(`/trips/${tripId}/expenses`, expense)
  return data
}

export const updateExpense = async (tripId: string, expenseId: string, expense: ExpenseUpdate): Promise<Expense> => {
  const { data } = await client.patch(`/trips/${tripId}/expenses/${expenseId}`, expense)
  return data
}

export const deleteExpense = async (tripId: string, expenseId: string): Promise<void> => {
  await client.delete(`/trips/${tripId}/expenses/${expenseId}`)
}