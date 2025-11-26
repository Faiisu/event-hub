package routes

import (
	"my-backend/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	app.Get("/api/health", handlers.HealthCheck)

	//Auth
	app.Post("/api/register", handlers.RegisterUser)
	app.Post("/api/login", handlers.LoginUser)

	app.Get("/api/products", handlers.ListProducts)
	app.Delete("/api/products/:productId", handlers.DeleteProduct)
	app.Put("/api/products/:productId", handlers.UpdateProduct)
	app.Post("/api/products", handlers.CreateProduct)

	app.Get("/api/categories", handlers.ListCategories)
	app.Post("/api/categories", handlers.CreateCategories)

	app.Get("/api/warehouse", handlers.ListWarehouse)
	app.Post("/api/warehouse", handlers.CreateStock)
	app.Delete("/api/warehouse/:stockId", handlers.DeleteStock)
	app.Delete("/api/categories/:categoryId", handlers.DeleteCategory)
}
