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
  const [warehouse, setWarehouse] = useState<StockItem[]>([])
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

  const fetchWarehouse = async () => {
    if (!userId) {
      setError('Missing user id to load warehouse.')
      setWarehouse([])
      if (typeof window !== 'undefined') {
        localStorage.removeItem('warehouse-cache')
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        apiUrl(`/api/warehouse?userId=${encodeURIComponent(userId)}`),
      )
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to load warehouse')
      }
      const body = (await response.json()) as StockItem[]
      setWarehouse(Array.isArray(body) ? body : [])
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('warehouse-cache', JSON.stringify(body ?? []))
        } catch {
          // ignore cache write failures
        }
      }
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not load warehouse.'
      setError(fallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouse()
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
      setSubmitError('Warehouse name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        StockName: stockName,
        UserID: userId,
      }

      const response = await fetch(apiUrl('/api/warehouse'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create warehouse')
      }

      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Warehouse created successfully.'
      setSubmitMessage(successMessage)
      setStockForm(emptyStockForm)
      await fetchWarehouse()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not create warehouse.'
      setSubmitError(fallback)
    } finally {
      setSubmitting(false)
    }
  }

  const visibleWarehouse =
    userId && warehouse.length > 0
      ? warehouse.filter((stock) => stock.UserID === userId)
      : warehouse

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
      setModalError('Name did not match. Please type the exact warehouse name.')
      return
    }

    setSubmitMessage(null)
    setSubmitError(null)
    setModalError(null)
    try {
      const response = await fetch(
        apiUrl(`/api/warehouse/${encodeURIComponent(modalStock.StockID)}`),
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete warehouse')
      }

      setSubmitMessage('Warehouse deleted.')
      setModalOpen(false)
      await fetchWarehouse()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not delete warehouse.'
      setSubmitError(fallback)
    }
  }

  const handleRenameStock = async () => {
    if (!modalStock) return
    const trimmed = modalValue.trim()
    if (!trimmed) {
      setModalError('Warehouse name is required.')
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
        apiUrl(`/api/warehouse/${encodeURIComponent(modalStock.StockID)}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update warehouse')
      }

      setSubmitMessage('Warehouse updated.')
      setModalOpen(false)
      await fetchWarehouse()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not update warehouse.'
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
      <h1>Manage warehouse</h1>

      <div className="stat-grid">
        <div className="stat-card blue">
          <p className="stat-label">My warehouse list</p>
          <p className="stat-value">{visibleWarehouse.length}</p>
        </div>
        
        <div className="event-card">
          <div className="event-header">
            <h2>Create warehouse</h2>
          </div>

          <form className="event-form" onSubmit={handleCreateStock}>
            <label className="field">
              <span>Warehouse name</span>
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
              {submitting ? 'Creating...' : 'Create warehouse'}
            </button>
          </form>
        </div>
      </div>


      <div className="event-card" style={{ marginTop: 16 }}>
        <div className="event-header">
          <h2>Your warehouse</h2>
        </div>

        {loading && <div>Loading warehouse...</div>}
        {error && <div className="banner error">{error}</div>}

        {!loading && !error && visibleWarehouse.length === 0 && (
          <p className="subhead">No warehouse yet.</p>
        )}

        {!loading && !error && visibleWarehouse.length > 0 && (
          <div className="event-list">
            {visibleWarehouse.map((stock) => (
              <div
                key={stock.StockID}
                className="event-item stock-button"
                role="button"
                tabIndex={0}
              >
                <div className="stock-info">
                  <p className="event-title">{stock.StockName}</p>
                  <p className="helper">Warehouse ID: {stock.StockID}</p>
                </div>
                <div className="stock-actions">
                  <button
                    type="button"
                    className="chip subtle"
                    onClick={() =>
                      window.location.assign(
                        `/warehouse/${encodeURIComponent(stock.StockName)}`,
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
                  ? 'Delete warehouse'
                  : 'Edit warehouse name'}
              </h2>
              <p className="helper">
                {modalMode === 'delete'
                  ? 'Type the exact warehouse name to confirm deletion.'
                  : 'Update the warehouse name and save.'}
              </p>
            </div>

            <label className="field">
              <span>
                {modalMode === 'delete'
                  ? `Warehouse name: ${modalStock?.StockName || ''}`
                  : 'New warehouse name'}
              </span>
              <input
                type="text"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder={
                  modalMode === 'delete'
                    ? 'Type the warehouse name to delete'
                    : 'Enter a new warehouse name'
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
