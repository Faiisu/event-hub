import type { User } from '../types/user'

type AdminDashboardProps = {
  user?: User
  email?: string
  onLogout?: () => void
}

function AdminDashboard({ user, email, onLogout }: AdminDashboardProps) {
  return (
    <div className="main-card">
      <p className="badge">Admin</p>
      <h1>Admin dashboard</h1>
      <p className="subhead">
        {email
          ? `Signed in as ${email}`
          : 'Signed in. Manage application data and settings.'}
      </p>

      <div className="event-card">
        <div className="event-header">
          <h2>Overview</h2>
          <p className="helper">
            Stub admin panel. Wire up metrics and management tools here.
          </p>
        </div>
        <ul className="helper">
          <li>User: {user?.UserId ?? user?.UserID ?? '—'}</li>
          <li>Email: {user?.Email ?? email ?? '—'}</li>
          <li>Status: {user?.Status ?? '—'}</li>
        </ul>
      </div>

      <div className="main-actions">
        <button type="button" className="outline" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}

export default AdminDashboard
