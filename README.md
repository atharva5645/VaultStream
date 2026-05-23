# VaultStream 🎬
### Multi-Tenant Video Platform with Real-Time Processing & AI Sensitivity Analysis

> *"Upload. Process. Stream. Manage — all in one secure, tenant-aware video platform."*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Overview

**VaultStream** is a full-stack, multi-tenant video management platform designed for organizations that need to host, control, and moderate internal or public video content at scale. Users upload videos through a drag-and-drop interface, the server processes them asynchronously with real-time Socket.io progress events, and an AI sensitivity pipeline flags potentially inappropriate content before it ever reaches viewers.

The platform solves a critical gap for teams managing internal training libraries, compliance recordings, or content networks — where raw cloud storage isn't enough and you need role-gating, organization-level isolation, moderation tooling, and live upload feedback in one coherent product.

It targets three distinct user personas: **Viewers** who browse and watch approved content, **Editors** who upload and manage their organization's video library, and **Admins** who govern the entire platform — users, tenants, moderation queues, and system settings — from a dedicated control center.

---

## ✨ Features

### 📤 Upload & Processing Pipeline
- **Drag-and-drop + file picker upload** in `UploadDropzone.jsx` with instant preview generation
- **Client-side video validation** via `useVideoValidation.js` — enforces MP4/WebM/QuickTime MIME types, 2GB max size, and 2-hour duration limit using a hidden `<video>` element to read metadata before any bytes leave the browser
- **Automatic thumbnail capture** at 15% into the video duration using Canvas API at the moment of validation — no server round-trip needed
- **Concurrent upload queue** managed by `useUploadQueue.js` with per-file progress tracking, ETA calculation (`formatEta`), speed in bytes/sec, and individual abort controllers for mid-upload cancellation
- **Multer UUID renaming** — filenames are rewritten to `uuid4().mp4` on disk to prevent collisions, while the original name is preserved in MongoDB
- **Async server-side processing** — after the HTTP upload responds `201`, `processVideoAsync` runs fire-and-forget: 5 simulated analysis steps over 10 seconds with per-step Socket.io progress events, culminating in AI sensitivity classification

### 📡 Real-Time Updates via Socket.io
- User-private socket rooms: each user joins `user_<userId>` on connect via `join-user-room` event
- Six distinct lifecycle events emitted server-to-client: `upload-started`, `upload-progress`, `processing-started`, `processing-progress`, `processing-completed`, `new-notification`
- `SocketContext.jsx` handles all socket lifecycle — connection, reconnection toasts, event dispatch, and auto-refresh of user profile after role-change notifications
- `OfflineBanner.jsx` reacts to `navigator.onLine` changes with a sticky amber warning bar when connectivity drops

### 🎞️ Video Streaming
- HTTP Range Request streaming in `streamController.js` — serves 1MB chunks using `206 Partial Content` with `Content-Range`, `Accept-Ranges`, and 1-hour `Cache-Control` headers
- Zero-buffering: `fs.createReadStream(videoPath, { start, end })` pipes directly to the response, no file is loaded into memory
- Separate public endpoints (`GET /api/videos/public` and `GET /api/videos/public/:id`) serve only `status: completed` + `sensitivity: safe` videos without authentication
- Custom `VideoPlayer.jsx` with full keyboard control: `Space`/`K` to play/pause, `F` for fullscreen, `M` to mute, `←`/`→` for 5-second seek, auto-hiding controls on inactivity

### 🏢 Multi-Tenant Architecture
- Every video and user carries a `tenantId` (MongoDB ObjectId ref to the `Tenant` collection)
- `tenantMiddleware.js` attaches `req.tenantId` from the authenticated user on every protected route
- `buildTenantFilter()` enforces data isolation: tenant users see only their organization's videos; users without a tenant see only their own uploads — no cross-tenant data leakage possible at the query level
- `TenantContext.jsx` on the frontend provides workspace switching, member management, invite tracking, and workspace creation (currently backed by seed data, ready for API wiring)

