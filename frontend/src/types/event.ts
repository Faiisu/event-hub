export type EventForm = {
  title: string
  location: string
  startAt: string
  endAt: string
  status: string
}

export type EventPayload = {
  Title: string
  Location: string
  StartAt: string
  EndAt: string
  Status: string
  EventOwner: string
}

export type EventItem = {
  CreatedAt?: string
  EndAt: string
  EventID: string
  EventOwner: string
  Location: string
  StartAt: string
  Status: string
  Title: string
}
