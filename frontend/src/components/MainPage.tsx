
import { useEffect, useState } from 'react'
import type { EventItem } from '../types/event'
import type { User } from '../types/user'
import { apiUrl } from '../utils/api'

type MainPageProps = {
  user?: User
  email?: string
}

function MainPage({ user: _user, email }: MainPageProps) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(apiUrl('/api/events'))
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to load events')
      }
      const body = (await response.json()) as EventItem[]
      setEvents(Array.isArray(body) ? body : [])
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not load events.'
      setError(fallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return (
    <div className="main-card">
      <p className="badge">Event Blog App</p>
      <h1>Events{email ? ` for ${email}` : ''}</h1>

      <div className="event-card">
        <div className="event-header">
          <h2>Events</h2>
          <p className="helper">Latest events.</p>
        </div>

        {loading && <div>Loading events...</div>}
        {error && <div className="banner error">{error}</div>}

        {!loading && !error && events.length === 0 && (
          <p className="subhead">No events yet.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="event-list">
            {events.map((ev) => (
              <div key={ev.EventID} className="event-item">
                <div>
                  <p className="event-title">{ev.Title}</p>
                  <p className="subhead">
                    {ev.Location} • {ev.Status}
                  </p>
                  <p className="helper">
                    {ev.StartAt} → {ev.EndAt}
                  </p>
                </div>
                <p className="helper">
                  Owner: {ev.EventOwnerName || ev.EventOwner}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MainPage