### 🛡️ Role-Based Access Control
- Three roles defined in `database/constants/roles.js`: `admin` (all permissions), `editor` (upload, edit own, view all), `viewer` (view own only)
- `authMiddleware.js` exports two middleware: `protect` (JWT Bearer verification) and `authorize(...roles)` (role enforcement per route)
- Frontend `RoleGuard` wraps route subtrees with `allowedRoles` arrays — unauthorized users land on `/unauthorized`, not a blank screen
- **Editor upgrade flow**: viewers can request editor access (`editorRequestStatus: 'pending'`); admins approve/reject via `adminController.js`, which triggers a real-time Socket.io notification to the user and auto-refreshes their role in the frontend without logout

### 🤝 Admin Control Center
- **Admin Dashboard** — KPI cards (uploads, storage, active streams, flagged count), upload velocity bar chart, activity feed, tenant health table
- **User Management** — full CRUD table: suspend/activate, role assignment, search and filter
- **Tenant Management** — create organizations, assign users, per-tenant analytics
- **Moderation Panel** — flagged video queue with approve/reject/review-score actions; three-counter summary header
- **Analytics Dashboard** — upload trends, storage usage, active stream graphs
- **System Settings** — platform controls and security configuration
- **Processing Dashboard** — live view of videos currently in the processing pipeline

### ⚙️ Developer Experience
- `Ctrl+K` / `Cmd+K` command palette (`CommandPalette.jsx`) for keyboard-first navigation — role-aware command list dynamically built from current user's role
- `Ctrl+J` global dark/light theme toggle via `useTheme.js`
- `useKeyboardShortcuts.js` — composable shortcut registration, prevents conflicts with input fields
- Axios interceptor in `api/axios.js` handles 401 → auto-logout and redirect, 403 logging, and network error detection centrally
- `ErrorBoundary.jsx` wraps pages for graceful per-route failure isolation
- Skeleton loaders in `Skeleton.jsx` and `SuspenseFallback.jsx` for every async route

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | Core UI framework with Concurrent features |
| Vite 8 | Build tool and dev server |
| React Router v7 | Client-side routing with lazy-loaded pages |
| Tailwind CSS 3.4 | Utility-first styling |
| Framer Motion 12 | Page transitions and animations on Landing |
| Socket.io Client 4 | Real-time upload/processing event subscription |
| Axios | HTTP client with request/response interceptors |
| Lucide React | Icon library |
| React Hot Toast | Toast notification system |
| @fontsource/geist-sans | Geist Sans typeface for UI |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 (ESM) | REST API server with ES Module syntax throughout |
| Socket.io 4 | WebSocket server for real-time event emission |
| Multer 2 | Multipart video file upload with UUID filename rewriting |
| Mongoose 9 | MongoDB ODM with schema validation and pre-save hooks |
| bcrypt 6 | Password hashing with salt rounds |
| jsonwebtoken 9 | JWT generation and verification |
| Helmet 8 | HTTP security headers (with `crossOriginResourcePolicy: false` for video serving) |
| express-rate-limit | Route-level rate limiting |
| express-validator | Input validation middleware |
| fluent-ffmpeg | Video metadata extraction (installed, ready for real processing) |
| uuid 14 | Collision-free filename generation |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Hosted NoSQL document database |
| Mongoose Schema Indexes | Text index on `title`+`description` for search; status and userId indexes for query performance |
| TTL Index on Sessions | Automatic session expiry via `expiresAt` field |
| Local disk storage | Video files stored in `backend/src/uploads/videos/` |

### Dev Tooling
| Technology | Purpose |
|---|---|
| nodemon | Auto-restart backend on file changes |
| ESLint | Frontend code linting |
| concurrently | Run frontend + backend with a single `npm run dev` from root |

---

## 🏗️ Architecture / How It Works

