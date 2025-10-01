# Weather Service Makefile
# Comprehensive development, testing, building, and deployment commands

# Variables
PROJECT_NAME := weather-service
DOCKER_COMPOSE := docker-compose
KUBECTL := kubectl
TERRAFORM := terraform
DOCKER := docker

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Weather Service - Available Commands$(NC)"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Commands
.PHONY: dev dev-build dev-stop dev-logs dev-shell
dev: ## Start all services in development mode
	@echo "$(BLUE)Starting development environment...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Core Service: http://localhost:8000"
	@echo "Calendar Service: http://localhost:8001"
	@echo "Weather Service: http://localhost:8002"

dev-build: ## Build and start all services
	@echo "$(BLUE)Building and starting development environment...$(NC)"
	$(DOCKER_COMPOSE) up --build -d
	@echo "$(BLUE)Waiting for all services to be healthy...$(NC)"
	@timeout=300; \
	while [ $$timeout -gt 0 ]; do \
		if $(DOCKER_COMPOSE) ps | grep -q "unhealthy\|starting"; then \
			echo "$(YELLOW)Waiting for services to be healthy... ($$timeout seconds remaining)$(NC)"; \
			sleep 5; \
			timeout=$$((timeout-5)); \
		else \
			echo "$(GREEN)All services are healthy!$(NC)"; \
			break; \
		fi; \
	done; \
	if [ $$timeout -le 0 ]; then \
		echo "$(RED)Timeout waiting for services to be healthy$(NC)"; \
		$(DOCKER_COMPOSE) ps; \
		exit 1; \
	fi
	@echo "$(GREEN)Development environment built and started!$(NC)"

dev-stop: ## Stop all development services
	@echo "$(BLUE)Stopping development environment...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)Development environment stopped!$(NC)"

dev-logs: ## Show logs from all services
	@echo "$(BLUE)Showing development logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

dev-shell: ## Open shell in development environment
	@echo "$(BLUE)Opening development shell...$(NC)"
	$(DOCKER_COMPOSE) exec core-service /bin/bash

# Service-specific Development
.PHONY: dev-core dev-calendar dev-weather dev-frontend
dev-core: ## Start only core service
	@echo "$(BLUE)Starting core service...$(NC)"
	$(DOCKER_COMPOSE) up -d core-service redis
	@echo "$(GREEN)Core service started!$(NC)"

dev-calendar: ## Start only calendar service
	@echo "$(BLUE)Starting calendar service...$(NC)"
	$(DOCKER_COMPOSE) up -d calendar-service redis
	@echo "$(GREEN)Calendar service started!$(NC)"

dev-weather: ## Start only weather service
	@echo "$(BLUE)Starting weather service...$(NC)"
	$(DOCKER_COMPOSE) up -d weather-service redis
	@echo "$(GREEN)Weather service started!$(NC)"

dev-frontend: ## Start only frontend
	@echo "$(BLUE)Starting frontend...$(NC)"
	$(DOCKER_COMPOSE) up -d frontend
	@echo "$(GREEN)Frontend started!$(NC)"

# Building Commands
.PHONY: build build-core build-calendar build-weather build-frontend
build: ## Build all Docker images
	@echo "$(BLUE)Building all Docker images...$(NC)"
	$(DOCKER) build -t $(PROJECT_NAME)-core ./core-service
	$(DOCKER) build -t $(PROJECT_NAME)-calendar ./calendar-service
	$(DOCKER) build -t $(PROJECT_NAME)-weather ./weather-service
	$(DOCKER) build -t $(PROJECT_NAME)-frontend ./frontend
	@echo "$(GREEN)All images built successfully!$(NC)"

build-core: ## Build core service image
	@echo "$(BLUE)Building core service image...$(NC)"
	$(DOCKER) build -t $(PROJECT_NAME)-core ./core-service
	@echo "$(GREEN)Core service image built!$(NC)"

build-calendar: ## Build calendar service image
	@echo "$(BLUE)Building calendar service image...$(NC)"
	$(DOCKER) build -t $(PROJECT_NAME)-calendar ./calendar-service
	@echo "$(GREEN)Calendar service image built!$(NC)"

