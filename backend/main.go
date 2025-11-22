package main

import (
	"log"

	docs "my-backend/docs"
	"my-backend/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/swagger"
	"github.com/joho/godotenv"
)

// @title           Event Blog API
// @version         1.0
// @description     Public HTTP endpoints for the Event Blog backend.
// @host            localhost:8080
// @BasePath        /
func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	app := fiber.New()

	docs.SwaggerInfo.Title = "Event Blog API"
	docs.SwaggerInfo.Description = "Public HTTP endpoints for the Event Blog backend."
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.BasePath = "/"

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{

		AllowOrigins: "http://167.71.218.173:3000/",

		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// swagger routes
	app.Get("/swagger/*", swagger.HandlerDefault)
	routes.RegisterRoutes(app)

	log.Println("Server running on :8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
