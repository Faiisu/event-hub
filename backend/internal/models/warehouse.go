package models

import "github.com/google/uuid"

// Warehouse represents a user's stock list.
type Warehouse struct {
	StockID   uuid.UUID `bson:"StockID" json:"StockID"`
	UserID    uuid.UUID `bson:"UserID" json:"UserID"`
	StockName string    `bson:"StockName" json:"StockName"`
}