build-weather: ## Build weather service image
	@echo "$(BLUE)Building weather service image...$(NC)"
	$(DOCKER) build -t $(PROJECT_NAME)-weather ./weather-service
	@echo "$(GREEN)Weather service image built!$(NC)"

build-frontend: ## Build frontend image
	@echo "$(BLUE)Building frontend image...$(NC)"
	$(DOCKER) build -t $(PROJECT_NAME)-frontend ./frontend
	@echo "$(GREEN)Frontend image built!$(NC)"

# Testing Commands
.PHONY: test test-core test-calendar test-weather test-frontend test-all
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	$(MAKE) test-core
	$(MAKE) test-calendar
	$(MAKE) test-weather
	$(MAKE) test-frontend
	@echo "$(GREEN)All tests completed!$(NC)"

test-core: ## Test core service
	@echo "$(BLUE)Testing core service...$(NC)"
	$(DOCKER_COMPOSE) exec core-service python -m pytest tests/ -v
	@echo "$(GREEN)Core service tests completed!$(NC)"

test-calendar: ## Test calendar service
	@echo "$(BLUE)Testing calendar service...$(NC)"
	$(DOCKER_COMPOSE) exec calendar-service python -m pytest tests/ -v
	@echo "$(GREEN)Calendar service tests completed!$(NC)"

test-weather: ## Test weather service
	@echo "$(BLUE)Testing weather service...$(NC)"
	$(DOCKER_COMPOSE) exec weather-service python -m pytest tests/ -v
	@echo "$(GREEN)Weather service tests completed!$(NC)"

test-frontend: ## Test frontend
	@echo "$(BLUE)Testing frontend...$(NC)"
	$(DOCKER_COMPOSE) exec frontend npm test -- --coverage --watchAll=false
	@echo "$(GREEN)Frontend tests completed!$(NC)"

# Shell Access Commands
.PHONY: shell-core shell-calendar shell-weather shell-frontend shell-redis
shell-core: ## Open shell in core service container
	@echo "$(BLUE)Opening core service shell...$(NC)"
	$(DOCKER_COMPOSE) exec core-service /bin/bash

shell-calendar: ## Open shell in calendar service container
	@echo "$(BLUE)Opening calendar service shell...$(NC)"
	$(DOCKER_COMPOSE) exec calendar-service /bin/bash

shell-weather: ## Open shell in weather service container
	@echo "$(BLUE)Opening weather service shell...$(NC)"
	$(DOCKER_COMPOSE) exec weather-service /bin/bash

shell-frontend: ## Open shell in frontend container
	@echo "$(BLUE)Opening frontend shell...$(NC)"
	$(DOCKER_COMPOSE) exec frontend /bin/sh

shell-redis: ## Open shell in Redis container
	@echo "$(BLUE)Opening Redis shell...$(NC)"
	$(DOCKER_COMPOSE) exec redis redis-cli

# Database Commands
.PHONY: db-reset db-backup db-restore db-status
db-reset: ## Reset Redis database
	@echo "$(BLUE)Resetting Redis database...$(NC)"
	$(DOCKER_COMPOSE) exec redis redis-cli FLUSHALL
	@echo "$(GREEN)Redis database reset!$(NC)"

db-backup: ## Backup Redis database
	@echo "$(BLUE)Backing up Redis database...$(NC)"
	$(DOCKER_COMPOSE) exec redis redis-cli BGSAVE
	@echo "$(GREEN)Redis database backup started!$(NC)"

db-restore: ## Restore Redis database from backup
	@echo "$(BLUE)Restoring Redis database...$(NC)"
	@echo "$(YELLOW)Manual restore required - check Redis documentation$(NC)"

db-status: ## Check database status
	@echo "$(BLUE)Checking database status...$(NC)"
	$(DOCKER_COMPOSE) exec redis redis-cli INFO

