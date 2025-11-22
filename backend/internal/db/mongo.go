package db

import (
	"context"
	"errors"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	clientOnce     sync.Once
	client         *mongo.Client
	clientErr      error
	usersSetupOnce sync.Once
	usersSetupErr  error
)

const defaultDBName = "event_hub"

func getMongoURL() (string, error) {
	url := os.Getenv("MONGO_URL")
	if url == "" {
		return "", errors.New("MONGO_URL is not set")
	}
	return url, nil
}

func dbName() string {
	if name := os.Getenv("MONGO_DB_NAME"); name != "" {
		return name
	}
	return defaultDBName
}

func mongoTimeoutContext(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 10*time.Second)
}

// Client returns a singleton Mongo client.
func Client(ctx context.Context) (*mongo.Client, error) {
	clientOnce.Do(func() {
		url, err := getMongoURL()
		if err != nil {
			clientErr = err
			return
		}

		c, err := mongo.Connect(ctx, options.Client().ApplyURI(url))
		if err != nil {
			clientErr = err
			return
		}

		if err := c.Ping(ctx, nil); err != nil {
			clientErr = err
			return
		}

		client = c
	})

	if clientErr != nil {
		return nil, clientErr
	}

	return client, nil
}

// UsersCollection returns the users collection, creating it and ensuring indexes if missing.
func UsersCollection(ctx context.Context) (*mongo.Collection, error) {
	c, err := Client(ctx)
	if err != nil {
		return nil, err
	}

	database := c.Database(dbName())
	usersSetupOnce.Do(func() {
		setupCtx, cancel := mongoTimeoutContext(ctx)
		defer cancel()

		names, err := database.ListCollectionNames(setupCtx, bson.D{{Key: "name", Value: "users"}})
		if err != nil {
			usersSetupErr = err
			return
		}

		if len(names) == 0 {
			usersSetupErr = database.CreateCollection(setupCtx, "users")
			if usersSetupErr != nil {
				return
			}
		}

		indexModel := mongo.IndexModel{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("email_unique"),
		}
		_, usersSetupErr = database.Collection("users").Indexes().CreateOne(setupCtx, indexModel)
	})

	if usersSetupErr != nil {
		return nil, usersSetupErr
	}

	return database.Collection("users"), nil
}

// EventsCollection returns the events collection, creating it if missing.
func EventsCollection(ctx context.Context) (*mongo.Collection, error) {
	c, err := Client(ctx)
	if err != nil {
		return nil, err
	}

	database := c.Database(dbName())

	names, err := database.ListCollectionNames(ctx, bson.D{{Key: "name", Value: "events"}})
	if err != nil {
		return nil, err
	}
	if len(names) == 0 {
		if err := database.CreateCollection(ctx, "events"); err != nil {
			return nil, err
		}
	}

	return database.Collection("events"), nil
}

// ProductsCollection returns the products collection, creating it if missing.
func ProductsCollection(ctx context.Context) (*mongo.Collection, error) {
	c, err := Client(ctx)
	if err != nil {
		return nil, err
	}

	database := c.Database(dbName())

	names, err := database.ListCollectionNames(ctx, bson.D{{Key: "name", Value: "products"}})
	if err != nil {
		return nil, err
	}
	if len(names) == 0 {
		if err := database.CreateCollection(ctx, "products"); err != nil {
			return nil, err
		}
	}

	return database.Collection("products"), nil
}

// StocksCollection returns the stocks collection, creating it if missing.
func StocksCollection(ctx context.Context) (*mongo.Collection, error) {
	c, err := Client(ctx)
	if err != nil {
		return nil, err
	}

	database := c.Database(dbName())

	names, err := database.ListCollectionNames(ctx, bson.D{{Key: "name", Value: "stocks"}})
	if err != nil {
		return nil, err
	}
	if len(names) == 0 {
		if err := database.CreateCollection(ctx, "stocks"); err != nil {
			return nil, err
		}
	}

	return database.Collection("stocks"), nil
}

// CategoriesCollection returns the categories collection, creating it if missing.
func CategoriesCollection(ctx context.Context) (*mongo.Collection, error) {
	c, err := Client(ctx)
	if err != nil {
		return nil, err
	}

	database := c.Database(dbName())

	names, err := database.ListCollectionNames(ctx, bson.D{{Key: "name", Value: "categories"}})
	if err != nil {
		return nil, err
	}
	if len(names) == 0 {
		if err := database.CreateCollection(ctx, "categories"); err != nil {
			return nil, err
		}
	}

	return database.Collection("categories"), nil
}
