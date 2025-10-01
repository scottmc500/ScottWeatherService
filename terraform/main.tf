terraform {
  required_version = ">= 1.0"
  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 2.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

# Configure providers
provider "linode" {
  token = var.linode_token
}

provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}

provider "google" {
  project = var.google_project_id
  region  = var.google_region
}

provider "azuread" {
  tenant_id = var.azure_tenant_id
}

# Data sources
data "linode_region" "main" {
  id = var.linode_region
}

# Linode LKE Cluster
resource "linode_lke_cluster" "weather_service" {
  label           = "${var.project_name}-cluster"
  k8s_version     = var.k8s_version
  region          = data.linode_region.main.id
  tags            = [var.project_name, "production"]

  pool {
    type  = var.node_type
    count = var.node_count
  }

  # Auto-scaling configuration
  dynamic "pool" {
    for_each = var.enable_autoscaling ? [1] : []
    content {
      type  = var.node_type
      count = var.min_node_count
    }
  }
}

# Linode NodeBalancer (Load Balancer)
resource "linode_nodebalancer" "weather_service" {
  label  = "${var.project_name}-lb"
  region = data.linode_region.main.id
  tags   = [var.project_name, "production"]
}

# NodeBalancer Config for Frontend
resource "linode_nodebalancer_config" "frontend" {
  nodebalancer_id = linode_nodebalancer.weather_service.id
  port            = 443
  protocol        = "https"
  check           = "http"
  check_path      = "/"
  check_attempts  = 3
  check_timeout   = 30
  stickiness      = "http_cookie"
  algorithm       = "roundrobin"
}

# NodeBalancer Config for API
resource "linode_nodebalancer_config" "api" {
  nodebalancer_id = linode_nodebalancer.weather_service.id
  port            = 80
  protocol        = "http"
  check           = "http"
  check_path      = "/health"
  check_attempts  = 3
  check_timeout   = 30
  stickiness      = "http_cookie"
  algorithm       = "roundrobin"
}

# MongoDB Atlas Project
resource "mongodbatlas_project" "weather_service" {
  name   = "${var.project_name}-db"
  org_id = var.mongodb_atlas_org_id
}

# MongoDB Atlas Cluster
resource "mongodbatlas_cluster" "weather_service" {
  project_id   = mongodbatlas_project.weather_service.id
  name         = "${var.project_name}-cluster"
  cluster_type = "REPLICASET"
  
  # M0 free tier configuration
  provider_instance_size_name = "M0"
  provider_name               = "AWS"
  provider_region_name        = "US_EAST_1"
  
  mongo_db_major_version = "7.0"
}

# MongoDB Atlas Database User
resource "mongodbatlas_database_user" "weather_service" {
  username           = var.mongodb_username
  password           = var.mongodb_password
  project_id         = mongodbatlas_project.weather_service.id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = "weather-service"
  }
}

# MongoDB Atlas Network Access
resource "mongodbatlas_network_container" "weather_service" {
  project_id       = mongodbatlas_project.weather_service.id
  atlas_cidr_block = "10.8.0.0/18"
  provider_name    = "AWS"
  region_name      = "US_EAST_1"
}

resource "mongodbatlas_network_access_list" "weather_service" {
  project_id = mongodbatlas_project.weather_service.id
  cidr_block = "0.0.0.0/0"
  comment    = "Allow all IPs for development"
}

# Google OAuth 2.0 Client
resource "google_oauth2_client" "weather_service" {
  name         = "${var.project_name}-oauth"
  display_name = "${title(var.project_name)} OAuth Client"
  
  authorized_redirect_uris = [
    "${var.api_base_url}/api/auth/google/callback"
  ]
  
  authorized_javascript_origins = [
    var.frontend_url
  ]
}

# Enable Google APIs
resource "google_project_service" "calendar_api" {
  service = "calendar-json.googleapis.com"
  project = var.google_project_id
}

resource "google_project_service" "plus_api" {
  service = "plus.googleapis.com"
  project = var.google_project_id
}

# Azure AD App Registration
resource "azuread_application" "weather_service" {
  display_name = "${title(var.project_name)}"
  
  web {
    redirect_uris = [
      "${var.api_base_url}/api/auth/microsoft/callback"
    ]
    
    implicit_grant {
      access_token_issuance_enabled = true
      id_token_issuance_enabled     = true
    }
  }
  
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
    
    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
    
    resource_access {
      id   = "465a38f9-76ea-45b9-9f34-9e8b0d4b0b42" # Calendars.Read
      type = "Scope"
    }
  }
}

# Azure AD Client Secret
resource "azuread_application_password" "weather_service" {
  application_id = azuread_application.weather_service.id
  display_name   = "${title(var.project_name)} Secret"
  
  end_date = timeadd(timestamp(), "8760h") # 1 year
}

# Kubernetes Provider Configuration
provider "kubernetes" {
  host                   = linode_lke_cluster.weather_service.kubeconfig
  token                  = linode_lke_cluster.weather_service.kubeconfig
  cluster_ca_certificate = base64decode(linode_lke_cluster.weather_service.kubeconfig)
}