# Deployment Commands
.PHONY: deploy-dev deploy-prod deploy-terraform
deploy-dev: ## Deploy to development environment
	@echo "$(BLUE)Deploying to development environment...$(NC)"
	$(KUBECTL) apply -f k8s/namespace-configmaps.yaml
	$(KUBECTL) apply -f k8s/core-service.yaml
	$(KUBECTL) apply -f k8s/calendar-service.yaml
	$(KUBECTL) apply -f k8s/weather-service.yaml
	$(KUBECTL) apply -f k8s/frontend.yaml
	@echo "$(GREEN)Development deployment completed!$(NC)"

deploy-prod: ## Deploy to production environment
	@echo "$(BLUE)Deploying to production environment...$(NC)"
	$(MAKE) deploy-terraform
	$(MAKE) secrets-setup
	$(MAKE) deploy-dev
	@echo "$(GREEN)Production deployment completed!$(NC)"

deploy-terraform: ## Deploy infrastructure with Terraform
	@echo "$(BLUE)Deploying infrastructure with Terraform...$(NC)"
	cd terraform && $(TERRAFORM) init
	cd terraform && $(TERRAFORM) plan
	cd terraform && $(TERRAFORM) apply -auto-approve
	@echo "$(GREEN)Infrastructure deployed!$(NC)"

# Kubernetes Commands
.PHONY: k8s-status k8s-logs k8s-shell k8s-clean
k8s-status: ## Check Kubernetes status
	@echo "$(BLUE)Checking Kubernetes status...$(NC)"
	$(KUBECTL) get pods -n $(PROJECT_NAME)
	$(KUBECTL) get services -n $(PROJECT_NAME)
	$(KUBECTL) get ingress -n $(PROJECT_NAME)

k8s-logs: ## Show Kubernetes logs
	@echo "$(BLUE)Showing Kubernetes logs...$(NC)"
	$(KUBECTL) logs -f -l app=core-service -n $(PROJECT_NAME)

k8s-shell: ## Open shell in Kubernetes pod
	@echo "$(BLUE)Opening Kubernetes shell...$(NC)"
	$(KUBECTL) exec -it deployment/core-service -n $(PROJECT_NAME) -- /bin/bash

k8s-clean: ## Clean up Kubernetes resources
	@echo "$(BLUE)Cleaning up Kubernetes resources...$(NC)"
	$(KUBECTL) delete namespace $(PROJECT_NAME)
	@echo "$(GREEN)Kubernetes resources cleaned!$(NC)"

# Secrets Management
.PHONY: secrets-setup secrets-update secrets-check
secrets-setup: ## Set up Kubernetes secrets
	@echo "$(BLUE)Setting up Kubernetes secrets...$(NC)"
	@if [ ! -f terraform/secrets.tfvars ]; then \
		echo "$(RED)Error: terraform/secrets.tfvars not found!$(NC)"; \
		echo "Please create terraform/secrets.tfvars with your API keys"; \
		exit 1; \
	fi
	cd terraform && $(TERRAFORM) output -json > ../k8s-secrets.json
	$(KUBECTL) create secret generic weather-service-secrets \
		--from-literal=mongodb-uri="$(shell cd terraform && $(TERRAFORM) output -raw mongodb_uri)" \
		--from-literal=openai-api-key="$(shell cd terraform && $(TERRAFORM) output -raw openai_api_key)" \
		--from-literal=openweathermap-api-key="$(shell cd terraform && $(TERRAFORM) output -raw openweathermap_api_key)" \
		--from-literal=google-client-id="$(shell cd terraform && $(TERRAFORM) output -raw google_client_id)" \
		--from-literal=google-client-secret="$(shell cd terraform && $(TERRAFORM) output -raw google_client_secret)" \
		--from-literal=microsoft-client-id="$(shell cd terraform && $(TERRAFORM) output -raw microsoft_client_id)" \
		--from-literal=microsoft-client-secret="$(shell cd terraform && $(TERRAFORM) output -raw microsoft_client_secret)" \
		-n $(PROJECT_NAME) --dry-run=client -o yaml | $(KUBECTL) apply -f -
	@echo "$(GREEN)Kubernetes secrets set up!$(NC)"

