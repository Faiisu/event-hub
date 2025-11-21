import { useEffect, useState } from 'react'
import './App.css'
import AuthFormCard from './components/AuthForm'
import MainPage from './components/MainPage'
import CreateEvent from './components/CreateEvent'
import UserPage from './components/UserPage'
import type { User } from './types/user'

const LOCAL_STORAGE_USER_KEY = 'authUser'

type ViewKey = 'events' | 'create' | 'user'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [user, setUser] = useState<User | undefined>(undefined)
  const [activeView, setActiveView] = useState<ViewKey>('events')

  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY)
    if (!cached) return
    try {
      const parsed = JSON.parse(cached) as User
      setUser(parsed)
      setUserEmail(parsed.Email)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
    }
  }, [])

  const handleLoginSuccess = (
    loggedInUser?: User,
    context?: { email: string },
  ) => {
    setIsAuthenticated(true)
    setUser(loggedInUser)
    const email = loggedInUser?.Email ?? context?.email
    setUserEmail(email)

    if (loggedInUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedInUser))
    } else if (email) {
      localStorage.setItem(
        LOCAL_STORAGE_USER_KEY,
        JSON.stringify({ Email: email }),
      )
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserEmail(undefined)
    setUser(undefined)
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
    setActiveView('events')
  }

  if (!isAuthenticated) {
    return (
      <div className="page centered">
        <AuthFormCard onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  const viewLabel: Record<ViewKey, string> = {
    events: 'Events',
    create: 'Create Event',
    user: 'User',
  }

  return (
    <div className="page shell">
      <aside className="sidebar">
        <div className="logo">Event Blog</div>
        <nav className="nav">
          {(Object.keys(viewLabel) as ViewKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={activeView === key ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(key)}
            >
              {viewLabel[key]}
            </button>
          ))}
        </nav>
        <button type="button" className="outline full" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <div className="mobile-nav">
        <select
          value={activeView}
          onChange={(e) => setActiveView(e.target.value as ViewKey)}
        >
          {(Object.keys(viewLabel) as ViewKey[]).map((key) => (
            <option key={key} value={key}>
              {viewLabel[key]}
            </option>
          ))}
        </select>
        <button type="button" className="outline" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <main className="content">
        {activeView === 'events' && (
          <MainPage user={user} email={userEmail} />
        )}
        {activeView === 'create' && <CreateEvent user={user} />}
        {activeView === 'user' && (
          <UserPage user={user} emailFallback={userEmail} />
        )}
      </main>
    </div>
  )
}

export default App
