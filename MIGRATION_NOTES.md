# Zoro Academy — System Migration & Deployment Guide

This document details the complete 6-phase overhaul performed on Zoro English Academy, including database schema migrations (V6–V8), API contract updates, security hardening, frontend reliability enhancements, environment configurations, and deployment procedures.

---

## 1. System Architecture Overview

- **Backend**: Spring Boot 3.3.4 (Java 21 / 26 compatible), Spring Data JPA, Hibernate, PostgreSQL, Flyway migrations, Spring Security with JJWT 0.12.6, Bunny Stream Video Integration, Razorpay Payment Gateway.
- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide React icons, xlsx data export.
- **Roles & Permissions**:
  - `ADMIN`: Full administrative control (Users, Fees, Expenses, Salaries, Settings, Course Content, Activity Logs).
  - `TRAINER`: Schedules, Batches, Attendance, Assignments, Submissions Review, Doubts Resolution.
  - `STUDENT`: Authenticated access scoped strictly to enrolled courses, module progress, personal submissions, attendance, doubts, and secure video streaming.

---

## 2. Database Schema & Flyway Migrations (V6 – V8)

> **Rule Compliance**: Migrations V1 through V5 were preserved strictly untouched. All enhancements were introduced through additive, non-destructive migrations.

### `V6__id_single_source_of_truth.sql`
- **Objective**: Replaced string-based name/email linking with persistent entity IDs as the single source of truth.
- **Key Changes**:
  - `assignments`: added `trainer_id VARCHAR(64)`.
  - `assignment_submissions`: added `student_id VARCHAR(64)`, `trainer_id VARCHAR(64)`, `assignment_id VARCHAR(64)`, `batch_id VARCHAR(64)`.
  - `doubts`: added `trainer_id VARCHAR(64)`.
  - `student_fees`: added `course_id VARCHAR(64)`, `batch_id VARCHAR(64)`.
  - Backfilled missing IDs from parent entities based on legacy email/title mappings.
  - Added non-blocking foreign keys and performance indexes across all newly linked ID columns.

### `V7__trainer_course_requests_and_business_flows.sql`
- **Objective**: Formalized trainer course allocation workflow and relational course tracking.
- **Key Changes**:
  - Created `trainer_course_requests` table (`id`, `trainer_id`, `trainer_name`, `trainer_email`, `course_id`, `course_title`, `status`, `request_date`, `created_at`, `updated_at`).
  - Added relational indexes for rapid trainer-course matching.

### `V8__bug_fixes_and_schema_hardening.sql`
- **Objective**: Enforced data integrity, idempotency, and URL slug support.
- **Key Changes**:
  - `attendance_records`: Composite unique constraint `(student_id, schedule_id)` to ensure attendance marking is idempotent (upsert rather than duplicates).
  - `competition_registrations`: Unique index on `(competition_id, LOWER(student_email))` to block duplicate registrations.
  - `courses`: Added `slug VARCHAR(160) UNIQUE` with auto-generation and slug resolution support.
  - `fee_payments`: Added index on `student_fee_id` and `created_at` for high-throughput dashboard SQL aggregations.
  - `salary_records`: Added indexes on `trainer_id` and `month`.

---

## 3. Security Hardening & Breaking API Changes

### A. Authentication & Backdoor Removal
1. **Removed Default Password Backdoors**: The legacy fallback allowing `"password123"` / `"admin123"` on any account has been completely removed.
2. **Bootstrap Admin Initialization**: Added `AdminUserInitializer` `CommandLineRunner` that bootstraps/updates the admin credentials securely from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (BCrypt-hashed) upon startup.
3. **Random Temporary Passwords**: Admin creating students or trainers now generates a cryptographically secure 12-character temporary password returned once in `UserDto.temporaryPassword`.
4. **Duplicate Protection (409 Conflict)**: Creating users with duplicate email or username now throws a 409 `ConflictException`.
5. **Self-Deletion & Last Admin Protection**: An admin cannot delete their own account or the last remaining administrator in the system.

### B. Strict Role-Based Access Control (RBAC)
- Removed `.requestMatchers("/api/**").permitAll()`.
- Public endpoints restricted strictly to:
  - `POST /api/auth/login`
  - `POST /api/enquiries`
  - `GET /api/courses/**`
  - `GET /api/competitions/**` (excluding registrations)
  - `GET /api/website-settings/**`
  - `POST /api/competitions/{id}/registrations`
  - Swagger / OpenAPI documentation