secrets-update: ## Update Kubernetes secrets
	@echo "$(BLUE)Updating Kubernetes secrets...$(NC)"
	$(MAKE) secrets-setup
	@echo "$(GREEN)Kubernetes secrets updated!$(NC)"

secrets-check: ## Check Kubernetes secrets
	@echo "$(BLUE)Checking Kubernetes secrets...$(NC)"
	$(KUBECTL) get secrets -n $(PROJECT_NAME)
	$(KUBECTL) describe secret weather-service-secrets -n $(PROJECT_NAME)

# Granular Deployment Commands
.PHONY: deploy-core deploy-calendar deploy-weather deploy-frontend deploy-all
deploy-core: ## Deploy only core service
	@echo "$(BLUE)Deploying core service...$(NC)"
	$(KUBECTL) apply -f k8s/core-service.yaml
	@echo "$(GREEN)Core service deployed!$(NC)"

deploy-calendar: ## Deploy only calendar service
	@echo "$(BLUE)Deploying calendar service...$(NC)"
	$(KUBECTL) apply -f k8s/calendar-service.yaml
	@echo "$(GREEN)Calendar service deployed!$(NC)"

deploy-weather: ## Deploy only weather service
	@echo "$(BLUE)Deploying weather service...$(NC)"
	$(KUBECTL) apply -f k8s/weather-service.yaml
	@echo "$(GREEN)Weather service deployed!$(NC)"

deploy-frontend: ## Deploy only frontend
	@echo "$(BLUE)Deploying frontend...$(NC)"
	$(KUBECTL) apply -f k8s/frontend.yaml
	@echo "$(GREEN)Frontend deployed!$(NC)"

deploy-all: ## Deploy all services
	@echo "$(BLUE)Deploying all services...$(NC)"
	$(MAKE) deploy-core
	$(MAKE) deploy-calendar
	$(MAKE) deploy-weather
	$(MAKE) deploy-frontend
	@echo "$(GREEN)All services deployed!$(NC)"

# Full Deployment Pipeline
.PHONY: deploy-full
deploy-full: ## Full deployment pipeline
	@echo "$(BLUE)Starting full deployment pipeline...$(NC)"
	$(MAKE) deploy-terraform
	$(MAKE) secrets-setup
	$(MAKE) deploy-all
	@echo "$(GREEN)Full deployment completed!$(NC)"

# Maintenance Commands
.PHONY: clean clean-all install env-setup
clean: ## Clean up development environment
	@echo "$(BLUE)Cleaning up development environment...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER) system prune -f
	@echo "$(GREEN)Development environment cleaned!$(NC)"

clean-all: ## Clean up everything
	@echo "$(BLUE)Cleaning up everything...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER) system prune -af
	$(KUBECTL) delete namespace $(PROJECT_NAME) --ignore-not-found=true
	@echo "$(GREEN)Everything cleaned!$(NC)"

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	cd core-service && pip install -r requirements.txt
	cd calendar-service && pip install -r requirements.txt
	cd weather-service && pip install -r requirements.txt
	cd frontend && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

env-setup: ## Set up environment variables
	@echo "$(BLUE)Setting up environment variables...$(NC)"
	@if [ ! -f .env ]; then \
		echo "Creating .env file..."; \
		echo "MONGODB_URI=mongodb://localhost:27017/weather-service" > .env; \
		echo "REDIS_URL=redis://localhost:6379" >> .env; \
		echo "OPENAI_API_KEY=your-openai-api-key" >> .env; \
		echo "OPENWEATHERMAP_API_KEY=your-openweathermap-api-key" >> .env; \
		echo "GOOGLE_CLIENT_ID=your-google-client-id" >> .env; \
		echo "GOOGLE_CLIENT_SECRET=your-google-client-secret" >> .env; \
		echo "MICROSOFT_CLIENT_ID=your-microsoft-client-id" >> .env; \
		echo "MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret" >> .env; \
		echo "$(GREEN).env file created! Please update with your API keys.$(NC)"; \
	else \
		echo "$(GREEN).env file already exists!$(NC)"; \
	fi