```
[Browser — React 19 SPA]
        │
        ├── HTTP (Axios + JWT Bearer)  ──────────────▶ [Express 5 REST API]
        │                                                      │
        └── WebSocket (Socket.io Client) ◀──────────────────── │
                                                               │
                                              ┌────────────────┴───────────────┐
                                              │   Middleware Chain              │
                                              │   Helmet → CORS → JSON parse   │
                                              │   → protect (JWT) → authorize  │
                                              │   → resolveTenant              │
                                              └────────────────┬───────────────┘
                                                               │
                         ┌─────────────────────────────────────┼─────────────────────┐
                         │                                     │                     │
                    [videoController]                  [authController]        [adminController]
                         │                                     │                     │
                    [Multer Upload]                     [bcrypt + JWT]         [Role Approval]
                         │                                     │                     │
                    [MongoDB via Mongoose] ◀──────────────────────────────────────────┘
                         │
                    [processVideoAsync] ──── fire-and-forget ──── Socket.io events
                         │                                               │
                    [Video file on disk]                        [user_<id> room]
                         │                                               │
                    [streamController]  ──── HTTP Range Requests ──▶ [VideoPlayer.jsx]
```

### Key Data Flows

**Video Upload → Processing → Viewer:**
1. Editor selects files; `useVideoValidation.js` reads duration/MIME type client-side via a hidden `<video>` element and captures a thumbnail from the Canvas API
2. `useUploadQueue.js` calls `POST /api/videos/upload` with `multipart/form-data`; Multer saves to disk with a UUID filename
3. Server responds `201` immediately; `processVideoAsync(io, userId, videoId)` runs in the background
4. Five Socket.io `processing-progress` events fire over 10 seconds to the uploader's private room (`user_<userId>`)
5. After processing, `sensitivity` is set to `safe` or `flagged` (80/20 probability simulation); `processing-completed` event fires
6. Viewer fetches via `GET /api/videos/:id`; browser's native range request triggers `GET /api/videos/stream/:id` with a `Range` header; server returns `206 Partial Content` in 1MB chunks

**Role Upgrade Flow:**
1. Viewer submits an editor access request → sets `editorRequestStatus: 'pending'` on the User document
2. Admin sees the request in the Users panel, clicks Approve
3. `PUT /api/admin/editor-requests/:id/approve` sets `role: 'editor'`, creates a `Notification` document, emits `new-notification` via Socket.io to the user's room
4. `SocketContext.jsx` intercepts `new-notification` events that mention "Granted" or "Access", calls `GET /api/auth/me`, and updates the auth store without requiring the user to log out

**Tenant Data Isolation:**
- Every `GET /api/videos` request passes through `protect` → `resolveTenant` → `buildTenantFilter(req)`
- If `req.tenantId` exists: `filter = { tenantId: req.tenantId }` — all org members share a video pool
- If no tenant: `filter = { uploadedBy: req.user._id }` — individual user sees only their own uploads
- Admin endpoints bypass tenant filters entirely (no `resolveTenant` middleware applied)

---

## 📂 Folder Structure

