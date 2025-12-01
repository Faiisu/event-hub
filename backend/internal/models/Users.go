package models

// User represents a registered user stored in MongoDB.
type Users struct {
	UserID       string `bson:"UserId" json:"UserId"`
	Email        string `bson:"Email" json:"Email"`
	DisplayName  string `bson:"DisplayName,omitempty" json:"DisplayName,omitempty"`
	PasswordHash string `bson:"PasswordHash,omitempty" json:"-"`
	AvatarURL    string `bson:"AvatarURL,omitempty" json:"AvatarURL,omitempty"`
	Status       string `bson:"Status" json:"Status"`
}