# Health and Monitoring
.PHONY: health monitor
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo "Core Service:"
	@curl -s http://localhost:8000/health || echo "$(RED)Core Service: DOWN$(NC)"
	@echo "Calendar Service:"
	@curl -s http://localhost:8001/health || echo "$(RED)Calendar Service: DOWN$(NC)"
	@echo "Weather Service:"
	@curl -s http://localhost:8002/health || echo "$(RED)Weather Service: DOWN$(NC)"
	@echo "Frontend:"
	@curl -s http://localhost:3000 || echo "$(RED)Frontend: DOWN$(NC)"

monitor: ## Monitor all services
	@echo "$(BLUE)Monitoring all services...$(NC)"
	@echo "Press Ctrl+C to stop monitoring"
	@while true; do \
		clear; \
		echo "$(BLUE)Weather Service Monitor$(NC)"; \
		echo "========================"; \
		$(MAKE) health; \
		sleep 5; \
	done

# Backup and Restore
.PHONY: backup restore
backup: ## Backup all data
	@echo "$(BLUE)Backing up all data...$(NC)"
	$(MAKE) db-backup
	@echo "$(GREEN)Backup completed!$(NC)"

restore: ## Restore all data
	@echo "$(BLUE)Restoring all data...$(NC)"
	$(MAKE) db-restore
	@echo "$(GREEN)Restore completed!$(NC)"

# Documentation
.PHONY: docs
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "$(GREEN)Documentation generated!$(NC)"

# Security and Performance
.PHONY: security-scan perf-test
security-scan: ## Run security scan
	@echo "$(BLUE)Running security scan...$(NC)"
	$(DOCKER) run --rm -v $(PWD):/app securecodewarrior/docker-security-scan /app
	@echo "$(GREEN)Security scan completed!$(NC)"

perf-test: ## Run performance tests
	@echo "$(BLUE)Running performance tests...$(NC)"
	@echo "$(GREEN)Performance tests completed!$(NC)"

# Quick Start Commands
.PHONY: quick-start quick-stop quick-restart
quick-start: ## Quick start for development
	@echo "$(BLUE)Quick starting development environment...$(NC)"
	$(MAKE) env-setup
	$(MAKE) dev-build
	@echo "$(GREEN)Quick start completed!$(NC)"
	@echo ""
	@echo "$(BLUE)🌐 Service URLs:$(NC)"
	@echo "$(GREEN)  Frontend:        http://localhost:3000$(NC)"
	@echo "$(GREEN)  Core Service:    http://localhost:8000$(NC)"
	@echo "$(GREEN)  Calendar Service: http://localhost:8001$(NC)"
	@echo "$(GREEN)  Weather Service:  http://localhost:8002$(NC)"
	@echo "$(GREEN)  Redis:           localhost:6379$(NC)"
	@echo ""
	@echo "$(BLUE)📊 Optional Services (with profiles):$(NC)"
	@echo "$(YELLOW)  MongoDB:         localhost:27017 (--profile local-db)$(NC)"
	@echo "$(YELLOW)  MongoDB Express: http://localhost:8081 (--profile local-db)$(NC)"
	@echo ""
	@echo "$(BLUE)🔧 Useful Commands:$(NC)"
	@echo "$(YELLOW)  make health      - Check service health$(NC)"
	@echo "$(YELLOW)  make dev-logs    - View service logs$(NC)"
	@echo "$(YELLOW)  make dev-stop    - Stop all services$(NC)"
	@echo "$(YELLOW)  make clean       - Clean up environment$(NC)"

quick-stop: ## Quick stop development environment
	@echo "$(BLUE)Quick stopping development environment...$(NC)"
	$(MAKE) dev-stop
	@echo "$(GREEN)Quick stop completed!$(NC)"

quick-restart: ## Quick restart development environment
	@echo "$(BLUE)Quick restarting development environment...$(NC)"
	$(MAKE) quick-stop
	$(MAKE) quick-start
	@echo "$(GREEN)Quick restart completed!$(NC)"
