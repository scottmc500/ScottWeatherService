# Project Configuration
variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "scott-weather"
}

# Linode Configuration
variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "linode_region" {
  description = "Linode region for the cluster"
  type        = string
  default     = "us-central"
}

variable "k8s_version" {
  description = "Kubernetes version for LKE cluster"
  type        = string
  default     = "1.28"
}

variable "node_type" {
  description = "Linode node type for the cluster"
  type        = string
  default     = "g6-nanode-1"
}

variable "node_count" {
  description = "Number of nodes in the cluster"
  type        = number
  default     = 3
}

variable "min_node_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "enable_autoscaling" {
  description = "Enable horizontal pod autoscaling"
  type        = bool
  default     = false
}

# MongoDB Atlas Configuration
variable "mongodb_atlas_public_key" {
  description = "MongoDB Atlas public key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_private_key" {
  description = "MongoDB Atlas private key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
}

variable "mongodb_username" {
  description = "MongoDB database username"
  type        = string
  default     = "weather-service-user"
}

variable "mongodb_password" {
  description = "MongoDB database password"
  type        = string
  sensitive   = true
}

# Google Cloud Configuration
variable "google_project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "google_region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

# Azure Configuration
variable "azure_tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

# Application Configuration
variable "api_base_url" {
  description = "Base URL for your API (for OAuth callbacks)"
  type        = string
  default     = "https://api.scottweather.com"
}

variable "frontend_url" {
  description = "Frontend URL (for CORS)"
  type        = string
  default     = "https://scottweather.com"
}

# External API Keys
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "openweathermap_api_key" {
  description = "OpenWeatherMap API key"
  type        = string
  sensitive   = true
}

# Environment Configuration
variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Tags
variable "tags" {
  description = "Tags to apply to all resources"
  type        = list(string)
  default     = ["weather-service", "kubernetes", "microservices"]
}

