// frontend/src/components/tabs/TabShared.tsx
import React from 'react'

export function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="section-header">
      <h3 className="section-title">{title}</h3>
      <button className="btn-add" onClick={onAdd}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Add
      </button>
    </div>
  )
}

export function ItemCard({ children, onDelete, onEdit }: {
  children: React.ReactNode
  onDelete: () => void
  onEdit?: () => void
}) {
  return (
    <div className="item-card">
      <div className="item-card__actions">
        {onEdit && (
          <button className="item-card__action item-card__action--edit" onClick={onEdit} title="Edit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1.5l2.5 2.5-7 7H1v-2.5l7-7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button className="item-card__action item-card__action--delete" onClick={onDelete} title="Delete">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {children}
    </div>
  )
}

export function TabEmpty({ msg }: { msg: string }) {
  return <div className="tab-empty">{msg}</div>
}