- All other endpoints require valid Bearer JWT.
- Added `/api/me/**` scoped endpoints (`/api/me/courses`, `/api/me/batches`, `/api/me/assignments`, `/api/me/submissions`, `/api/me/schedules`) for authenticated users.

### C. Bunny Stream Video Security
- **JWT Identity Binding**: Video playback authorization resolves the user identity strictly from the JWT authentication principal (never client-supplied parameters).
- **Course Association Enforced**: Videos not associated with any active course return an immediate access denial.
- **Enrollment Verification**: Students requesting video tokens must possess an active enrollment in the course.
- **Webhook Signature Verification**: `BunnyWebhookController` validates the `webhook-signature` or `X-Bunny-Secret` header before processing transcoding updates.

### D. Fee Payment Integrity & Razorpay Verification
- Verifies Razorpay HMAC-SHA256 signature (`order_id|payment_id`) against `razorpay.key-secret` using constant-time comparison (`MessageDigest.isEqual`).
- Fee records marked as `Paid` or having payment transactions cannot have their fee lowered below paid amounts or be deleted.

---

## 4. Frontend Reliability Overhaul

1. **Zero Mock / Fake Success Fallbacks**:
   - Replaced all fallback empty list/fake success resolutions across `frontend/src/api/*.js` with standard `{ success: false, message, data: null }` error structures.
   - Validated required IDs before dispatching network requests.
2. **Visibility-Aware Polling (`usePolling`)**:
   - Created `usePolling(callback, intervalMs, enabled)` in `frontend/src/hooks/usePolling.js` integrating the Page Visibility API (`document.visibilityState`). Pauses execution when tab is backgrounded and resumes immediately upon focus.
3. **Session Restoration & Smooth Routing**:
   - `AuthContext.jsx` restores session on mount via `/api/auth/me`. Shows a full-page loading spinner during initialization, preventing any flashing of the public home or login screen.
4. **Code-Splitting via `React.lazy` & `Suspense`**:
   - Portal views in `App.jsx` are dynamically loaded with lazy chunks, keeping initial bundle size minimal and responsive.

---

## 5. Environment Variables & Secret Configuration

Configure the following environment variables in production before starting the application:

| Variable | Description | Example / Default |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/zoro_academy_db` |
| `DB_USERNAME` | PostgreSQL database user | `postgres` |
| `DB_PASSWORD` | PostgreSQL database password | *(Strong password)* |
| `JWT_SECRET` | Secret for HMAC-SHA256 JWT signing | *(At least 32-byte hex/base64 string)* |
| `ADMIN_EMAIL` | Default administrator account email | `admin@zoroacademy.com` |
| `ADMIN_PASSWORD` | Default administrator initial password | *(Strong administrative password)* |
| `BUNNY_API_KEY` | Bunny.net Video Library API key | *(Bunny dashboard API key)* |
| `BUNNY_TOKEN_AUTH_KEY`| Bunny.net Stream Token authentication key | *(Bunny CDN Token key)* |
| `BUNNY_LIBRARY_ID` | Bunny Video Library ID | `770045` |
| `BUNNY_CDN_HOST` | Bunny Stream Pull Zone hostname | `vz-770045.b-cdn.net` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | *(Razorpay secret)* |

> [!CAUTION]
> **Secrets Rotation Requirement**:
> Because development placeholders existed in previous commits, you **must rotate** the following credentials in your live environments:
> 1. Bunny.net API Key and Token Authentication Key.
> 2. JWT Signing Secret (`jwt.secret`).
> 3. Production PostgreSQL credentials.
> 4. Razorpay production Key Secret.

---

## 6. Build & Deployment Instructions

### Backend (Spring Boot)
```bash
cd backend

# Run automated tests
mvn clean test

# Package production executable JAR
mvn package -DskipTests

# Run the backend service
java -jar target/zoro-academy-backend-1.0.0.jar --spring.profiles.active=prod
```

### Frontend (React / Vite)
```bash
cd frontend

# Install dependencies
npm install

# Run linter
npx oxlint

# Build production assets
npm run build
```
Static output will be generated inside `frontend/dist/` ready to be served by Nginx, Cloudflare Pages, or a static CDN.
