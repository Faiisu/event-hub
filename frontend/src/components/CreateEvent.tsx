import { type FormEvent, useState } from 'react'
import type { EventForm } from '../types/event'
import type { User } from '../types/user'
import { apiUrl } from '../utils/api'

type CreateEventProps = {
  user?: User
  onCreated?: () => void
}

const emptyEventForm: EventForm = {
  title: '',
  location: '',
  startAt: '',
  endAt: '',
  status: 'ACTIVE',
}

function CreateEvent({ user, onCreated }: CreateEventProps) {
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm)
  const [eventMessage, setEventMessage] = useState<string | null>(null)
  const [eventError, setEventError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const eventOwner = user?.UserId ?? user?.UserID ?? ''

  const handleEventChange = (field: keyof EventForm) => (value: string) => {
    setEventForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateEvent = () => {
    if (!eventOwner) return 'Missing user id from login response.'
    if (!eventForm.title.trim()) return 'Title is required'
    if (!eventForm.location.trim()) return 'Location is required'
    if (!eventForm.startAt.trim()) return 'Start time is required'
    if (!eventForm.endAt.trim()) return 'End time is required'
    if (!eventForm.status.trim()) return 'Status is required'
    return null
  }

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault()
    setEventMessage(null)
    setEventError(null)

    const toIsoString = (value: string) => {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    }

    const error = validateEvent()
    if (error) {
      setEventError(error)
      return
    }

    const isoStart = toIsoString(eventForm.startAt)
    const isoEnd = toIsoString(eventForm.endAt)
    if (!isoStart || !isoEnd) {
      setEventError('StartAt and EndAt must be valid dates (RFC3339).')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        Title: eventForm.title.trim(),
        Location: eventForm.location.trim(),
        StartAt: isoStart,
        EndAt: isoEnd,
        Status: eventForm.status.trim(),
        EventOwner: eventOwner,
      }

      const response = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create event')
      }

      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Event created successfully.'
      setEventMessage(successMessage)
      setEventForm(emptyEventForm)
      onCreated?.()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not create event.'
      setEventError(fallback)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="event-card">
      <div className="event-header">
        <h2>Create Event</h2>
        <p className="helper">
          Provide event details; EventOwner uses your UserId from login.
        </p>
      </div>

      <form className="event-form" onSubmit={handleCreateEvent}>
        <label className="field">
          <span>Title</span>
          <input
            name="title"
            type="text"
            placeholder="Event title"
            value={eventForm.title}
            onChange={(e) => handleEventChange('title')(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Location</span>
          <input
            name="location"
            type="text"
            placeholder="Location"
            value={eventForm.location}
            onChange={(e) => handleEventChange('location')(e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Start time</span>
            <input
              name="startAt"
              type="datetime-local"
              value={eventForm.startAt}
              onChange={(e) => handleEventChange('startAt')(e.target.value)}
            />
          </label>
          <label className="field">
            <span>End time</span>
            <input
              name="endAt"
              type="datetime-local"
              value={eventForm.endAt}
              onChange={(e) => handleEventChange('endAt')(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Status</span>
          <input
            name="status"
            type="text"
            placeholder='e.g. "ACTIVE"'
            value={eventForm.status}
            onChange={(e) => handleEventChange('status')(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Event owner (from login)</span>
          <input name="eventOwner" type="text" value={eventOwner} readOnly />
        </label>

        {eventMessage && <div className="banner success">{eventMessage}</div>}
        {eventError && <div className="banner error">{eventError}</div>}

        <button type="submit" className="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </div>
  )
}

export default CreateEvent
