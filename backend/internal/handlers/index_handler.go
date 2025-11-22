package handlers

import "github.com/gofiber/fiber/v2"

// APIIndex lists available HTTP endpoints for quick discovery.
// @Summary      API index
// @Description  Lists available API endpoints and brief descriptions.
// @Tags         meta
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /api [get]
func APIIndex(c *fiber.Ctx) error {
	endpoints := []fiber.Map{
		{
			"method":      "GET",
			"path":        "/api/health",
			"description": "Health check endpoint",
		},
		{
			"method":      "POST",
			"path":        "/api/register",
			"description": "Register a new user",
		},
		{
			"method":      "POST",
			"path":        "/api/login",
			"description": "Login user with email and password",
		},
		{
			"method":      "POST",
			"path":        "/api/events",
			"description": "Create a new event",
		},
		{
			"method":      "GET",
			"path":        "/api/events",
			"description": "List events",
		},
		{
			"method":      "GET",
			"path":        "/api/products",
			"description": "List products",
		},
		{
			"method":      "DELETE",
			"path":        "/api/products/:productId",
			"description": "Delete a product",
		},
		{
			"method":      "PUT",
			"path":        "/api/products",
			"description": "Create a new product",
		},
		{
			"method":      "GET",
			"path":        "/api/categories",
			"description": "List categories for a stock",
		},
		{
			"method":      "GET",
			"path":        "/api/stocks",
			"description": "List stocks",
		},
		{
			"method":      "POST",
			"path":        "/api/stocks",
			"description": "Create a stock",
		},
		{
			"method":      "DELETE",
			"path":        "/api/stocks/:stockId",
			"description": "Delete a stock and related products",
		},
		{
			"method":      "POST",
			"path":        "/api/categories",
			"description": "Create categories in bulk",
		},
	}

	return c.JSON(fiber.Map{
		"name":      "Event Blog API",
		"endpoints": endpoints,
	})
}
