package routes

import (
	"my-backend/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	app.Get("/api", handlers.APIIndex)
	app.Get("/api/health", handlers.HealthCheck)
	app.Post("/api/register", handlers.RegisterUser)
	app.Post("/api/login", handlers.LoginUser)
	app.Get("/api/products", handlers.ListProducts)
	app.Delete("/api/products/:productId", handlers.DeleteProduct)
	app.Put("/api/products", handlers.CreateProduct)
	app.Get("/api/categories", handlers.ListCategories)
	app.Get("/api/stocks", handlers.ListStocks)
	app.Post("/api/stocks", handlers.CreateStock)
	app.Delete("/api/stocks/:stockId", handlers.DeleteStock)
	app.Post("/api/categories", handlers.CreateCategories)
}
