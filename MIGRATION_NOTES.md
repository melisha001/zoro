# Zoro Academy — System Migration & Deployment Guide

This document details the complete overhaul performed on Zoro English Academy, including database schema migrations (V6–V13), API contract updates, security hardening, file storage migration, video integration, frontend reliability enhancements, environment configurations, and deployment procedures.

---

## 1. System Architecture Overview

- **Backend**: Spring Boot 3.3.4 (**Requires JDK 21**; Java 26 is unsupported by Spring Boot 3.3.4), Spring Data JPA, Hibernate, PostgreSQL, Flyway migrations, Spring Security with JJWT 0.12.6, Bunny Stream Video Integration, Database File Storage (`StoredFile`), Razorpay Payment Gateway.
- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide React icons, xlsx data export, React Router (BrowserRouter).
- **Roles & Permissions**:
  - `ADMIN`: Full administrative control (Users, Fees, Expenses, Salaries, Settings, Course Content, Activity Logs).
  - `TRAINER`: Schedules, Batches, Attendance, Assignments, Submissions Review, Doubts Resolution.
  - `STUDENT`: Authenticated access scoped strictly to enrolled courses, module progress, personal submissions, attendance, doubts, and secure video streaming.

---

## 2. Database Schema & Flyway Migrations (V6 – V13)

> **Rule Compliance**: Migrations V1 through V8 were preserved strictly untouched. All enhancements were introduced through additive, non-destructive Flyway migrations (V9–V13).

### `V6__ids_as_single_source_of_truth.sql`
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

### `V8__phase4_bugfixes.sql`
- **Objective**: Enforced data integrity, idempotency, and URL slug support.
- **Key Changes**:
  - `attendance_records`: Composite unique constraint `(student_id, schedule_id)` to ensure attendance marking is idempotent (upsert rather than duplicates).
  - `competition_registrations`: Unique index on `(competition_id, LOWER(student_email))` to block duplicate registrations.
  - `courses`: Added `slug VARCHAR(160) UNIQUE` with auto-generation and slug resolution support.
  - `fee_payments`: Added index on `student_fee_id` and `created_at` for high-throughput dashboard SQL aggregations.
  - `salary_records`: Added indexes on `trainer_id` and `month`.

