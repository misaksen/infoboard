# Infoboard System

A simple, containerized infoboard system for displaying time-bound posts/announcements. Features an admin dashboard for managing content and a responsive display frontend.

## Features

- 🖥️ **Admin Dashboard** - Create, edit, and delete posts with optional images
- ⏰ **Time-based Display** - Posts automatically show/hide based on start and end times
- 🔐 **Password Protected** - JWT-based authentication for admin access
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🐳 **Docker Ready** - Containerized for easy deployment
- ☸️ **Kubernetes Ready** - Complete K8s manifests included
- 💾 **SQLite Database** - Simple, file-based storage
- 🖼️ **Image Support** - Upload and display images with posts

## Quick Start

### Local Development (Docker Compose)

```bash
# Build and run with docker-compose
docker-compose up

# Access the application
- Display: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: admin / admin123
```

### Local Development (Node.js)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start the server
npm start

# Or use nodemon for development
npm run dev
```

## Configuration

Environment variables (see `.env.example`):

```
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-change-in-production
DB_PATH=./data/infoboard.db
UPLOAD_DIR=./data/uploads
POST_CACHE_TTL=300000
```

## API Endpoints

### Public Endpoints

- `GET /` - Display page (shows active posts)
- `GET /api/public/posts/active` - Get currently active posts
- `GET /api/public/posts/:id` - Get specific post
- `GET /api/public/health` - Health check

### Admin Endpoints (Require JWT Token)

- `POST /api/admin/login` - Login and get JWT token
- `GET /api/admin/posts` - List all posts (paginated)
- `GET /api/admin/posts/:id` - Get post details
- `POST /api/admin/posts` - Create new post (with image upload)
- `PUT /api/admin/posts/:id` - Update post
- `DELETE /api/admin/posts/:id` - Delete post

### Admin Login Example

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","userId":1}
```

### Create Post Example

```bash
curl -X POST http://localhost:3000/api/admin/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Important Announcement" \
  -F "content=This is important" \
  -F "startTime=2024-01-01T09:00:00" \
  -F "endTime=2024-01-01T17:00:00" \
  -F "image=@/path/to/image.jpg"
```

## Docker Deployment

### Build Image

```bash
docker build -t infoboard:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/data \
  -e ADMIN_PASSWORD=securepassword \
  -e JWT_SECRET=supersecret \
  --name infoboard \
  infoboard:latest
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured
- Docker image built and available

### Deploy

```bash
# Create namespace (optional)
kubectl create namespace infoboard
kubectl config set-context --current --namespace=infoboard

# Create Secret with secure credentials
kubectl create secret generic infoboard-secret \
  --from-literal=admin-password=YourSecurePassword \
  --from-literal=jwt-secret=$(openssl rand -base64 32)

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply PVC for data persistence
kubectl apply -f k8s/pvc.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Create Service
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods
kubectl get svc
```

### Access Application

```bash
# Port forward to access locally
kubectl port-forward svc/infoboard 3000:80

# Or configure an Ingress for external access
```

### Check Logs

```bash
kubectl logs -f deployment/infoboard
```

### Update Credentials

```bash
# Generate new Secret
kubectl delete secret infoboard-secret
kubectl create secret generic infoboard-secret \
  --from-literal=admin-password=NewPassword \
  --from-literal=jwt-secret=$(openssl rand -base64 32)

# Restart deployment
kubectl rollout restart deployment/infoboard
```

## Database

SQLite database is stored in `/data/infoboard.db` (or path specified in `DB_PATH`).

### Database Schema

**Posts Table:**
- `id` - Primary key
- `title` - Post title
- `content` - Post content
- `image_path` - Path to uploaded image
- `start_time` - When post becomes visible
- `end_time` - When post becomes hidden
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `active` - Whether post is active

**Admin Users Table:**
- `id` - Primary key
- `username` - Admin username
- `password_hash` - Bcrypt hashed password
- `created_at` - Creation timestamp

## File Upload

Images are stored in `/data/uploads/` with the format: `{timestamp}-{original-filename}`

Allowed formats: JPEG, PNG, GIF, WebP
Max size: 5MB

## Frontend Features

### Display Page
- Shows all currently active posts
- Auto-refreshes every 30 seconds (configurable)
- Navigate between posts with previous/next buttons or arrow keys
- Responsive design
- Real-time post indicator (e.g., "1 / 3")

### Admin Dashboard
- Secure login
- Create posts with title, content, optional image, and time window
- View all posts with pagination
- Edit existing posts
- Delete posts
- Search posts
- Image preview

## Security Considerations

### For Production

1. **Change Default Credentials**
   ```bash
   # Update ADMIN_PASSWORD environment variable
   # Generate new JWT_SECRET using openssl
   openssl rand -base64 32
   ```

2. **Enable HTTPS**
   - Use a reverse proxy (Nginx, Traefik)
   - Or use K8s Ingress with TLS

3. **Database Backup**
   - Regularly backup `/data/infoboard.db`
   - Store in separate location

4. **Rate Limiting**
   - Consider adding rate limiting middleware to admin endpoints

5. **Input Validation**
   - All inputs are sanitized on both backend and frontend

## Troubleshooting

### Can't login
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables
- Verify database is initialized: `ls -la data/infoboard.db`

### Posts not showing
- Check post's start_time and end_time
- Verify post's `active` flag is 1
- Check server timezone settings

### Image upload fails
- Check `/data/uploads/` directory permissions
- Verify image size is under 5MB
- Ensure image format is supported

### K8s deployment fails
- Check resource limits and available cluster resources
- Verify PVC is bound: `kubectl get pvc`
- Check pod logs: `kubectl logs pod/infoboard-xxxx`

## Development

### Project Structure

```
infoboard/
├── src/
│   ├── server.js           # Main Express server
│   ├── db/
│   │   ├── init.js         # Database initialization
│   │   └── schema.sql      # Database schema
│   ├── routes/
│   │   ├── admin.js        # Admin API endpoints
│   │   └── public.js       # Public API endpoints
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── errorHandler.js # Error handling
│   └── utils/
│       └── jwt.js          # JWT utilities
├── public/
│   ├── index.html          # Display frontend
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   ├── display.css
│   │   └── admin.css
│   └── js/
│       ├── display.js
│       └── admin.js
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── pvc.yaml
│   ├── configmap.yaml
│   └── secret.yaml
├── data/                   # Volume mount point
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

### Adding Features

1. Create new route file in `src/routes/`
2. Add route handlers
3. Import in `src/server.js`
4. Test with curl or frontend

## License

MIT

## Support

For issues or feature requests, please create an issue in the repository.
