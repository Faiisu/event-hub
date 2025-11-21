package handlers

import (
	"context"
	"strings"
	"time"

	"my-backend/internal/db"
	"my-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

type createProductRequest struct {
	StockID     string `json:"StockID"`
	ProductName string `json:"ProductName"`
	Category    string `json:"Category"`
	Unit        string `json:"Unit"`
	ProductQty  int    `json:"ProductQty"`
}

// DeleteProduct godoc
// @Summary      Delete a product
// @Description  Deletes a product by ID.
// @Tags         products
// @Produce      json
// @Param        productId  path  string  true  "Product ID (UUID)"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/products/{productId} [delete]
func DeleteProduct(c *fiber.Ctx) error {
	productIDParam := strings.TrimSpace(c.Params("productId"))
	if productIDParam == "" {
		return fiber.NewError(fiber.StatusBadRequest, "productId is required")
	}

	productUUID, err := uuid.Parse(productIDParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "productId must be a valid UUID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.ProductsCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	res, err := collection.DeleteOne(ctx, bson.M{"ProductID": productUUID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete product")
	}

	return c.JSON(fiber.Map{
		"deleted_product": res.DeletedCount,
	})
}

// ListProducts godoc
// @Summary      List products
// @Description  Returns all products.
// @Tags         products
// @Produce      json
// @Success      200  {array}   models.Products
// @Failure      500  {object}  map[string]string
// @Router       /api/products [get]
func ListProducts(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.ProductsCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch products")
	}
	defer cursor.Close(ctx)

	var products []models.Products
	if err := cursor.All(ctx, &products); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to decode products")
	}

	return c.JSON(products)
}

// CreateProduct godoc
// @Summary      Create a product
// @Description  Creates a new product record.
// @Tags         products
// @Accept       json
// @Produce      json
// @Param        payload  body      createProductRequest  true  "Product data"
// @Success      201  {object}  models.Products
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/products [put]
func CreateProduct(c *fiber.Ctx) error {
	var req createProductRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON payload")
	}

	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Category = strings.TrimSpace(req.Category)
	req.Unit = strings.TrimSpace(req.Unit)
	req.StockID = strings.TrimSpace(req.StockID)

	if req.StockID == "" || req.ProductName == "" {
		return fiber.NewError(fiber.StatusBadRequest, "StockID and ProductName are required")
	}
	if req.ProductQty == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "ProductQty must be provided")
	}

	stockUUID, err := uuid.Parse(req.StockID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "StockID must be a valid UUID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.ProductsCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	product := models.Products{
		ProductID:   uuid.New(),
		StockID:     stockUUID,
		ProductName: req.ProductName,
		Category:    req.Category,
		Unit:        req.Unit,
		ProductQty:  req.ProductQty,
	}

	if _, err := collection.InsertOne(ctx, product); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create product")
	}

	return c.Status(fiber.StatusCreated).JSON(product)
}
