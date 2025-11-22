package models

import "github.com/google/uuid"

// Categories represents a category belonging to a stock.
// Note: Discription is kept to align with existing field naming.
type Categories struct {
	CategoryID   uuid.UUID `bson:"CategoryID" json:"CategoryID"`
	StockID      uuid.UUID `bson:"StockID" json:"StockID"`
	CategoryName string    `bson:"CategoryName" json:"CategoryName"`
	Discription  string    `bson:"Discription,omitempty" json:"Discription,omitempty"`
}
