package handlers

import (
	"context"
	"strings"
	"time"

	"my-backend/internal/db"
	"my-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email       string `json:"Email"`
	DisplayName string `json:"DisplayName"`
	Password    string `json:"Password"`
	AvatarURL   string `json:"AvatarURL"`
}

// RegisterUser godoc
// @Summary      Register a new user
// @Description  Creates a new user document with a hashed password.
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        payload  body      registerRequest  true  "User registration data"
// @Success      201  {object}  models.Users
// @Failure      400  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/register [post]
func RegisterUser(c *fiber.Ctx) error {
	var req registerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON payload")
	}

	req.Email = strings.TrimSpace(req.Email)
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	req.AvatarURL = strings.TrimSpace(req.AvatarURL)

	if req.Email == "" || req.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email and password are required")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to hash password")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection, err := db.UsersCollection(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "database unavailable")
	}

	user := models.Users{
		UserID:       uuid.New().String(),
		Email:        req.Email,
		DisplayName:  req.DisplayName,
		PasswordHash: string(hashedPassword),
		AvatarURL:    req.AvatarURL,
		Status:       "ACTIVE",
	}

	if _, err := collection.InsertOne(ctx, user); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create user")
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}
