package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

type WeatherCacheRepository interface {
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Get(ctx context.Context, key string, dest interface{}) error
	Delete(ctx context.Context, key string) error
}

type weatherCacheRepository struct {
	client *redis.Client
}

func NewWeatherCacheRepository(client *redis.Client) WeatherCacheRepository {
	return &weatherCacheRepository{client: client}
}

func (r *weatherCacheRepository) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if r.client == nil {
		return nil // No-op if Redis is not available
	}

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *weatherCacheRepository) Get(ctx context.Context, key string, dest interface{}) error {
	if r.client == nil {
		return redis.Nil // Simulate cache miss if Redis is not available
	}

	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

func (r *weatherCacheRepository) Delete(ctx context.Context, key string) error {
	if r.client == nil {
		return nil // No-op if Redis is not available
	}

	return r.client.Del(ctx, key).Err()
}