### `V9__neutralize_seed_passwords.sql`
- **Objective**: Neutralized seed accounts from V2 with known default passwords.
- **Key Changes**:
  - Scrambled and invalidated BCrypt hashes for all V2 seed accounts (`usr-admin-1`, `trn-1`, `trn-2`, `std-1`, `std-2`) so no known default password exists. Initial admin credentials are required to bootstrap via `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### `V10__file_storage_schema.sql` (Task 1)
- **Objective**: DB-backed file storage with magic byte validation and data migration runner.
- **Key Changes**:
  - Created `stored_files` table (`id`, `file_name`, `content_type`, `file_size`, `data`, `public_accessible`, `created_at`, `updated_at`).
  - Implemented `FileStorageService` with file magic-byte validation (JPEG, PNG, GIF, WEBP, PDF, DOCX, XLSX, MP4, etc.) and `FileMigrationRunner` scanning/converting legacy data/blob URLs.

### `V11__competitions_independent.sql` (Task 4)
- **Objective**: Made competition registrations independent of courses and batches.
- **Key Changes**:
  - Made `student_id` in `competition_registrations` nullable.
  - Added `age` (INT), `school` (VARCHAR), and `city` (VARCHAR) to `competition_registrations`.
  - Updated entity, service, and frontend registration modals for independent public signups.

### `V12__remove_demo_data.sql` (Task 5)
- **Objective**: Completely purged hardcoded demo business rows from production migrations.
- **Key Changes**:
  - Removed demo courses, modules, resources, batches, student_course_batches, enrollments, schedules, student_fees, submissions, student_progress, and non-admin demo users.
  - Preserved system configuration and administrator account (`admin@zoro.com`).
  - Enforced 0 demo data state in `FreshDatabaseCleanTest.java`.

### `V13__student_batch_membership.sql` (Task 6)
- **Objective**: Deduplicated student batch relationships and enforced single batch per course constraints.
- **Key Changes**:
  - Deduplicated `student_course_batches` and `enrollments` on `(student_id, course_id)`.
  - Added unique constraints `uk_scb_student_course` on `student_course_batches(student_id, course_id)` and `uk_enrollments_student_course` on `enrollments(student_id, course_id)`.
  - Added `GET /api/batches/{id}/students` endpoint and `getBatchStudents(id)` in `batchApi.js`.

---

## 3. Security Hardening & Session Lifecycle Management

### A. Immediate Session Termination (Task 8)
- **Database Status Check on Every Request**: `JwtAuthenticationFilter` validates the user in the database on every authenticated API request.
- **Structured Error Codes**:
  - User Deleted from DB -> HTTP 401 Unauthorized:
    ```json
    { "success": false, "code": "ACCOUNT_REMOVED", "message": "Account has been removed" }
    ```
  - User Deactivated/Disabled -> HTTP 401 Unauthorized:
    ```json
    { "success": false, "code": "ACCOUNT_DISABLED", "message": "Account has been deactivated" }
    ```
  - Expired or Invalid Token -> HTTP 401 Unauthorized:
    ```json
    { "success": false, "code": "TOKEN_EXPIRED", "message": "Token expired or invalid" }
    ```
- **Frontend Interception**:
  - `client.js` captures HTTP 401, clears `localStorage` auth session (`clearAuthSession()`), and dispatches custom `auth:unauthorized` event with structured code & message.
  - `AuthContext.jsx` clears user/role state and sets `authNotice`.
  - `usePolling.js` listens to `auth:unauthorized` and 401 response statuses, halting all active polling intervals immediately.
  - `LoginPage.jsx` and `LoginModal.jsx` display prominent alert banners notifying users of session termination reasons.

### B. Secrets & Configuration Validation (Task 0 & Task 2)
- Added strict startup checks in `JwtTokenProvider` ensuring `jwt.secret` decodes to at least 32 bytes (256 bits) for HMAC-SHA256 signature security.
- Added strict startup validation in `BunnyStreamProperties` checking `bunny.library-id`, `bunny.api-key`, `bunny.cdn-host`, and `bunny.token-auth-key`.
- Implemented TUS presigned upload (`SHA256_HEX`), video status polling, and automatic Bunny CDN / file storage cleanup on module or course deletion.

### C. Trainer Dependency & Reassignment Flow (Task 7)
- `TrainerController` supports `DELETE /api/trainers/{id}?replacementTrainerId=...`.
- Reassigns courses, batches, and schedules to `replacementTrainerId` in a single `@Transactional` method when deleting a trainer with active dependencies.

---

## 4. Environment Variables & Secret Configuration

Configure the following environment variables in production before starting the application:

| Variable | Description | Example / Default |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | `zoro_academy` |
| `DB_USER` | PostgreSQL database user | `postgres` |
| `DB_PASSWORD` | PostgreSQL database password | *(Strong password)* |
| `JWT_SECRET` | Base64-encoded key for HMAC-SHA256 (>= 32 bytes) | `Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=` |
| `JWT_EXPIRATION` | JWT token expiration in ms | `86400000` |
| `ADMIN_EMAIL` | Administrator account email for bootstrap | `admin@zoro.com` |
| `ADMIN_PASSWORD` | Administrator account password for bootstrap | `Admin@123` |
| `BUNNY_LIBRARY_ID` | Bunny.net Video Library ID (Required) | `770045` |
| `BUNNY_API_KEY` | Bunny.net Video Library API key | *(Bunny dashboard API key)* |
| `BUNNY_CDN_HOST` | Bunny Stream Pull Zone hostname (Required) | `vz-770045.b-cdn.net` |
| `BUNNY_TOKEN_AUTH_KEY`| Bunny.net Stream Token authentication key | *(Bunny CDN Token key)* |
| `BUNNY_WEBHOOK_SECRET` | Bunny webhook verification shared secret | *(Secret string)* |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | *(Razorpay secret)* |

---

## 5. Build & Verification Commands

### Backend (Spring Boot)
```bash
cd backend

# Run automated tests
mvn -q test

# Package production executable JAR
mvn package -DskipTests

# Run local startup script
.\run-local.ps1
```

### Frontend (React / Vite)
```bash
cd frontend

# Install dependencies
npm install

# Run linter
npx oxlint

# Build production bundle
npm run build
```
Static production output is generated in `frontend/dist/`.
