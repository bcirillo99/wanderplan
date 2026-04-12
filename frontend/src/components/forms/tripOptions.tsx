import type {
  Status, AccommodationType, TransportType, ExpenseCategory, PackingCategory,
} from '../../types'

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Draft' }, { value: 'to_book', label: 'To Book' },
  { value: 'booked', label: 'Booked' }, { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]
export const ACCOM_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' }, { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb' }, { value: 'lodge', label: 'Lodge' },
  { value: 'camping', label: 'Camping' }, { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' }, { value: 'other', label: 'Other' },
]
export const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'train', label: 'Train' }, { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' }, { value: 'shuttle', label: 'Shuttle' },
  { value: 'ferry', label: 'Ferry' }, { value: 'taxi', label: 'Taxi' }, { value: 'other', label: 'Other' },
]
export const EXPENSE_CATS: { value: ExpenseCategory; label: string }[] = [
  { value: 'accommodation', label: 'Accommodation' }, { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' }, { value: 'food', label: 'Food' },
  { value: 'shopping', label: 'Shopping' }, { value: 'other', label: 'Other' },
]
export const PACKING_CATS: { value: PackingCategory; label: string }[] = [
  { value: 'documents', label: 'Documents' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'technology', label: 'Technology' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'food', label: 'Food' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'extras', label: 'Extras' },
]