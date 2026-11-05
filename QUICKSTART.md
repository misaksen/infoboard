# Infoboard - Quick Start Guide

## 60-Second Setup

### Local Development
```bash
npm install
npm start
# Open http://localhost:3000
# Admin: http://localhost:3000/admin (admin/admin123)
```

### Docker (Recommended)
```bash
docker-compose up
# Open http://localhost:3000
```

### Kubernetes
```bash
kubectl create secret generic infoboard-secret \
  --from-literal=admin-password=secure123 \
  --from-literal=jwt-secret=$(openssl rand -base64 32)

kubectl apply -f k8s/
kubectl port-forward svc/infoboard 3000:80
# Open http://localhost:3000
```

## Common Tasks

### Create a Post via API

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:3000/api/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Announcement" \
  -F "content=Important news" \
  -F "startTime=2024-01-01T09:00:00" \
  -F "endTime=2024-01-01T17:00:00" \
  -F "image=@/path/to/image.jpg"
```

### View Database
```bash
# In container
docker exec infoboard sqlite3 /data/infoboard.db "SELECT * FROM posts;"

# Or Kubernetes
kubectl exec deployment/infoboard -- sqlite3 /data/infoboard.db "SELECT * FROM posts;"
```

## Default Credentials
- **Username**: admin
- **Password**: admin123
- **⚠️ Change in production!**

## Key Files
- `src/server.js` - Main server
- `public/index.html` - Display page
- `public/admin.html` - Admin dashboard
- `k8s/deployment.yaml` - K8s deployment
- `.env.example` - Configuration template

## Important Variables
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key
DB_PATH=/data/infoboard.db
UPLOAD_DIR=/data/uploads
PORT=3000
```

## API Endpoints

**Public**
- `GET /` - Display
- `GET /api/public/posts/active` - Active posts
- `GET /api/public/health` - Health check

**Admin** (requires JWT)
- `POST /api/admin/login` - Login
- `GET /api/admin/posts` - List posts
- `POST /api/admin/posts` - Create post
- `PUT /api/admin/posts/:id` - Update post
- `DELETE /api/admin/posts/:id` - Delete post

## Troubleshooting

**Posts not showing?**
- Check post start_time is in the past
- Check post end_time is in the future

**Can't login?**
- Check ADMIN_USERNAME and ADMIN_PASSWORD
- Verify database exists

**Docker container won't start?**
- Check port 3000 is available
- Check volume permissions
- View logs: `docker logs infoboard`

**K8s pod not running?**
- Check secrets created: `kubectl get secrets -n infoboard`
- Check PVC bound: `kubectl get pvc -n infoboard`
- View logs: `kubectl logs deployment/infoboard -n infoboard`

## Files to Review

1. **README.md** - Full documentation
2. **DEPLOYMENT.md** - Deployment guide
3. **COMPLETED.md** - What's been built
4. **.env.example** - Configuration options

## Ready to Deploy?

See DEPLOYMENT.md for detailed production deployment steps.
