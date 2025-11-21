import type { User } from '../types/user'

type UserPageProps = {
  user?: User
  emailFallback?: string
}

const formatValue = (value?: string) => value || '—'

function UserPage({ user, emailFallback }: UserPageProps) {
  const userId = user?.UserId ?? user?.UserID
  return (
    <div className="main-card">
      <p className="badge">User</p>
      <h1>User details</h1>
      <p className="subhead">
        Pulled from the login response; shows your profile basics.
      </p>

      <div className="event-card">
        <div className="event-header">
          <h2>Profile</h2>
          <p className="helper">Fields from the backend user object.</p>
        </div>
        <div className="user-grid">
          <div className="user-field">
            <span className="helper">UserId</span>
            <p>{formatValue(userId)}</p>
          </div>
          <div className="user-field">
            <span className="helper">Email</span>
            <p>{formatValue(user?.Email ?? emailFallback)}</p>
          </div>
          <div className="user-field">
            <span className="helper">Display name</span>
            <p>{formatValue(user?.DisplayName)}</p>
          </div>
          <div className="user-field">
            <span className="helper">Status</span>
            <p>{formatValue(user?.Status)}</p>
          </div>
          <div className="user-field">
            <span className="helper">Avatar URL</span>
            <p>{formatValue(user?.AvatarURL)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPage
