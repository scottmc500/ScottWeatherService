.PHONY: help build run test clean docker-build docker-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	go build -o bin/weather-service ./cmd/api

run: ## Run the application
	go run ./cmd/api/main.go

test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out

lint: ## Run linter
	golangci-lint run

deps: ## Download dependencies
	go mod download
	go mod tidy

docker-build: ## Build Docker image
	docker build -t scott-weather-service:latest .

docker-run: ## Run Docker container
	docker run -p 8080:8080 --env-file .env scott-weather-service:latest

dev: ## Run with hot reload (requires air)
	air

migrate-up: ## Run database migrations up
	@echo "Running migrations..."
	go run ./cmd/api/main.go migrate up

migrate-down: ## Run database migrations down
	@echo "Rolling back migrations..."
	go run ./cmd/api/main.go migrate down

.DEFAULT_GOAL := help

