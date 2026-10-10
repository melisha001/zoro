# Zoro English Academy Application

A full-stack learning management and academy portal featuring role-based dashboards for **Students**, **Trainers**, and **Administrators**, secure video streaming via Bunny Stream, Flyway database migrations, and React 19 frontend with client-side routing.

---

## System Requirements & Prerequisites

> [!IMPORTANT]
> **Java Version Requirement**:
> The backend requires **JDK 21** (LTS). Java 26 is unsupported by Spring Boot 3.3.4.
> Ensure `java -version` returns Java 21 prior to building or running the service.

- **Backend Runtime**: Java JDK 21, Apache Maven 3.9+
- **Database**: PostgreSQL 15+
- **Frontend Runtime**: Node.js 18+ (LTS recommended), npm 9+

---

## Local Setup

### 1. Database Setup
Create a local PostgreSQL database:
```sql
CREATE DATABASE zoro_academy;
```
Flyway automatically applies all schema migrations (V1 through V17) on application startup. See `MIGRATION_NOTES.md` for migration details (including V15 competition fields, V16 refresh tokens, and V17 enquiry courses).

### 2. Backend Setup (`/backend`)

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Configure local environment variables:
   Copy `run-local.example.ps1` to `run-local.ps1` (which is git-ignored):
   ```powershell
   cp run-local.example.ps1 run-local.ps1
   ```
   Fill in your actual environment variable values in `run-local.ps1`. The script includes fail-fast validation to verify all required variables are set before starting the application.

3. Start the backend:
   ```powershell
   .\run-local.ps1
   ```
   The backend will start at `http://localhost:8080`. Swagger documentation is available at `http://localhost:8080/swagger-ui.html`.

4. Admin Health Check:
   Once running, administrators can verify storage and stream connectivity:
   ```http
   GET http://localhost:8080/api/admin/bunny-health
   ```

### Environment Variables Reference

| Variable Name | Service | Description |
|---|---|---|
| `DB_HOST` | Postgres | PostgreSQL database hostname |
| `DB_PORT` | Postgres | PostgreSQL database port |
| `DB_NAME` | Postgres | Database name |
| `DB_USER` | Postgres | Database user |
| `DB_PASSWORD` | Postgres | Database password |
| `APP_STORAGE_PROVIDER` | Spring | Storage provider implementation (`bunny` or `local`) |
| `BUNNY_STORAGE_HOST` | Bunny | Bunny Storage API host (e.g., storage.bunnycdn.com) |
| `BUNNY_STORAGE_ZONE` | Bunny | Bunny Storage zone name |
| `BUNNY_STORAGE_PASSWORD` | Bunny | Bunny Storage access key / password |
| `BUNNY_STORAGE_CDN_HOST` | Bunny | Pull zone CDN host for Bunny Storage |
| `BUNNY_LIBRARY_ID` | Bunny | Bunny Stream video library ID |
| `BUNNY_API_KEY` | Bunny | Bunny Stream API access key |
| `BUNNY_CDN_HOST` | Bunny | Hostname for streaming video delivery |
| `BUNNY_TOKEN_AUTH_KEY` | Bunny | Bunny Stream token authentication security key |
| `BUNNY_WEBHOOK_SECRET` | Bunny | Secret header/signature for Bunny Stream webhooks |
| `ADMIN_EMAIL` | Spring | Bootstrap administrator account email |
| `ADMIN_PASSWORD` | Spring | Bootstrap administrator account password |
| `JWT_SECRET` | Spring | Secret key for signing and verifying JWT tokens |
| `JWT_EXPIRATION_MS` | Spring | JWT access token validity duration in milliseconds (default: 3600000 = 1 hour) |
| `REFRESH_TOKEN_EXPIRATION_DAYS` | Spring | Refresh token validity in days (default: 7 days) |
| `CORS_ORIGINS` | Spring | Comma-separated list of allowed CORS origins |
| `RAZORPAY_KEY_ID` | Razorpay | Razorpay payment gateway API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay | Razorpay payment gateway API Key Secret |

---

### 3. Frontend Setup (`/frontend`)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   Default `VITE_API_BASE_URL` is configured to `http://localhost:8080/api`.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Verify linting and build:
   ```bash
   npx oxlint
   npm run build
   ```

5. Start local Vite development server:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

---

## Routing & Authentication Behavior

- `/`: Public landing page (`HomePage`). Unauthenticated visitors see the public website with courses, competitions, and enquiry forms.
- `/courses`: Public course catalog (sanitized public views; video IDs, playback URLs, and enrolled-only files are stripped).
- `/competitions`: Public competition showcase.
- `/contact`: Public contact page.
- `/admin/*`: Administrator portal (Protected by role check: `ADMIN`, `SUPER_ADMIN`).
- `/trainer/*`: Trainer portal (Protected by role check: `TRAINER`).
- `/student/*`: Student portal (Protected by role check: `STUDENT`).

### Session & Token Lifecycle
- **Access JWT**: 1 hour validity (`JWT_EXPIRATION_MS=3600000`). Used for authenticating API requests.
- **Refresh Token**: 7 days validity (`REFRESH_TOKEN_EXPIRATION_DAYS=7`). Random opaque 256-bit value stored as a SHA-256 hash in the `refresh_tokens` database table.
- **Rotation & Reuse Detection**: Each call to `/api/auth/refresh` rotates the refresh token (revokes the presented token and issues a new 7-day token). If an already-revoked refresh token is presented (reuse attempt), all refresh tokens for that user are immediately revoked.
- **Revocation**: Logging out (`/api/auth/logout`), deleting or disabling a user account, or resetting/changing passwords immediately revokes all refresh tokens.
- **Storage Note**: Tokens are currently stored in browser `localStorage` (note the XSS trade-off; a future hardening enhancement can migrate refresh tokens to Secure httpOnly SameSite cookies).
- **Navbar Behavior**: Public navigation always displays "Login" and "Enquire Now". Clicking "Login" while already having a valid active session immediately navigates to the user's role-specific dashboard.
- Unauthenticated access to any protected route immediately redirects to the public landing page. Roles are strictly validated from authenticated JWT tokens retrieved via `/api/auth/me` on session restoration.