```
VaultStream/
├── package.json                        # Root monorepo — concurrently runs both servers
│
├── backend/
│   ├── src/
│   │   ├── server.js                   # Entry: HTTP server + Socket.io init + DB connect
│   │   ├── app.js                      # Express app: Helmet, CORS, routes, static /uploads
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose connection with production error handling
│   │   ├── controllers/
│   │   │   ├── videoController.js      # Upload, CRUD, public endpoints, admin overrides
│   │   │   ├── streamController.js     # HTTP Range Request streaming (206 Partial Content)
│   │   │   ├── authController.js       # Register, login, profile fetch, editor request
│   │   │   ├── adminController.js      # Editor request approval/rejection with real-time notify
│   │   │   ├── dashboardController.js  # Aggregated stats for role-specific dashboards
│   │   │   └── notificationController.js # Fetch and mark-read notifications
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # protect (JWT verify) + authorize (role check)
│   │   │   ├── tenantMiddleware.js     # resolveTenant + buildTenantFilter for data isolation
│   │   │   ├── uploadMiddleware.js     # Multer: UUID rename, MP4-only filter, 500MB limit
│   │   │   ├── errorMiddleware.js      # Global error handler with status code pass-through
│   │   │   └── notFoundMiddleware.js   # 404 catch-all
│   │   ├── models/
│   │   │   ├── Video.js                # Video schema: title, path, tenantId, status, sensitivity
│   │   │   ├── User.js                 # User schema: role, tenantId, editorRequestStatus, bcrypt hooks
│   │   │   ├── Tenant.js               # Tenant schema: name, slug, isActive
│   │   │   └── Notification.js         # Notification schema: userId, title, message, type, read
│   │   ├── routes/
│   │   │   ├── index.js                # Mounts all route modules under /api
│   │   │   ├── videoRoutes.js          # /videos — CRUD + public endpoints
│   │   │   ├── streamRoutes.js         # /videos/stream/:id — range streaming
│   │   │   ├── authRoutes.js           # /auth — register, login, me, editor request
│   │   │   ├── adminRoutes.js          # /admin — editor requests, user management
│   │   │   ├── dashboardRoutes.js      # /dashboard — role-specific stats
│   │   │   └── notificationRoutes.js   # /notifications — fetch + mark read
│   │   ├── services/
│   │   │   └── videoProcessor.js       # Async processing pipeline with Socket.io progress + AI sim
│   │   ├── sockets/
│   │   │   └── socketHandler.js        # Room management + all emit helper functions
│   │   ├── utils/
│   │   │   └── jwt.js                  # generateToken + verifyToken wrappers
│   │   └── uploads/
│   │       └── videos/                 # Disk storage for uploaded video files
│   ├── generateDb.js                   # One-time DB seed script
│   ├── updateAdmin.js                  # Utility to promote a user to admin role
│   └── .env.example
│
├── database/                           # Standalone schema/repository layer (reference/shared)
│   ├── schemas/                        # Mongoose schemas with full validation
│   ├── models/                         # Model exports for shared use
│   ├── repositories/                   # Data access functions (findByUserId, etc.)
│   ├── constants/
│   │   ├── roles.js                    # ROLES enum + ROLE_PERMISSIONS map
│   │   └── statuses.js                 # VIDEO_STATUSES + PROCESSING_STEPS enums
│   ├── migrations/                     # One-time DB migration scripts
│   ├── seeders/                        # Admin, role, and demo data seeders
│   ├── aggregation/                    # MongoDB aggregation pipeline definitions
│   ├── transactions/                   # Multi-document atomic transactions
│   └── validators/                     # Input validation schemas
│
└── frontend/
    ├── src/
    │   ├── App.jsx                     # Root router: lazy pages, RoleGuard, shortcuts, socket wrap
    │   ├── api/
    │   │   └── axios.js                # Axios instance: baseURL, JWT interceptor, 401 auto-logout
    │   ├── context/
    │   │   ├── AuthContext.jsx         # Auth state: user, role, token, login/logout
    │   │   ├── SocketContext.jsx       # Socket lifecycle, STAGES, queue state, event handlers
    │   │   ├── NotificationContext.jsx # Bell notifications + floating toast queue
    │   │   ├── TenantContext.jsx       # Workspace switching, member/invite/workspace management
    │   │   └── UploadQueueContext.jsx  # Upload queue global provider
    │   ├── hooks/
    │   │   ├── useUploadQueue.js       # Multi-file queue: progress, ETA, speed, abort control
    │   │   ├── useVideoValidation.js   # Client-side file validation + thumbnail capture
    │   │   ├── useVideoPlayer.js       # Video player state: play/pause/seek/volume/fullscreen
    │   │   ├── useVideoLibraryFilters.js # Search, filter, sort, paginate the video library
    │   │   ├── useKeyboardShortcuts.js # Composable keyboard shortcut registration
    │   │   ├── useDebouncedValue.js    # Debounce hook for search inputs
    │   │   └── useTheme.js             # Dark/light toggle with localStorage persistence
    │   ├── components/
    │   │   ├── video/VideoPlayer.jsx   # Full-featured player with keyboard shortcuts, auto-hide controls
    │   │   ├── upload/                 # UploadDropzone, UploadCard, UploadQueue, UploadProgress, ValidationAlert
    │   │   ├── filters/                # SearchBar, FilterDrawer, FilterChip, SortDropdown, PaginationControls
    │   │   ├── feedback/               # NotificationCenter, OfflineBanner, ToastProvider, ErrorBoundary, EmptyState
    │   │   ├── tenant/                 # InviteModal, TeamTable, TenantSwitcher, WorkspaceCard
    │   │   ├── system/
    │   │   │   └── CommandPalette.jsx  # Ctrl+K role-aware navigation palette
    │   │   ├── auth/                   # ProtectedRoute, RoleGuard, AuthGateModal
    │   │   └── admin/                  # AdminShell, StatCard, AdminTable, SimpleBarChart, ActivityFeedCard
    │   ├── pages/
    │   │   ├── LandingPage.jsx         # Public marketing page with Framer Motion animations
    │   │   ├── PublicLibrary.jsx       # /browse — unauthenticated public video browsing
    │   │   ├── viewer/                 # ViewerDashboard, MyVideos, WatchVideo
    │   │   ├── editor/                 # EditorDashboard, Library, UploadVideo, WorkspaceSettings
    │   │   └── admin/                  # AdminDashboard, ManageUsers, ManageTenants, ManageVideos, Moderation, AnalyticsDashboard, ProcessingDashboard, SystemSettings
    │   ├── layouts/                    # ViewerLayout, EditorLayout, AdminLayout, EditorLayout, ViewerLayout
    │   └── data/                       # adminMockData.js, tenantMockData.js — seed data for prototyping
    └── .env.example
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** `>= 18.x` (ESM support required)
- **npm** `>= 9.x`
- A **MongoDB Atlas** cluster (or local MongoDB `>= 6.x`)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/VaultStream.git
cd VaultStream
```

