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

type createStockRequest struct {
	UserID    string `json:"UserID"`
	StockName string `json:"StockName"`
}

// DeleteStock godoc
// @Summary      Delete a stock
// @Description  Deletes a stock by ID and removes related products with the same StockID.
// @Tags         warehouse
// @Produce      json
// @Param        stockId  path  string  true  "Stock ID (UUID)"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/warehouse/{stockId} [delete]
func DeleteStock(c *fiber.Ctx) error {
	stockIDParam := strings.TrimSpace(c.Params("stockId"))
	if stockIDParam == "" {
		return fiber.NewError(fiber.StatusBadRequest, "stockId is required")
	}

	stockUUID, err := uuid.Parse(stockIDParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "stockId must be a valid UUID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	warehouseCol, err := db.WarehouseCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}
	productsCol, err := db.ProductsCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	stockRes, err := warehouseCol.DeleteOne(ctx, bson.M{"StockID": stockUUID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete stock")
	}

	productRes, err := productsCol.DeleteMany(ctx, bson.M{"StockID": stockUUID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete related products")
	}

	return c.JSON(fiber.Map{
		"deleted_stock":           stockRes.DeletedCount,
		"deleted_relatedProducts": productRes.DeletedCount,
	})
}

// ListWarehouse godoc
// @Summary      List warehouse
// @Description  Returns warehouse filtered by UserID.
// @Tags         warehouse
// @Produce      json
// @Param        userId  query  string  true  "User ID (UUID)"
// @Success      200  {array}   models.Warehouse
// @Failure      500  {object}  map[string]string
// @Router       /api/warehouse [get]
func ListWarehouse(c *fiber.Ctx) error {
	userIDParam := strings.TrimSpace(c.Query("userId"))
	if userIDParam == "" {
		return fiber.NewError(fiber.StatusBadRequest, "userId is required")
	}

	userUUID, err := uuid.Parse(userIDParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "userId must be a valid UUID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.WarehouseCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	cursor, err := collection.Find(ctx, bson.M{"UserID": userUUID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch warehouse")
	}
	defer cursor.Close(ctx)

	var warehouse []models.Warehouse
	if err := cursor.All(ctx, &warehouse); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to decode warehouse")
	}

	return c.JSON(warehouse)
}

// CreateStock godoc
// @Summary      Create a stock
// @Description  Creates a new stock record.
// @Tags         warehouse
// @Accept       json
// @Produce      json
// @Param        payload  body      createStockRequest  true  "Stock data"
// @Success      201  {object}  models.Warehouse
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/warehouse [post]
func CreateStock(c *fiber.Ctx) error {
	var req createStockRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON payload")
	}

	req.StockName = strings.TrimSpace(req.StockName)
	req.UserID = strings.TrimSpace(req.UserID)

	if req.StockName == "" || req.UserID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "UserID and StockName are required")
	}

	userUUID, err := uuid.Parse(req.UserID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "UserID must be a valid UUID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.WarehouseCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	stock := models.Warehouse{
		StockID:   uuid.New(),
		UserID:    userUUID,
		StockName: req.StockName,
	}

	if _, err := collection.InsertOne(ctx, stock); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create stock")
	}

	return c.Status(fiber.StatusCreated).JSON(stock)
}
