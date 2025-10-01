# Linode LKE Cluster Outputs
output "lke_cluster_id" {
  description = "Linode LKE Cluster ID"
  value       = linode_lke_cluster.weather_service.id
}

output "lke_cluster_kubeconfig" {
  description = "Kubernetes configuration for the LKE cluster"
  value       = linode_lke_cluster.weather_service.kubeconfig
  sensitive   = true
}

output "lke_cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = linode_lke_cluster.weather_service.endpoint
}

output "lke_cluster_status" {
  description = "Status of the LKE cluster"
  value       = linode_lke_cluster.weather_service.status
}

# Load Balancer Outputs
output "load_balancer_id" {
  description = "Linode NodeBalancer ID"
  value       = linode_nodebalancer.weather_service.id
}

output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = linode_nodebalancer.weather_service.ipv4
}

output "load_balancer_hostname" {
  description = "Load balancer hostname"
  value       = linode_nodebalancer.weather_service.hostname
}

# MongoDB Atlas Outputs
output "mongodb_project_id" {
  description = "MongoDB Atlas Project ID"
  value       = mongodbatlas_project.weather_service.id
}

output "mongodb_cluster_id" {
  description = "MongoDB Atlas Cluster ID"
  value       = mongodbatlas_cluster.weather_service.id
}

output "mongodb_connection_string" {
  description = "MongoDB connection string"
  value       = mongodbatlas_cluster.weather_service.connection_strings[0].standard_srv
  sensitive   = true
}

output "mongodb_username" {
  description = "MongoDB username"
  value       = mongodbatlas_database_user.weather_service.username
}

output "mongodb_password" {
  description = "MongoDB password"
  value       = mongodbatlas_database_user.weather_service.password
  sensitive   = true
}

# OAuth Credentials
output "google_client_id" {
  description = "Google OAuth Client ID"
  value       = google_oauth2_client.weather_service.client_id
  sensitive   = true
}

output "google_client_secret" {
  description = "Google OAuth Client Secret"
  value       = google_oauth2_client.weather_service.client_secret
  sensitive   = true
}

output "microsoft_client_id" {
  description = "Microsoft OAuth Client ID"
  value       = azuread_application.weather_service.client_id
  sensitive   = true
}

output "microsoft_client_secret" {
  description = "Microsoft OAuth Client Secret"
  value       = azuread_application_password.weather_service.value
  sensitive   = true
}

# Kubernetes Secrets (for kubectl commands)
output "kubectl_secrets_command" {
  description = "Command to create Kubernetes secrets from Terraform outputs"
  value = <<-EOT
    # Create Kubernetes secrets
    kubectl create secret generic weather-service-secrets \
      --from-literal=MONGODB_URI="${mongodbatlas_cluster.weather_service.connection_strings[0].standard_srv}" \
      --from-literal=MONGODB_USERNAME="${mongodbatlas_database_user.weather_service.username}" \
      --from-literal=MONGODB_PASSWORD="${mongodbatlas_database_user.weather_service.password}" \
      --from-literal=GOOGLE_CLIENT_ID="${google_oauth2_client.weather_service.client_id}" \
      --from-literal=GOOGLE_CLIENT_SECRET="${google_oauth2_client.weather_service.client_secret}" \
      --from-literal=MICROSOFT_CLIENT_ID="${azuread_application.weather_service.client_id}" \
      --from-literal=MICROSOFT_CLIENT_SECRET="${azuread_application_password.weather_service.value}" \
      --from-literal=OPENAI_API_KEY="${var.openai_api_key}" \
      --from-literal=OPENWEATHERMAP_API_KEY="${var.openweathermap_api_key}" \
      --dry-run=client -o yaml | kubectl apply -f -
  EOT
}

# Application URLs
output "frontend_url" {
  description = "Frontend application URL"
  value       = var.frontend_url
}

output "api_url" {
  description = "API base URL"
  value       = var.api_base_url
}

# Cost Information
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    linode_lke = "$${var.node_count * 5}/month (${var.node_count}x ${var.node_type})"
    mongodb_atlas = "$0/month (M0 free tier)"
    load_balancer = "$10/month (NodeBalancer)"
    total_estimated = "$${var.node_count * 5 + 10}/month"
  }
}

