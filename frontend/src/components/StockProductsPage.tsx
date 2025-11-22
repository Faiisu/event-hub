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

type CategoryItem = {
  CategoryID?: string
  CategoryName: string
  Discription?: string
  StockID: string
}

type CategoryDraft = {
  name: string
  description: string
}

function StockProductsPage({ stockName, onBack }: StockProductsPageProps) {
  const [stock, setStock] = useState<StockItem | null>(null)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
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
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>([
    { name: '', description: '' },
  ])
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [submittingCategories, setSubmittingCategories] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  )

  const normalizedStockName = useMemo(
    () => stockName.trim().toLowerCase(),
    [stockName],
  )

  const getCachedStocks = () => {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem('stocks-cache')
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const fetchData = async () => {
    if (!normalizedStockName) {
      setError('Missing stock name in URL.')
      return
    }

    const cachedStocks = getCachedStocks() as StockItem[]
    const matchedStock =
      Array.isArray(cachedStocks) &&
      cachedStocks.find(
        (s) => s.StockName?.trim().toLowerCase() === normalizedStockName,
      )

    if (!matchedStock) {
      setStock(null)
      setProducts([])
      setCategories([])
      setError('Stock not found locally. Reopen from Stocks page to refresh.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      setStock(matchedStock)

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(
          apiUrl(
            `/api/products?stockId=${encodeURIComponent(matchedStock.StockID)}`,
          ),
        ),
        fetch(
          apiUrl(
            `/api/categories?stockId=${encodeURIComponent(
              matchedStock.StockID,
            )}`,
          ),
        ),
      ])

      if (!productsRes.ok) {
        const text = await productsRes.text()
        throw new Error(text || 'Failed to load products')
      }

      if (!categoriesRes.ok) {
        const text = await categoriesRes.text()
        throw new Error(text || 'Failed to load categories')
      }

      const productsBody = (await productsRes.json()) as ProductItem[]
      const categoriesBody = (await categoriesRes.json()) as CategoryItem[]

      const filteredProducts = Array.isArray(productsBody)
        ? productsBody.filter((p) => p.StockID === matchedStock.StockID)
        : []

      setProducts(filteredProducts)
      const filteredCategories = Array.isArray(categoriesBody)
        ? categoriesBody.filter((c) => c.StockID === matchedStock.StockID)
        : []
      setCategories(filteredCategories)
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

  useEffect(() => {
    if (!productForm.category && categories.length > 0) {
      setProductForm((prev) => ({
        ...prev,
        category: categories[0]?.CategoryName || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

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

    if (!productForm.category) {
      setProductError('Select a category.')
      return
    }

    const payload = {
      Category: productForm.category,
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

  const handleCategoryChange = (
    index: number,
    field: keyof CategoryDraft,
    value: string,
  ) => {
    setCategoryDrafts((prev) =>
      prev.map((draft, i) =>
        i === index ? { ...draft, [field]: value } : draft,
      ),
    )
  }

  const handleAddCategoryRow = () => {
    setCategoryDrafts((prev) => [...prev, { name: '', description: '' }])
  }

  const handleRemoveCategoryRow = (index: number) => {
    setCategoryDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateCategories = async () => {
    setCategoryMessage(null)
    setCategoryError(null)
    if (!stock) {
      setCategoryError('Cannot add categories: stock not loaded.')
      return
    }

    const payload = categoryDrafts
      .map((draft) => ({
        CategoryName: draft.name.trim(),
        Discription: draft.description.trim(),
        StockID: stock.StockID,
      }))
      .filter((item) => item.CategoryName)
  
    if (payload.length === 0) {
      setCategoryError('Add at least one category name.')
      return
    }

    console.log(JSON.stringify(payload))
    setSubmittingCategories(true)
    try {
      const response = await fetch(apiUrl('/api/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to add categories')
      }

      const body = await response.json().catch(() => null)
      const successMessage =
        (body && (body.message || body.Message)) ||
        'Categories added successfully.'
      setCategoryMessage(successMessage)
      setCategoryDrafts([{ name: '', description: '' }])
      setShowCategoriesModal(false)
      await fetchData()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not add categories.'
      setCategoryError(fallback)
    } finally {
      setSubmittingCategories(false)
    }
  }

  const handleDeleteCategory = async (category: CategoryItem) => {
    setCategoryMessage(null)
    setCategoryError(null)
    if (!stock) {
      setCategoryError('Cannot delete category: stock not loaded.')
      return
    }

    const categoryId = category.CategoryID || category.CategoryName
    if (!categoryId) {
      setCategoryError('Missing category id.')
      return
    }

    setDeletingCategoryId(categoryId)
    try {
      const response = await fetch(
        apiUrl(`/api/categories/${encodeURIComponent(categoryId)}`),
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to delete category')
      }

      setCategoryMessage('Category deleted.')
      await fetchData()
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Could not delete category.'
      setCategoryError(fallback)
    } finally {
      setDeletingCategoryId(null)
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
        <div className="stat-card teal">
          <p className="stat-label">Categories</p>
          <p className="stat-value">{categories.length}</p>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  name="category"
                  className="select"
                  style={{ flex: 1 }}
                  value={productForm.category}
                  disabled={categories.length === 0}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={`${category.StockID}-${category.CategoryName}`}
                      value={category.CategoryName}
                    >
                      {category.CategoryName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setCategoryMessage(null)
                    setCategoryError(null)
                    setShowCategoriesModal(true)
                  }}
                >
                  Manage
                </button>
              </div>
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
          {categories.length === 0 ? (
            <p className="helper">
              No categories yet. Use “Manage” to add and enable product creation.
            </p>
          ) : (
            <p className="helper">
              Need another category? Open “Manage” to add or remove.
            </p>
          )}
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
            disabled={submittingProduct || !stock || categories.length === 0}
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
            Showing products for {stockName}.
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
                    Category:{' '}
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

      {showCategoriesModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="event-card"
            style={{
              width: 'min(900px, 100%)',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 20,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              className="chip subtle"
              onClick={() => setShowCategoriesModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
              }}
            >
              x
            </button>

            <div className="event-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2>Manage categories</h2>
                <p className="helper">
                  Review, delete, or add categories for this stock.
                </p>
              </div>
            </div>

            <div className="event-form" style={{ gap: 16 }}>
              <div>
                <p className="helper" style={{ marginBottom: 8 }}>
                  Existing categories
                </p>
                {categories.length === 0 ? (
                  <p className="subhead">No categories yet.</p>
                ) : (
                  <div className="product-list">
                    {categories.map((category) => (
                      <div
                        key={category.CategoryID || category.CategoryName}
                        className="product-row"
                      >
                        <div className="product-meta">
                          <p className="event-title">{category.CategoryName}</p>
                          <p className="helper">
                            {category.Discription || 'No description'}
                          </p>
                        </div>
                        <div className="product-pill">
                          <button
                            type="button"
                            className="chip danger"
                            disabled={
                              deletingCategoryId ===
                              (category.CategoryID || category.CategoryName)
                            }
                            onClick={() =>
                              handleDeleteCategory(category)
                            }
                          >
                            {deletingCategoryId ===
                            (category.CategoryID || category.CategoryName)
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="helper" style={{ marginBottom: 8 }}>
                  Add categories
                </p>
                <div className="event-form" style={{ gap: 12 }}>
                  {categoryDrafts.map((draft, index) => (
                    <div key={`category-${index}`} className="field-row">
                      <label className="field" style={{ flex: 1 }}>
                        <span>Category name</span>
                        <input
                          type="text"
                          placeholder="e.g. Packaging"
                          value={draft.name}
                          onChange={(e) =>
                            handleCategoryChange(index, 'name', e.target.value)
                          }
                        />
                      </label>
                      <label className="field" style={{ flex: 1 }}>
                        <span>Description (optional)</span>
                        <input
                          type="text"
                          placeholder="Short description"
                          value={draft.description}
                          onChange={(e) =>
                            handleCategoryChange(
                              index,
                              'description',
                              e.target.value,
                            )
                          }
                        />
                      </label>
                      {categoryDrafts.length > 1 && (
                        <button
                          type="button"
                          className="chip subtle"
                          onClick={() => handleRemoveCategoryRow(index)}
                          style={{ alignSelf: 'flex-end', marginBottom: 4 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="chip"
                      onClick={handleAddCategoryRow}
                      disabled={submittingCategories}
                    >
                      + Add another
                    </button>
                    <button
                      type="button"
                      className="submit"
                      onClick={handleCreateCategories}
                      disabled={submittingCategories}
                    >
                      {submittingCategories ? 'Saving...' : 'Save categories'}
                    </button>
                  </div>
                </div>
              </div>

              {categoryMessage && (
                <div className="banner success">{categoryMessage}</div>
              )}
              {categoryError && (
                <div className="banner error">{categoryError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockProductsPage
