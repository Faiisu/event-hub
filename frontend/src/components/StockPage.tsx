import { type FormEvent, useEffect, useState } from 'react'
import type { StockForm, StockItem } from '../types/stock'
import type { User } from '../types/user'
import { apiUrl } from '../utils/api'

type StockPageProps = {
  user?: User
}

const emptyStockForm: StockForm = {
  stockName: '',
}

function StockPage({ user }: StockPageProps) {
  const [stockForm, setStockForm] = useState<StockForm>(emptyStockForm)
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'edit' | 'delete' | null>(null)
  const [modalStock, setModalStock] = useState<StockItem | null>(null)
  const [modalValue, setModalValue] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)

  const userId = user?.UserId ?? user?.UserID ?? ''

  const fetchStocks = async () => {
    if (!userId) {
      setError('Missing user id to load stocks.')
      setStocks([])
      if (typeof window !== 'undefined') {
        localStorage.removeItem('stocks-cache')
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        apiUrl(`/api/stocks?userId=${encodeURIComponent(userId)}`),
      )
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to load stocks')
      }
      const body = (await response.json()) as StockItem[]
      setStocks(Array.isArray(body) ? body : [])
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('stocks-cache', JSON.stringify(body ?? []))
        } catch {
          // ignore cache write failures
        }
      }
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not load stocks.'
      setError(fallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()
  }, [userId])

  const handleCreateStock = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitMessage(null)
    setSubmitError(null)

    if (!userId) {
      setSubmitError('Missing user id from login response.')
      return
    }

    const stockName = stockForm.stockName.trim()
    if (!stockName) {
      setSubmitError('Stock name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        StockName: stockName,
        UserID: userId,
      }

      const response = await fetch(apiUrl('/api/stocks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create stock')
      }

      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Stock created successfully.'
      setSubmitMessage(successMessage)
      setStockForm(emptyStockForm)
      await fetchStocks()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not create stock.'
      setSubmitError(fallback)
    } finally {
      setSubmitting(false)
    }
  }

  const visibleStocks =
    userId && stocks.length > 0
      ? stocks.filter((stock) => stock.UserID === userId)
      : stocks

  const openDeleteModal = (stock: StockItem) => {
    setModalOpen(true)
    setModalMode('delete')
    setModalStock(stock)
    setModalValue('')
    setModalError(null)
  }

  const openEditModal = (stock: StockItem) => {
    setModalOpen(true)
    setModalMode('edit')
    setModalStock(stock)
    setModalValue(stock.StockName || '')
    setModalError(null)
  }

  const handleDeleteStock = async () => {
    if (!modalStock) return
    const trimmed = modalValue.trim()
    if (trimmed !== (modalStock.StockName || '').trim()) {
      setModalError('Name did not match. Please type the exact stock name.')
      return
    }

    setSubmitMessage(null)
    setSubmitError(null)
    setModalError(null)
    try {
      const response = await fetch(
        apiUrl(`/api/stocks/${encodeURIComponent(modalStock.StockID)}`),
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete stock')
      }

      setSubmitMessage('Stock deleted.')
      setModalOpen(false)
      await fetchStocks()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not delete stock.'
      setSubmitError(fallback)
    }
  }

  const handleRenameStock = async () => {
    if (!modalStock) return
    const trimmed = modalValue.trim()
    if (!trimmed) {
      setModalError('Stock name is required.')
      return
    }

    setSubmitMessage(null)
    setSubmitError(null)
    setModalError(null)
    try {
      const payload = {
        StockName: trimmed,
        UserID: modalStock.UserID || userId,
      }
      const response = await fetch(
        apiUrl(`/api/stocks/${encodeURIComponent(modalStock.StockID)}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update stock')
      }

      setSubmitMessage('Stock updated.')
      setModalOpen(false)
      await fetchStocks()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not update stock.'
      setSubmitError(fallback)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalStock(null)
    setModalMode(null)
    setModalValue('')
    setModalError(null)
  }

  return (
    <div className="main-card">
      <h1>Manage stocks</h1>

      <div className="stat-grid">
        <div className="stat-card blue">
          <p className="stat-label">My stocks</p>
          <p className="stat-value">{visibleStocks.length}</p>
        </div>
        
        <div className="event-card">
          <div className="event-header">
            <h2>Create stock</h2>
          </div>

          <form className="event-form" onSubmit={handleCreateStock}>
            <label className="field">
              <span>Stock name</span>
              <input
                name="stockName"
                type="text"
                placeholder="e.g. ACME"
                value={stockForm.stockName}
                onChange={(e) =>
                  setStockForm((prev) => ({ ...prev, stockName: e.target.value }))
                }
              />
            </label>

            {submitMessage && (
              <div className="banner success">{submitMessage}</div>
            )}
            {submitError && <div className="banner error">{submitError}</div>}

            <button type="submit" className="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create stock'}
            </button>
          </form>
        </div>
      </div>


      <div className="event-card" style={{ marginTop: 16 }}>
        <div className="event-header">
          <h2>Your stocks</h2>
        </div>

        {loading && <div>Loading stocks...</div>}
        {error && <div className="banner error">{error}</div>}

        {!loading && !error && visibleStocks.length === 0 && (
          <p className="subhead">No stocks yet.</p>
        )}

        {!loading && !error && visibleStocks.length > 0 && (
          <div className="event-list">
            {visibleStocks.map((stock) => (
              <div
                key={stock.StockID}
                className="event-item stock-button"
                role="button"
                tabIndex={0}
              >
                <div className="stock-info">
                  <p className="event-title">{stock.StockName}</p>
                  <p className="helper">Stock ID: {stock.StockID}</p>
                </div>
                <div className="stock-actions">
                  <button
                    type="button"
                    className="chip subtle"
                    onClick={() =>
                      window.location.assign(
                        `/stocks/${encodeURIComponent(stock.StockName)}`,
                      )
                    }
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="chip subtle"
                    onClick={() => openEditModal(stock)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="chip danger"
                    onClick={() => openDeleteModal(stock)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && modalMode && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="event-header" style={{ marginBottom: 12 }}>
              <h2>
                {modalMode === 'delete'
                  ? 'Delete stock'
                  : 'Edit stock name'}
              </h2>
              <p className="helper">
                {modalMode === 'delete'
                  ? 'Type the exact stock name to confirm deletion.'
                  : 'Update the stock name and save.'}
              </p>
            </div>

            <label className="field">
              <span>
                {modalMode === 'delete'
                  ? `Stock name: ${modalStock?.StockName || ''}`
                  : 'New stock name'}
              </span>
              <input
                type="text"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder={
                  modalMode === 'delete'
                    ? 'Type the stock name to delete'
                    : 'Enter a new stock name'
                }
              />
            </label>

            {modalError && <div className="banner error">{modalError}</div>}

            <div className="modal-actions">
              <button type="button" className="outline" onClick={closeModal}>
                Cancel
              </button>
              {modalMode === 'delete' ? (
                <button
                  type="button"
                  className="submit danger"
                  onClick={handleDeleteStock}
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  className="submit"
                  onClick={handleRenameStock}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockPage
