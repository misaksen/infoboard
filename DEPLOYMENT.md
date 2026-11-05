# Infoboard Deployment Guide

## Quick Summary

The Infoboard is a complete, containerized application ready for deployment. Here's what's included:

✅ Full Node.js/Express backend with SQLite
✅ Admin dashboard with authentication
✅ Public display frontend
✅ Docker container ready
✅ Kubernetes manifests included
✅ All code tested and working

## Local Testing

### Option 1: Docker Compose (Recommended for quick testing)

```bash
docker-compose up
```

Then access:
- Display: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: admin / admin123

### Option 2: Direct Node.js

```bash
npm install
npm start
```

## Production Deployment

### Option 1: Docker (Single Container)

```bash
# Build image
docker build -t infoboard:1.0.0 .

# Run container
docker run -d \
  --name infoboard \
  -p 3000:3000 \
  -v /path/to/data:/data \
  -e ADMIN_PASSWORD=secure_password \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  infoboard:1.0.0
```

### Option 2: Kubernetes (Full Stack)

#### Prerequisites
- kubectl configured
- Docker image built or available in registry
- Kubernetes cluster with persistent storage support

#### Deployment Steps

1. **Create Namespace** (optional)
   ```bash
   kubectl create namespace infoboard
   ```

2. **Create Secrets**
   ```bash
   kubectl create secret generic infoboard-secret \
     --namespace=infoboard \
     --from-literal=admin-password=YourSecurePassword \
     --from-literal=jwt-secret=$(openssl rand -base64 32)
   ```

3. **Apply ConfigMap**
   ```bash
   kubectl apply -f k8s/configmap.yaml -n infoboard
   ```

4. **Create PVC (if not using dynamic provisioning)**
   ```bash
   kubectl apply -f k8s/pvc.yaml -n infoboard
   ```

5. **Deploy Application**
   ```bash
   kubectl apply -f k8s/deployment.yaml -n infoboard
   ```

6. **Create Service**
   ```bash
   kubectl apply -f k8s/service.yaml -n infoboard
   ```

7. **Verify Deployment**
   ```bash
   kubectl get pods -n infoboard
   kubectl get svc -n infoboard
   kubectl logs -f deployment/infoboard -n infoboard
   ```

#### Accessing the Application

**Port Forward** (for testing):
```bash
kubectl port-forward svc/infoboard 3000:80 -n infoboard
```

**Ingress** (for production):
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: infoboard
  namespace: infoboard
spec:
  ingressClassName: nginx
  rules:
  - host: infoboard.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: infoboard
            port:
              number: 80
  tls:
  - hosts:
    - infoboard.example.com
    secretName: infoboard-tls
```

## Security Checklist

- [ ] Change default admin password
- [ ] Generate new JWT_SECRET (use `openssl rand -base64 32`)
- [ ] Enable HTTPS/TLS in reverse proxy
- [ ] Backup database regularly
- [ ] Set resource limits (already in deployment.yaml)
- [ ] Enable pod security policies
- [ ] Use private image registry if possible
- [ ] Rotate secrets regularly

## Monitoring & Maintenance

### Check Health

```bash
curl http://localhost:3000/api/public/health
```

### View Logs

```bash
# Docker
docker logs infoboard

# Kubernetes
kubectl logs -f deployment/infoboard -n infoboard
```

### Backup Database

```bash
# Docker
docker exec infoboard cat /data/infoboard.db > backup.db

# Kubernetes
kubectl exec deployment/infoboard -n infoboard -- cat /data/infoboard.db > backup.db
```

### Restore Database

```bash
# Docker
docker cp backup.db infoboard:/data/infoboard.db

# Kubernetes
kubectl cp backup.db infoboard/infoboard-xxxxx:/data/infoboard.db
```

## Troubleshooting

### Posts not showing

1. Check post time window is current
2. Verify post's `active` flag is 1
3. Check server timezone

### Admin login fails

1. Verify ADMIN_USERNAME and ADMIN_PASSWORD
2. Check JWT_SECRET is set
3. Review logs for errors

### Image upload fails

1. Verify /data/uploads directory exists and is writable
2. Check image size (max 5MB)
3. Check image format (JPEG, PNG, GIF, WebP)

### Database issues

1. Check /data directory permissions
2. Verify SQLite database file exists
3. Check available disk space

## Scaling

### Horizontal Scaling

For multiple replicas:

1. Update deployment.yaml replicas
2. Use persistent volume with ReadWriteMany (if filesystem supports it)
3. Or use external database (upgrade to PostgreSQL)

### Vertical Scaling

Update resource requests/limits in k8s/deployment.yaml:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Environment Variables

All configuration via environment variables:

```
NODE_ENV              production/development
PORT                  3000
ADMIN_USERNAME        admin (default)
ADMIN_PASSWORD        admin123 (default - CHANGE THIS!)
JWT_SECRET            Random string (REQUIRED for production)
DB_PATH               /data/infoboard.db
UPLOAD_DIR            /data/uploads
POST_CACHE_TTL        300000 (5 minutes)
```

## Upgrade Procedure

1. Build new image: `docker build -t infoboard:2.0.0 .`
2. Update deployment image in k8s/deployment.yaml
3. Apply: `kubectl apply -f k8s/deployment.yaml`
4. Kubernetes will perform rolling update

## Support & Documentation

- See README.md for API documentation
- Check logs for detailed error messages
- Database schema in src/db/schema.sql