### 2. Install All Dependencies

Install root, frontend, and backend dependencies in one command:

```bash
npm run install:all
```

### 3. Configure Environment Variables

**Backend:**
```bash
cp backend/.env.example backend/.env
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```

Edit both files — see the [Environment Variables](#-environment-variables) section below.

### 4. Seed the Database

Create the initial admin user and seed roles:

```bash
cd backend
node generateDb.js
```

This runs the admin seeder and role seeder to create a usable starting state. If you need to promote an existing user to admin:

```bash
node updateAdmin.js
```

### 5. Create the Upload Directory

Make sure the upload folder exists (it has a `.gitkeep` but verify):

```bash
mkdir -p backend/src/uploads/videos
mkdir -p backend/src/uploads/frames
mkdir -p backend/src/temp
```

### 6. Run the Project

**Run both frontend and backend concurrently from the root:**

```bash
npm run dev
```

Or run separately:

```bash
# Backend (port 5000)
npm run dev --prefix backend

# Frontend (port 5173)
npm run dev --prefix frontend
```

### 7. Build for Production

```bash
npm run build
```

Outputs the frontend bundle to `frontend/dist/`. The backend is Node.js and requires no build step.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port for the Express/Socket.io server | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.mongodb.net/vaultstream` |
| `JWT_SECRET` | Secret key for signing/verifying JWTs | `a_long_random_string_here` |
| `JWT_EXPIRES_IN` | JWT token lifespan | `7d` |
| `ADMIN_EMAIL` | Email for the seeded admin account | `admin@yourorg.com` |
| `ADMIN_PASSWORD` | Password for the seeded admin account | `Admin123!` |

> The `UPLOAD_PATH` and `MAX_FILE_SIZE` environment variables are referenced in `uploadMiddleware.js` but not listed in `.env.example`. Add them if you need to override the defaults (`./uploads` and `500MB` respectively).

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL to the backend REST API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Base URL for Socket.io connection (no `/api` suffix) | `http://localhost:5000` |

---

## 🧪 Usage

### As a Viewer

1. Register at `/register` — accounts default to the `viewer` role
2. Browse public content without logging in at `/browse`
3. Log in and go to `/viewer/dashboard` to see your personal video feed
4. Watch any video at `/viewer/watch/:id` — keyboard shortcuts: `Space` play/pause, `F` fullscreen, `M` mute, `←`/`→` 5-second seek
5. To access upload features, request editor access from `/viewer/settings` — an admin must approve it

### As an Editor

1. Log in with an editor or admin account and navigate to `/editor/dashboard`
2. Go to `/editor/upload` — drag and drop or select video files (MP4, WebM, or QuickTime, up to 2GB, up to 2 hours)
3. Watch the upload queue for per-file progress, ETA, and speed — cancel individual uploads anytime
4. After upload, the video enters the processing pipeline — a real-time progress bar appears as the server analyses the content
5. Once processing completes, check the video's sensitivity status in `/editor/library`:
   - `safe` — approved for viewing
   - `flagged` — routed to admin moderation queue
6. Filter, search, sort, and paginate the library; delete videos with the context menu

### As an Admin

1. Log in via `/admin/login` and navigate to `/admin/dashboard`
2. Review KPI cards and the upload velocity trend chart
3. Manage users at `/admin/users` — suspend, activate, and assign roles
4. Review and approve/reject editor upgrade requests (users are notified live via Socket.io)
5. Handle flagged content at `/admin/moderation` — approve, reject, or flag for score review
6. Monitor tenants at `/admin/tenants` — create organizations and review health metrics
7. View processing pipeline status at `/admin/processing`

### Keyboard Shortcuts (Global)

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `Ctrl+J` / `Cmd+J` | Toggle dark/light theme |

### Keyboard Shortcuts (Video Player)

| Key | Action |
|---|---|
| `Space` or `K` | Play / Pause |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `→` | Seek forward 5 seconds |
| `←` | Seek back 5 seconds |

---

## 📸 Screenshots / Demo

> Add screenshots to `frontend/public/` and link them below.

| View | Description |
|---|---|
| Landing Page | `/` — Framer Motion hero with floating dashboard mockup |
| Public Library | `/browse` — unauthenticated browsable video grid |
| Editor Upload | `/editor/upload` — dropzone + queue with live progress |
| Video Player | `/watch/:id` — custom player with keyboard controls |
| Admin Dashboard | `/admin/dashboard` — KPI cards, velocity chart, tenant health |
| Moderation Queue | `/admin/moderation` — flagged content review table |

**Recommended screenshot tools:**
- [Loom](https://loom.com) for a full walkthrough video
- [CleanShot X](https://cleanshot.com/) (macOS) or [ShareX](https://getsharex.com/) (Windows) for annotated stills

---

## 🚧 Challenges & Learnings

### 1. Fire-and-Forget Async Processing Without a Job Queue
The video processing pipeline runs with `processVideoAsync(io, userId, videoId)` called directly after the HTTP response is sent — no message queue (BullMQ, Redis) involved. This keeps the architecture simple but means if the Node.js process crashes mid-processing, the video's status stays `processing` forever with no retry mechanism. The `fluent-ffmpeg` dependency is installed and ready; wiring it to real frame extraction is the natural next step.

**Learning:** For production video pipelines, fire-and-forget works for demos but real systems need idempotent job queues with retry logic and a dead-letter channel for stuck videos.

### 2. Helmet's `crossOriginResourcePolicy` Conflicting with Video Streaming
Helmet's default `crossOriginResourcePolicy: 'same-origin'` blocked the browser from loading video files served from `/uploads` when the frontend ran on a different origin (e.g., Vite dev server on port 5173, Express on 5000). The fix required disabling it explicitly: `helmet({ crossOriginResourcePolicy: false })` — a subtle, hard-to-Google error that manifested as a silent failed `<video>` load with no network error in DevTools.

**Learning:** Helmet's security defaults are excellent for API responses but need targeted overrides for static media assets served cross-origin.

### 3. Socket.io URL Stripping for the Client Connection
`SocketContext.jsx` strips the `/api` suffix from `VITE_API_URL` before connecting: `rawUrl.replace(/\/api\/?$/, '')`. Without this, `socket.io-client` would try to perform its handshake at `http://localhost:5000/api/socket.io/` instead of `http://localhost:5000/socket.io/`, silently failing to connect. This pattern needs to be documented clearly for anyone configuring a new deployment target.

**Learning:** Socket.io and REST APIs share the same HTTP server but different URL namespaces — the client env var for REST and WebSocket should ideally be separate (they are, via `VITE_SOCKET_URL`), but the stripping fallback adds resilience.

### 4. Client-Side Thumbnail Capture Before Upload
Capturing a thumbnail at 15% into the video duration requires seeking a hidden `<video>` element, waiting for the `seeked` event, then drawing a frame to a `<canvas>`. The tricky part: `video.duration` is `NaN` until `loadedmetadata` fires, and `onseeked` can fire before the canvas context is ready. The `useVideoValidation.js` hook chains these events carefully with a `cleanup()` function that revokes the object URL to prevent memory leaks regardless of success or failure.

**Learning:** Browser media APIs are event-driven with subtle ordering guarantees — always clean up `URL.createObjectURL` results, especially in validation flows that may reject a file after metadata is read.

### 5. Tenant Feature Is Partially Implemented
The multi-tenant architecture is fully wired on the backend (`tenantId` on every Video and User, `buildTenantFilter`, `Tenant` model) and the frontend has `TenantContext.jsx` with a `TenantSwitcher` component. However, the tenant-specific routes in `App.jsx` (`/editor/tenant`, `/editor/team`, `/editor/invites`) are commented out, and `TenantContext` is seeded from `tenantMockData.js` rather than the API. The foundation is solid and the backend is ready — it's a frontend wiring task.

---

## 🔮 Future Improvements

- **Real FFmpeg processing** — Replace the simulated `processVideoAsync` sleep loop with actual `fluent-ffmpeg` frame extraction, resolution detection, duration parsing, and thumbnail generation from the extracted frames (the `uploads/frames/` directory already exists for this)
- **BullMQ / Redis job queue** — Move video processing off the Node.js event loop into a proper worker queue with retry logic, concurrency limits, and a dead-letter queue for stuck jobs
- **Real AI sensitivity analysis** — Replace the random 80/20 classification with a call to a Vision AI API (Google Video Intelligence, AWS Rekognition, or a self-hosted NSFW classifier) using the extracted frames
- **Complete tenant API wiring** — Connect `TenantContext.jsx` to real API endpoints (`POST /api/tenants`, `GET /api/tenants/:id/members`, `POST /api/tenants/:id/invite`) and remove the `tenantMockData.js` seed dependency
- **HLS/DASH adaptive streaming** — Convert uploaded MP4s to HLS segments with FFmpeg during processing; serve via `.m3u8` manifests for adaptive bitrate streaming instead of single-file range requests
- **S3 / Cloud Storage** — Replace local disk storage (`backend/src/uploads/`) with S3-compatible object storage (AWS S3, Cloudflare R2, MinIO) for horizontal scaling and CDN delivery
- **Session management via TTL index** — The `sessionSchema.js` already defines a MongoDB TTL index on `expiresAt` for automatic session cleanup; wire this to a `POST /auth/logout` endpoint that invalidates the specific session token
- **Video analytics per viewer** — The `Analytics` schema in `database/schemas/analyticsSchema.js` exists but no views/watch-time events are being written; wiring up per-play events would enable the Analytics Dashboard to show real data

---

## 🤝 Contributing

Contributions are welcome. Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/your-feature-name`
3. **Commit using Conventional Commits**: `git commit -m 'feat(upload): add resumable upload support'`
   - Prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`
4. **Push your branch**: `git push origin feat/your-feature-name`
5. **Open a Pull Request** describing what changed and why

### Code Standards

- Backend uses ES Modules (`import`/`export`) throughout — do not mix with CommonJS `require()`
- Every new route must pass through `protect` middleware; add `authorize('admin')` for admin-only endpoints
- Frontend uses ESLint — run `npm run lint` from the `frontend/` directory before pushing
- New React components go in the appropriate subdirectory under `src/components/` following the existing domain groupings (upload, video, filters, feedback, admin, tenant, auth)

### Good First Issues

- Wire `TenantContext.jsx` fetch functions to real backend endpoints and remove `tenantMockData.js`
- Implement `POST /api/auth/logout` to invalidate the current JWT session in the `Session` collection
- Add `GET /api/videos/:id/analytics` endpoint to record and retrieve per-video view counts
- Write unit tests for `buildTenantFilter()` in `tenantMiddleware.js` using Jest or Vitest
- Add the `UPLOAD_PATH` and `MAX_FILE_SIZE` variables to `.env.example` with documentation

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 VaultStream Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

Built for teams that take their video content seriously.

**[⬆ Back to Top](#vaultstream-)**

</div>
