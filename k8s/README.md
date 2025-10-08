# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Container registry access
- cert-manager (for TLS certificates)
- NGINX Ingress Controller

## Deployment Steps

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets
**Important**: Do NOT use the provided secret.yaml in production. Create secrets securely:

```bash
kubectl create secret generic weather-service-secrets \
  --namespace=weather-service \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=your-secure-password \
  --from-literal=REDIS_PASSWORD=your-redis-password \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=GOOGLE_CLIENT_ID=your-google-client-id \
  --from-literal=GOOGLE_CLIENT_SECRET=your-google-client-secret \
  --from-literal=GOOGLE_REDIRECT_URL=https://your-domain.com/auth/callback \
  --from-literal=WEATHER_API_KEY=your-weather-api-key
```

### 3. Apply ConfigMap
```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy PostgreSQL
```bash
kubectl apply -f k8s/postgres.yaml
```

### 5. Deploy Redis
```bash
kubectl apply -f k8s/redis.yaml
```

### 6. Deploy Backend
```bash
# First, build and push your Docker image
docker build -t your-registry/scott-weather-service:latest ./backend
docker push your-registry/scott-weather-service:latest

# Then deploy
kubectl apply -f k8s/backend.yaml
```

### 7. Deploy Ingress
```bash
# Update the domain in k8s/ingress.yaml first
kubectl apply -f k8s/ingress.yaml
```

## Verification

### Check All Resources
```bash
kubectl get all -n weather-service
```

### Check Pods Status
```bash
kubectl get pods -n weather-service
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/weather-backend -n weather-service

# PostgreSQL logs
kubectl logs -f deployment/postgres -n weather-service

# Redis logs
kubectl logs -f deployment/redis -n weather-service
```

### Test Health Endpoints
```bash
# Port forward to test locally
kubectl port-forward svc/weather-backend-service 8080:80 -n weather-service

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/health/ready
curl http://localhost:8080/health/live
```

## Scaling

### Manual Scaling
```bash
kubectl scale deployment weather-backend --replicas=5 -n weather-service
```

### View HPA Status
```bash
kubectl get hpa -n weather-service
```

## Troubleshooting

### Check Events
```bash
kubectl get events -n weather-service --sort-by='.lastTimestamp'
```

### Describe Resources
```bash
kubectl describe pod <pod-name> -n weather-service
kubectl describe deployment weather-backend -n weather-service
```

### Access Database
```bash
kubectl port-forward svc/postgres-service 5432:5432 -n weather-service
psql -h localhost -U postgres -d weather_service
```

### Access Redis
```bash
kubectl port-forward svc/redis-service 6379:6379 -n weather-service
redis-cli -h localhost
```

## Updating the Application

### Rolling Update
```bash
# Build new image with version tag
docker build -t your-registry/scott-weather-service:v1.1.0 ./backend
docker push your-registry/scott-weather-service:v1.1.0

# Update deployment
kubectl set image deployment/weather-backend backend=your-registry/scott-weather-service:v1.1.0 -n weather-service

# Check rollout status
kubectl rollout status deployment/weather-backend -n weather-service
```

### Rollback
```bash
kubectl rollout undo deployment/weather-backend -n weather-service
```

## Cleanup

To remove all resources:
```bash
kubectl delete namespace weather-service
```

## Production Considerations

1. **Secrets Management**: Use a secret management solution like:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Google Secret Manager
   - Azure Key Vault

2. **Monitoring**: Set up monitoring with:
   - Prometheus
   - Grafana
   - ELK Stack

3. **Backup**: Regular backups of PostgreSQL database

4. **SSL/TLS**: Ensure cert-manager is configured for automatic certificate renewal

5. **Resource Limits**: Adjust resource requests/limits based on your workload

6. **Network Policies**: Implement network policies for security

7. **Pod Security**: Use Pod Security Policies or Pod Security Standards

