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
Flyway automatically applies all schema migrations (V1 through V19) on application startup. See `MIGRATION_NOTES.md` for migration details (including V18 competition rules document standardization and V19 admin-visible AES-256-GCM encrypted passwords).

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
| `RAZORPAY_KEY_ID` | Razorpay | Razorpay payment gateway API Key ID (`rzp_test_...` in dev, `rzp_live_...` in prod) |
| `RAZORPAY_KEY_SECRET` | Razorpay | Razorpay payment gateway API Key Secret |
| `ADMIN_PASSWORD_KEY` | Spring | Secret encryption key for AES-256-GCM reversible passwords (PBKDF2-derived, configured via `admin.password-key` / `ADMIN_PASSWORD_KEY`, min 16 chars) |
| `AWS_SES_HOST` | AWS SES | Amazon SES SMTP host (e.g. `email-smtp.ap-south-1.amazonaws.com`) |
| `AWS_SES_PORT` | AWS SES | Amazon SES SMTP port (typically `587` with STARTTLS or `465` with SSL) |
| `AWS_SES_USERNAME` | AWS SES | Amazon SES SMTP username / IAM access key |
| `AWS_SES_PASSWORD` | AWS SES | Amazon SES SMTP password / secret |
| `AWS_SES_FROM_EMAIL` | AWS SES | Verified sender email address (e.g. `noreply@zoroacademy.com`) |
| `AWS_SES_FROM_NAME` | AWS SES | Display name for outgoing emails (default: `Zoro Academy`) |

### Razorpay Configuration Guide

Online competition registration fees use a server-driven Razorpay flow. Credentials must be configured in the backend environment (`backend/.env` or `run-local.ps1`):

1. **Dashboard Access**: Log into [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. **Environment Mode**: Ensure **Test Mode** is active in the top navbar during development (`rzp_test_...`). Use **Live Mode** (`rzp_live_...`) only in production.
3. **API Keys**:
   - Go to **Account & Settings** -> **API Keys** -> **Generate Key**.
   - Copy `Key Id` into `RAZORPAY_KEY_ID`.
   - Copy `Key Secret` into `RAZORPAY_KEY_SECRET`.
4. **Webhooks**:
   - Go to **Account & Settings** -> **Webhooks** -> **Add New Webhook**.
   - Set Webhook URL to `https://<your-domain>/api/payments/razorpay/webhook`.
   - Set Secret to your chosen webhook secret and paste into `RAZORPAY_WEBHOOK_SECRET`.
   - Enable events: `payment.captured` and `payment.failed`.
   - *Note*: Webhooks require a public URL; in local development, `POST /api/payments/razorpay/verify` is the primary verification path executed by the frontend checkout callback.
5. **Frontend**: The React client requires **no** `VITE_RAZORPAY_KEY_ID`; the public `keyId` is securely supplied per-order from the backend `/api/payments/razorpay/order` response.

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
- **Per-Tab Session Storage**: Tokens and auth session state are stored in browser `sessionStorage` (with automatic startup purging of legacy `localStorage` keys). This guarantees strict per-tab session isolation, allowing different roles or accounts in separate browser tabs without cross-tab session clobbering.
- **Navbar Behavior**: Public navigation always displays "Login" and "Enquire Now". Clicking "Login" navigates directly to `/login` without unwanted auto-redirects.
- Unauthenticated access to any protected route immediately redirects to the public landing page. Roles are strictly validated from authenticated JWT tokens retrieved via `/api/auth/me` on session restoration.

---

## Bunny Storage & Bunny Stream Cost Optimization (Part C Guidance)

To maintain low cloud infrastructure costs while providing high-quality streaming and download performance, configure the following settings in your Bunny dashboard:

### 1. Bunny Stream Dashboard Settings
- **Encoding Resolutions**:
  - Keep **360p**, **480p**, and **720p** enabled. These resolutions provide crisp playback on mobile and desktop while minimizing bandwidth usage for learners on cellular/broadband connections.
  - Disable **1080p**, **1440p**, and **4K** encoding. High-definition transcoding incurs significant CPU encoding credits and increases video storage by 300%–500% with negligible educational benefit for whiteboard/lecture videos.
- **Keep Original Video**:
  - Set **"Keep original video"** to **OFF** (Disabled). Bunny automatically deletes the raw uploaded MP4 file once HLS/transcoding completes, saving ~50% video storage space immediately.
- **Token Authentication & Security**:
  - Enable **Token Authentication** in your Bunny Stream Video Library settings.
  - Configure the URL token security key (`BUNNY_TOKEN_AUTH_KEY`) to match your backend environment variable.
  - Configure Token Expiration: the backend generates short-lived signed tokens with Asia/Kolkata timestamps, preventing hotlinking and unauthorized ripping.
- **Watermarking**:
  - Enable dynamic watermarking with student email/ID overlay if desired to deter screen-record distribution.

### 2. Bunny Storage Dashboard Settings
- **Storage Tier & Region**:
  - Choose a **Single Region** storage zone (e.g., Singapore for APAC/India or Falkenstein/Frankfurt for EU) rather than multi-region geo-replication. Multi-region replication doubles or triples storage pricing per GB.
- **Edge Rule Caching**:
  - Configure caching headers on your Pull Zone: cache static public documents, icons, and thumbnails at the CDN edge for 30+ days.
  - Private documents (`/private/**`) are served via short-lived signed token URLs or backend proxy streaming.
- **Deduplication & Orphan Purging**:
  - The application backend automatically calculates SHA-256 hashes on upload to prevent duplicate file storage. Identical files reuse existing storage paths with reference counting.
  - An automated scheduled job runs daily at 2:00 AM IST to purge orphaned files and videos unreferenced by any module, schedule, or submission for > 24 hours.
  - Administrators can review storage metrics, configure student submission retention periods, and trigger dry-run or live cleanup operations from the **Academy Settings -> Storage & Cost Control** dashboard.

