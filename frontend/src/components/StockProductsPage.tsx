import { useEffect, useMemo, useState } from 'react'
import type { ProductItem } from '../types/product'
import type { StockItem } from '../types/stock'
import type { User } from '../types/user'
import { apiUrl } from '../utils/api'

type StockProductsPageProps = {
  stockName: string
  user?: User
  onBack?: () => void
}

type ProductForm = {
  productName: string
  category: string
  unit: string
  productQty: number
}

function StockProductsPage({ stockName, onBack }: StockProductsPageProps) {
  const [stock, setStock] = useState<StockItem | null>(null)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>({
    productName: '',
    category: '',
    unit: '',
    productQty: 0,
  })
  const [productMessage, setProductMessage] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [submittingProduct, setSubmittingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [confirmProductId, setConfirmProductId] = useState<string | null>(null)

  const normalizedStockName = useMemo(
    () => stockName.trim().toLowerCase(),
    [stockName],
  )

  const fetchData = async () => {
    if (!normalizedStockName) {
      setError('Missing stock name in URL.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [stocksRes, productsRes] = await Promise.all([
        fetch(apiUrl('/api/stocks')),
        fetch(apiUrl('/api/products')),
      ])

      if (!stocksRes.ok) {
        const text = await stocksRes.text()
        throw new Error(text || 'Failed to load stocks')
      }

      if (!productsRes.ok) {
        const text = await productsRes.text()
        throw new Error(text || 'Failed to load products')
      }

      const stocksBody = (await stocksRes.json()) as StockItem[]
      const productsBody = (await productsRes.json()) as ProductItem[]

      const matchedStock =
        Array.isArray(stocksBody) &&
        stocksBody.find(
          (s) => s.StockName?.trim().toLowerCase() === normalizedStockName,
        )

      if (!matchedStock) {
        setStock(null)
        setProducts([])
        setError('Stock not found.')
        return
      }

      setStock(matchedStock)

      const filteredProducts = Array.isArray(productsBody)
        ? productsBody.filter((p) => p.StockID === matchedStock.StockID)
        : []

      setProducts(filteredProducts)
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Unable to load products.'
      setError(fallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedStockName])

  const handleCreateProduct = async () => {
    setProductMessage(null)
    setProductError(null)
    if (!stock) {
      setProductError('Cannot add product: stock not loaded.')
      return
    }

    const trimmedName = productForm.productName.trim()
    if (!trimmedName) {
      setProductError('Product name is required.')
      return
    }

    const payload = {
      Category: productForm.category.trim(),
      ProductName: trimmedName,
      ProductQty: Number(productForm.productQty) || 0,
      StockID: stock.StockID,
      Unit: productForm.unit.trim(),
    }

    setSubmittingProduct(true)
    try {
      const response = await fetch(apiUrl('/api/products'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to add product')
      }

      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Product added successfully.'
      setProductMessage(successMessage)
      setProductForm({
        productName: '',
        category: '',
        unit: '',
        productQty: 0,
      })
      await fetchData()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not add product.'
      setProductError(fallback)
    } finally {
      setSubmittingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    setProductMessage(null)
    setProductError(null)
    if (!productId) {
      setProductError('Missing product id.')
      return
    }

    setDeletingProductId(productId)
    try {
      const response = await fetch(
        apiUrl(`/api/products/${encodeURIComponent(productId)}`),
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to delete product')
      }

      setProductMessage('Product deleted.')
      await fetchData()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not delete product.'
      setProductError(fallback)
    } finally {
      setDeletingProductId(null)
      if (confirmProductId === productId) {
        setConfirmProductId(null)
      }
    }
  }

  const formattedTitle =
    stock?.StockName || stockName || 'Stock products overview'

  return (
    <div className="main-card">
      <h1>{formattedTitle}</h1>


      <div className="stat-grid">
        <div className="stat-card teal">
          <p className="stat-label">Products</p>
          <p className="stat-value">{products.length}</p>
        </div>        
      </div>

      <div className="main-actions">
        {onBack && (
          <button type="button" className="outline" onClick={onBack}>
            Back to stocks
          </button>
        )}
      </div>

      <div className="event-card" style={{ marginTop: 16 }}>
        <div className="event-header">
          <h2>Add product</h2>
        </div>

        <div className="event-form">
          <label className="field">
            <span>Product name</span>
            <input
              name="productName"
              type="text"
              placeholder="e.g. Medium box"
              value={productForm.productName}
              onChange={(e) =>
                setProductForm((prev) => ({
                  ...prev,
                  productName: e.target.value,
                }))
              }
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Category</span>
              <input
                name="category"
                type="text"
                placeholder="e.g. Packaging"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Unit</span>
              <input
                name="unit"
                type="text"
                placeholder="e.g. pcs"
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span>Quantity</span>
            <input
              name="productQty"
              type="number"
              min="0"
              value={productForm.productQty}
              onChange={(e) =>
                setProductForm((prev) => ({
                  ...prev,
                  productQty: Number(e.target.value),
                }))
              }
            />
          </label>

          {productMessage && (
            <div className="banner success">{productMessage}</div>
          )}
          {productError && <div className="banner error">{productError}</div>}

          <button
            type="button"
            className="submit"
            disabled={submittingProduct || !stock}
            onClick={handleCreateProduct}
          >
            {submittingProduct ? 'Saving...' : 'Add product'}
          </button>
        </div>
      </div>

      <div className="event-card" style={{ marginTop: 16 }}>
        <div className="event-header">
          <h2>Products</h2>
          <p className="helper">
            Showing products for StockID {stock?.StockID || '--'}.
          </p>
        </div>

        {loading && <div>Loading products...</div>}
        {error && <div className="banner error">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <p className="subhead">No products for this stock yet.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-list">
            {products.map((product) => (
              <div key={product.ProductID} className="product-row">
                <div className="product-meta">
                  <p className="event-title">{product.ProductName}</p>
                  <p className="helper">
                    ProductID: {product.ProductID} - Category:{' '}
                    {product.Category || '--'}
                  </p>
                </div>
                <div className="product-pill">
                  <span className="pill">
                    Qty: {product.ProductQty} {product.Unit}
                  </span>
                  {confirmProductId === product.ProductID ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="helper">Confirm?</span>
                      <button
                        type="button"
                        className="chip danger"
                        disabled={deletingProductId === product.ProductID}
                        onClick={() => handleDeleteProduct(product.ProductID)}
                      >
                        {deletingProductId === product.ProductID
                          ? 'Deleting...'
                          : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="chip subtle"
                        onClick={() => setConfirmProductId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="chip danger"
                      disabled={deletingProductId === product.ProductID}
                      onClick={() => setConfirmProductId(product.ProductID)}
                    >
                      {deletingProductId === product.ProductID
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StockProductsPage
