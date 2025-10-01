#!/bin/bash

# Weather Service Deployment Script
# This script deploys the complete infrastructure and application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="scott-weather"
TERRAFORM_DIR="terraform"
K8S_DIR="k8s"
SECRETS_FILE="terraform/secrets.tfvars"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    
    # Check if secrets file exists
    if [ ! -f "$SECRETS_FILE" ]; then
        log_error "Secrets file not found: $SECRETS_FILE"
        log_info "Please copy terraform/secrets.tfvars.example to terraform/secrets.tfvars and fill in your values"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd $TERRAFORM_DIR
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -var-file="secrets.tfvars"
    
    # Apply the configuration
    terraform apply -var-file="secrets.tfvars" -auto-approve
    
    # Get the kubeconfig
    terraform output -raw lke_cluster_kubeconfig > ../kubeconfig.yaml
    export KUBECONFIG=../kubeconfig.yaml
    
    cd ..
    
    log_success "Infrastructure deployed successfully"
}

create_kubernetes_secrets() {
    log_info "Creating Kubernetes secrets..."
    
    # Wait for cluster to be ready
    kubectl wait --for=condition=ready node --all --timeout=300s
    
    # Create secrets from Terraform outputs
    cd $TERRAFORM_DIR
    
    kubectl create secret generic weather-service-secrets \
        --from-literal=MONGODB_URI="$(terraform output -raw mongodb_connection_string)" \
        --from-literal=MONGODB_USERNAME="$(terraform output -raw mongodb_username)" \
        --from-literal=MONGODB_PASSWORD="$(terraform output -raw mongodb_password)" \
        --from-literal=GOOGLE_CLIENT_ID="$(terraform output -raw google_client_id)" \
        --from-literal=GOOGLE_CLIENT_SECRET="$(terraform output -raw google_client_secret)" \
        --from-literal=MICROSOFT_CLIENT_ID="$(terraform output -raw microsoft_client_id)" \
        --from-literal=MICROSOFT_CLIENT_SECRET="$(terraform output -raw microsoft_client_secret)" \
        --from-literal=OPENAI_API_KEY="$(terraform output -raw openai_api_key)" \
        --from-literal=OPENWEATHERMAP_API_KEY="$(terraform output -raw openweathermap_api_key)" \
        --namespace=weather-service \
        --dry-run=client -o yaml | kubectl apply -f -
    
    cd ..
    
    log_success "Kubernetes secrets created successfully"
}

deploy_application() {
    log_info "Deploying application to Kubernetes..."
    
    # Apply Kubernetes manifests
    kubectl apply -f $K8S_DIR/namespace-configmaps.yaml
    kubectl apply -f $K8S_DIR/redis.yaml
    kubectl apply -f $K8S_DIR/core-service.yaml
    kubectl apply -f $K8S_DIR/calendar-service.yaml
    kubectl apply -f $K8S_DIR/weather-service.yaml
    kubectl apply -f $K8S_DIR/frontend.yaml
    
    log_success "Application deployed successfully"
}

wait_for_deployment() {
    log_info "Waiting for deployments to be ready..."
    
    # Wait for all deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n weather-service
    kubectl wait --for=condition=available --timeout=300s deployment/core-service -n weather-service
    kubectl wait --for=condition=available --timeout=300s deployment/calendar-service -n weather-service
    kubectl wait --for=condition=available --timeout=300s deployment/weather-service -n weather-service
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n weather-service
    
    log_success "All deployments are ready"
}

show_status() {
    log_info "Deployment Status:"
    
    echo ""
    echo "=== Pods ==="
    kubectl get pods -n weather-service
    
    echo ""
    echo "=== Services ==="
    kubectl get services -n weather-service
    
    echo ""
    echo "=== Ingress ==="
    kubectl get ingress -n weather-service
    
    echo ""
    echo "=== HorizontalPodAutoscalers ==="
    kubectl get hpa -n weather-service
    
    echo ""
    echo "=== Load Balancer IP ==="
    cd $TERRAFORM_DIR
    echo "Load Balancer IP: $(terraform output -raw load_balancer_ip)"
    cd ..
}

cleanup() {
    log_info "Cleaning up..."
    rm -f kubeconfig.yaml
}

# Main execution
main() {
    log_info "Starting Weather Service deployment..."
    
    check_prerequisites
    deploy_infrastructure
    create_kubernetes_secrets
    deploy_application
    wait_for_deployment
    show_status
    
    log_success "Deployment completed successfully!"
    
    echo ""
    echo "Next steps:"
    echo "1. Update your DNS to point to the Load Balancer IP"
    echo "2. Update OAuth redirect URIs with your domain"
    echo "3. Test the application"
    
    cleanup
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"

