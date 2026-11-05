# Infoboard System - Implementation Plan

## Project Overview
A simple, containerized infoboard system that allows an admin to create time-bound posts (text + optional images) and display them on a browser-based frontend with toggle functionality for multiple messages.

## Architecture

### Tech Stack
- **Backend**: Node.js + Express (lightweight, easy to containerize)
- **Database**: SQLite (simple, file-based, no additional services needed)
- **Frontend**: HTML/CSS/JavaScript (vanilla, minimal dependencies)
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Storage**: Volume mounts for SQLite DB and uploaded images

### High-Level Architecture
```
┌─────────────────┐
│   K8s Cluster   │
├─────────────────┤
│  Infoboard Pod  │
│  ┌───────────────────────────┐
│  │ Express Server (Node.js)  │
│  │ - Admin API               │
│  │ - Public Display API      │
│  ├───────────────────────────┤
│  │ Frontend (Static Files)   │
│  │ - Display Page            │
│  │ - Admin Page              │
│  └───────────────────────────┤
│  │ SQLite Database           │
│  │ - Posts Table             │
│  │ - User Credentials        │
│  └───────────────────────────┘
│  Volumes:
│  - /data/db (SQLite file)
│  - /data/uploads (Images)
└─────────────────┘
```

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_path TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1
);
```

### Admin Credentials Table
```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Public Endpoints (No Auth)
- `GET /api/posts/active` - Get currently active posts (within time window)
- `GET /api/posts/:id` - Get specific post details
- `GET /` - Serve frontend display page

### Admin Endpoints (Password Protected)
- `POST /api/admin/login` - Admin login (returns JWT or session token)
- `GET /api/admin/posts` - List all posts (paginated)
- `POST /api/admin/posts` - Create new post (with image upload)
- `PUT /api/admin/posts/:id` - Update post
- `DELETE /api/admin/posts/:id` - Delete post
- `GET /admin` - Serve admin dashboard page

## File Structure

```
infoboard/
├── src/
│   ├── server.js              # Express server entry point
│   ├── db/
│   │   ├── init.js            # Database initialization
│   │   └── schema.sql         # Database schema
│   ├── routes/
│   │   ├── public.js          # Public API routes
│   │   ├── admin.js           # Admin API routes
│   │   └── auth.js            # Authentication middleware
│   ├── middleware/
│   │   ├── auth.js            # Auth verification
│   │   └── errorHandler.js    # Error handling
│   └── utils/
│       ├── jwt.js             # JWT token management
│       └── imageUpload.js     # Image upload handling
├── public/
│   ├── index.html             # Display frontend
│   ├── admin.html             # Admin dashboard
│   ├── css/
│   │   ├── display.css        # Display page styles
│   │   └── admin.css          # Admin page styles
│   └── js/
│       ├── display.js         # Display page logic
│       └── admin.js           # Admin page logic
├── data/                      # Volume mount point
│   ├── infoboard.db           # SQLite database
│   └── uploads/               # Uploaded images
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Local development
├── k8s/
│   ├── deployment.yaml        # K8s deployment
│   ├── service.yaml           # K8s service
│   ├── pvc.yaml              # Persistent volume claim
│   └── configmap.yaml         # Configuration
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## Implementation Phases

### Phase 1: Backend Core
1. Initialize Node.js project with Express
2. Set up SQLite database with schema
3. Create database initialization script
4. Implement JWT authentication
5. Create admin login endpoint
6. Test with Postman/curl

### Phase 2: Admin API
1. Create post CRUD endpoints
2. Implement image upload handling
3. Add validation (time windows, required fields)
4. Add error handling
5. Add logging

### Phase 3: Public API
1. Create `/api/posts/active` endpoint
2. Implement time-based filtering
3. Pagination support
4. Add caching headers

### Phase 4: Frontend - Display
1. Create responsive HTML layout
2. Implement post fetching and display
3. Add toggle/carousel functionality for multiple posts
4. Add auto-refresh capability
5. Style with CSS

### Phase 5: Frontend - Admin Dashboard
1. Create admin HTML page
2. Implement login form
3. Add post creation form with image upload
4. Add post list with edit/delete
5. Style with CSS
6. Add client-side validation

### Phase 6: Docker
1. Create Dockerfile
2. Create docker-compose.yml for local testing
3. Set up volume mounts for data persistence
4. Test locally with Docker

### Phase 7: Kubernetes
1. Create K8s deployment manifest
2. Create K8s service (ClusterIP)
3. Create PersistentVolumeClaim for data
4. Create ConfigMap for configuration
5. Create ingress rules (optional)
6. Document deployment steps

### Phase 8: Testing & Documentation
1. Write README with setup instructions
2. Document API endpoints
3. Create deployment guide for K8s
4. Test end-to-end flow

## Key Features & Considerations

### Security
- Password hashing (bcrypt) for admin credentials
- JWT tokens with expiration for session management
- CORS configuration for frontend
- Input validation on all endpoints
- Rate limiting on admin endpoints (optional)

### Performance
- Cache active posts (5-min TTL)
- Lazy load images
- Minify frontend assets
- SQLite index on start_time, end_time

### User Experience
- Auto-refresh display (configurable interval)
- Image preview in admin dashboard
- Date/time picker for post scheduling
- Timezone handling
- Responsive design

### Deployment
- Single container, all-in-one solution
- Persistent volumes for data
- Health check endpoint (`GET /health`)
- Graceful shutdown handling
- Environment variable configuration

## Configuration Variables

```
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypted>
JWT_SECRET=<random-secret>
DB_PATH=/data/infoboard.db
UPLOAD_DIR=/data/uploads
REFRESH_INTERVAL=30000 (milliseconds)
POST_CACHE_TTL=300000 (5 minutes)
```

## Success Criteria

- ✅ Admin can login with password
- ✅ Admin can create posts with text and optional image
- ✅ Admin can set start/end times
- ✅ Admin can edit/delete posts
- ✅ Frontend displays currently active posts
- ✅ Frontend toggles between multiple posts
- ✅ App runs in Docker container
- ✅ App deploys to Kubernetes
- ✅ Data persists across container restarts

## Next Steps

1. Initialize project structure
2. Set up Git repository
3. Begin Phase 1 implementation
