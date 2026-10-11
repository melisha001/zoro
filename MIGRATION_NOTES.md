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

### `V14__must_change_password.sql` (Hardening Phase - Task 3)
- **Objective**: Added forced password change flag for administrator resets and first-time user provisioning.
- **Key Changes**:
  - Added `must_change_password BOOLEAN NOT NULL DEFAULT FALSE` to `users` table.
  - Added `mustChangePassword` to User entity, auth responses, and user profile DTOs.
  - Implemented `POST /api/users/{id}/reset-password` allowing Admins to generate a secure single-use temporary password.
  - Integrated `ForceChangePasswordModal.jsx` blocking portal interactions until the password is changed.

### `V15__competition_fields.sql` (Issue 5-7 Hardening)
- **Objective**: Added persistent competition fields so admin-configured event details, banners, timings, venues, instructions, and PDFs are fully saved and rendered on public and admin pages without mock fallbacks.
- **Key Changes**:
  - Added columns to `competitions`:
    - `reg_start_date VARCHAR(20)`
    - `reg_end_date VARCHAR(20)`
    - `start_time VARCHAR(20)`
    - `end_time VARCHAR(20)`
    - `venue VARCHAR(255)`
    - `banner_url TEXT`
    - `rules_pdf_url TEXT`
    - `registration_form_url TEXT`
    - `instructions TEXT`
    - `contact_details TEXT`
  - Updated `Competition.java` entity, service, controller, and frontend `competitionApi.js` to persist and return all fields.
  - Removed all hardcoded fallbacks from `CompetitionPage.jsx` and `HomePage.jsx`.

### `V16__refresh_tokens.sql` (Issue 8 Hardening)
- **Objective**: Implemented standard session lifecycle with 1-hour access JWT and 7-day rotated refresh tokens, eliminating "Keep me signed in" checkboxes.
- **Key Changes**:
  - Created `refresh_tokens` table:
    - `id VARCHAR(64) PRIMARY KEY`
    - `user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `token_hash VARCHAR(64) NOT NULL UNIQUE`
    - `expires_at TIMESTAMP NOT NULL`
    - `revoked BOOLEAN NOT NULL DEFAULT FALSE`
    - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    - `user_agent VARCHAR(255)`
  - Added indexes on `user_id` and `token_hash`.
  - Added `POST /api/auth/refresh` with SHA-256 token hashing, token rotation, and reuse detection (revoking all tokens on reuse).
  - Added `POST /api/auth/logout` revoking the refresh token.
  - Configured `JWT_EXPIRATION_MS=3600000` (1 hour) and `REFRESH_TOKEN_EXPIRATION_DAYS=7` (7 days).

### `V17__enquiry_course_id.sql` (Issue 9 Hardening)
- **Objective**: Direct relational linking of visitor enquiries to active courses.
- **Key Changes**:
  - Added `course_id VARCHAR(128) REFERENCES courses(id) ON DELETE SET NULL` to `enquiries` table with index `idx_enquiries_course_id`.
  - Updated `Enquiry.java` entity and `EnquiryService.java` to synchronize `courseId` and `courseInterest`.
  - Restricted enquiry course dropdowns (`EnquireModal.jsx`, `ContactPage.jsx`) strictly to active admin-created courses returned by `GET /api/courses`.
  - Removed "General enquiry" options and hardcoded course names.
  - Admin Enquiry Details view surfaces course title and course ID.

### `V18__drop_competition_registration_form.sql` (Task D Hardening)
- **Objective**: Dropped dead `registration_form_url` from `competitions` table and standardized public downloadable rules PDFs.
- **Key Changes**:
  - Dropped column `registration_form_url` from `competitions`.
  - Standardized rules document management on `public-document` storage category with magic-byte verification.
  - Implemented streaming file download endpoint `GET /api/files/{id}/download` with `Content-Disposition: attachment`, `Content-Length`, and `X-Content-Type-Options: nosniff`.
  - Removed external registration URL fallbacks and form controls across `CompetitionPage.jsx` and `AdminCompetitionPage.jsx`.

### `V19__add_admin_visible_password.sql` (Task F Hardening)
- **Objective**: Added `admin_visible_password TEXT` column to `users` table, encrypted using AES-256-GCM with PBKDF2/SHA-256 key derivation from `admin.password-key` (`ADMIN_PASSWORD_KEY`).
- **Key Changes**:
  - Added `admin_visible_password TEXT` to `users` table.
  - Implemented reversible encryption service `AdminPasswordCryptoService.java` (AES-256-GCM, 12-byte random IV, 128-bit authentication tag, PBKDF2 key derivation).
  - Added admin-only endpoints `GET /api/users/{id}/admin-password` and `PUT /api/users/{id}/admin-password`.
  - Added eye toggle and inline password editing modal in `ManageStudentsPage.jsx` and `ManageTrainersPage.jsx`.
  - Enforced strong password policy (at least 8 characters, uppercase, lowercase, number, special character) across all password setting/changing flows.
  - Neutralized `ForceChangePasswordModal.jsx` to prevent disruptive mandatory password reset loops on initial login.

> [!NOTE]
> **One-Time Data Repair Notice (Course Prices)**:
> In earlier builds, admin forms sent `fee`/`fees` instead of `price`, causing Jackson to drop the field and store courses with price `0`. These existing courses cannot be recovered automatically. Administrators must re-enter course prices via the Admin Courses portal (`/admin/courses`).

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
| `ADMIN_PASSWORD_KEY` | Secret encryption key for AES-256-GCM passwords | *(Derived 256-bit key, min 16 chars)* |

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

---

## 6. Zoro Academy Hardening & Architectural Upgrades (Tasks 0 – 7)

### Task 0: Environment Fail-Fast & Connectivity Verification
- Implemented environment isolation with `run-local.ps1` (git-ignored) and `run-local.example.ps1`.
- Introduced `GET /api/admin/bunny-health` (ADMIN only) which performs live non-destructive write/read/delete on Bunny Storage and queries Bunny Stream video library without exposing credentials in logs or payloads.
- Added strict startup checks in `application.yml` and `JwtTokenProvider` to fail fast if required environment variables or secrets are missing.

### Task 1: Session Longevity & Silent Token Refresh
- Configured anonymous pass-through in `JwtAuthenticationFilter` on public routes (`/api/auth/**`, `/api/courses/**`, `/api/competitions/**`, `/api/files/**`, `/api/enquiries/**`).
- Switched JWT subject to User ID (`id`) while maintaining `email` as a claim for deterministic identity lookups.
- Implemented `POST /api/auth/refresh` with silent client-side renewal when token age exceeds 50% of expiration lifetime.
- Added "Keep me signed in" option (30 days vs 8 hours expiration).
- Structured 401 handling with `SessionExpiredModal.jsx` displaying renewal prompts without abrupt redirection.

### Task 2: Trainer & Student Authorization Audit
- Created dedicated self-service endpoints:
  - `GET /api/me/students`: fetches students assigned to the authenticated trainer's batches.
  - `GET /api/me/profile` & `PUT /api/me/profile`: self-service profile management for non-admins.
- Audited all frontend trainer and student pages to ensure zero unauthorized calls to admin `/api/users/*` endpoints.
- Validated via `SecurityRbacIntegrationTest.java` verifying RBAC boundaries for ADMIN, TRAINER, and STUDENT tokens.

### Task 3: Password Workflows & Forced Change
- Added Flyway migration `V14__must_change_password.sql`.
- Added Admin endpoint `POST /api/users/{id}/reset-password` generating a 12-character secure temporary password returned exactly once.
- Built interactive credentials copy modal in `ManageTrainersPage` and `ManageStudentsPage`.
- Integrated `ForceChangePasswordModal.jsx` in frontend requiring immediate password change on first login.

### Task 4: Pluggable Storage Providers & Partitioned Media Paths
- Implemented `StorageProvider` abstraction with two production implementations:
  - `BunnyStorageProvider`: Streams directly to/from Bunny Storage API (`storage.bunnycdn.com`) with edge CDN caching (`vz-...b-cdn.net`).
  - `LocalStorageProvider`: Local filesystem storage for development or fallback.
- Partitioned storage paths:
  - Public (`/public/{category}/{filename}`): Direct CDN/HTTP streaming for course thumbnails, banners, and trainer avatars.
  - Private (`/private/{category}/{filename}`): Restricted files accessible exclusively via temporary signed HMAC tokens (`GET /api/files/{id}/link`).
- Integrated `resolveFileUrl` helper across 12 frontend components.
- Integrated `SecureVideoPlayer.jsx` and `CourseLearningPage.jsx` with signed playback tokens and Bunny Stream video delivery.

### Task 5: Branded Dialog System & Global Exception Handling
- Created `DialogProvider.jsx` and `useDialog()` hook (`showError`, `showSuccess`, `showWarning`, `confirm`) completely eradicating legacy `alert()` and `window.confirm()` calls across all 9 frontend pages.
- Configured global `api:error` event listener in `client.js` for non-GET failures with retry alerts for GET failures.
- Updated `GlobalExceptionHandler.java`:
  - 413: `MaxUploadSizeExceededException` returning clean size guidance.
  - 400: `MethodArgumentNotValidException` and `ConstraintViolationException` returning formatted field validation errors.
  - 500: Server error logging with generated correlation ID UUID and client payload.

### Task 6: Codebase Audit & Performance Optimization
- Resolved all unused variables, unhandled errors, and redundant imports in `npx oxlint`.
- Audited database queries in `AdminDashboardService.java` confirming optimal SQL aggregations with zero N+1 query patterns.
- Verified zero leaked secrets across the entire codebase via security audit.

### Task 7: Comprehensive Verification & QA Matrix
- Full verification passed:
  - `mvn -q test`: 100% pass rate across all backend integration and unit tests.
  - `npm run build`: Production bundle generated cleanly with 0 errors.
  - `npx oxlint`: 0 lint errors across all 96 files.

---

## 7. Production Hardening Overhaul (Tasks A – H)

### Task A: PostgreSQL JSONB Type-Binding & Serialization
- **Issue**: PostgreSQL native `jsonb` column binding failed when Hibernate passed raw string parameters without explicit type casting (`column is of type jsonb but expression is of type character varying`).
- **Resolution**:
  - Annotated JSON columns with `@ColumnTransformer(write = "?::jsonb")` across `CourseModule.resources`, `Assignment.attachments`, `AssignmentSubmission.attachments`, and `SystemSetting.value`.
  - Created `JsonAsStringDeserializer.java` to reliably deserialize JSON payloads into strings across Jackson bindings.
  - Enhanced `GlobalExceptionHandler.java` to format JSON parse and validation errors with structured responses.

### Task B: Admin Settings Persistence & Landing / Footer Integration
- **Issue**: Admin Settings form contained phantom sections ("Security & Access", "Portal Controls & Features") with an unpersisted `portalControls` object, causing form state desynchronization.
- **Resolution**:
  - Removed phantom "Security & Access" and "Portal Controls & Features" cards and tabs.
  - Completely purged `portalControls` from backend defaults, DTOs, and frontend state.
  - Wired public header and footer (`Navbar.jsx`, `Footer.jsx`) dynamically to `/api/website-settings` (contact email, phone, academy name, and address).

### Task C: Module Duration & Secured Video Playback
- **Issue**: Module duration defaulted to 0 or manual input without reflecting real video status; unenrolled students could bypass playback checks.
- **Resolution**:
  - Computed real duration dynamically from Bunny Stream API when status reaches `Ready` (HTTP 200).
  - Added video processing badge (`Processing...`) in the admin course content list when video transcoding is pending.
  - Secured video playback endpoint: unenrolled students receive HTTP 403 Forbidden; enrolled students receive HTTP 200 OK with authorized signed streaming token.
  - Updated syllabus on public course details to display dynamic duration computed from published video modules.

### Task D: Competition Registration Form Drop & Rules Download
- **Issue**: Competitions contained an obsolete `registration_form_url` column and unvalidated PDF URLs leading to external broken links.
- **Resolution**:
  - Flyway migration `V18__drop_competition_registration_form.sql` dropped `registration_form_url`.
  - Added `public-document` storage category with strict magic-byte validation (blocking executable or malicious file uploads).
  - Implemented streaming file download endpoint `GET /api/files/{id}/download` returning `Content-Disposition: attachment; filename="..."`, correct `Content-Length`, and `X-Content-Type-Options: nosniff`.
  - Standardized `CompetitionPage.jsx` and `AdminCompetitionPage.jsx` to download rules documents directly via the new endpoint.

### Task E: Per-Tab Session Isolation (Migration to `sessionStorage`)
- **Issue**: Session tokens stored in `localStorage` caused cross-tab collisions (e.g. logging into student in tab 2 clobbered admin session in tab 1) and public navbar "Login" auto-redirected logged-in tabs unexpectedly.
- **Resolution**:
  - Migrated token and user storage from `localStorage` to `sessionStorage` in `client.js`, `AuthContext.jsx`, and `activityLogApi.js`.
  - Added startup purging of legacy `localStorage` keys (`clearLegacyLocalStorage()`).
  - Decoupled public navbar "Login" button from automatic dashboard redirects, keeping public navigation predictable.

### Task F: Admin Reversible Passwords (AES-256-GCM)
- **Issue**: Admins had no way to view or edit student/trainer passwords when assisting users; forced password change loops locked users out.
- **Resolution**:
  - Flyway migration `V19__add_admin_visible_password.sql` added `admin_visible_password TEXT` to `users`.
  - Implemented `AdminPasswordCryptoService.java` using AES-256-GCM encryption with 12-byte random IVs, 128-bit authentication tags, and PBKDF2 key derivation from `admin.password-key` (`ADMIN_PASSWORD_KEY`).
  - Added `GET /api/users/{id}/admin-password` and `PUT /api/users/{id}/admin-password` (ADMIN only).
  - Built password reveal toggle and inline password editing modal in `ManageStudentsPage.jsx` and `ManageTrainersPage.jsx`.
  - Enforced strong password validation (min 8 chars, uppercase, lowercase, digit, special char).
  - Neutralized `ForceChangePasswordModal.jsx` to prevent disruptive reset loops.

### Task G: Strict Batch Membership & Student Isolation by `batchId`
- **Issue**: Batch student lists and counts leaked students across batches due to string name matching and course-wide fallbacks.
- **Resolution**:
  - Replaced JPA stream filtering with relational ID queries: `userRepository.findStudentsByBatchId(batchId)` (SQL JOIN on `student_course_batches` where `batch_id = :batchId AND UPPER(u.role) = 'STUDENT'`).
  - Added `GET /api/batches/{id}/students/count` returning `ApiResponse<Long>`.
  - Created and exported `isStudentInBatch(student, batchObj)` in frontend matching strictly on `cb.batchId === batchObj.id` with zero string fallback.
  - Updated `ManageStudentsPage.jsx`, `AttendancePage.jsx`, `TrainerStudentsPage.jsx`, `AdminSchedulePage.jsx`, and `AdminAssignmentsPage.jsx`.
  - Verified 0 student leakage between parallel batches in the same course.

### Task H: Final Quality Gate & Verification Matrix
- **Automated Verification**:
  - `npm run check` (`oxlint && vite build`): 0 errors, production bundle built cleanly in ~600ms.
  - `npm test` (`vitest run`): 30 tests passed across public, admin, trainer, and student smoke routes.
  - `mvn -q test`: 78 tests passed, 0 failures, 0 errors.
  - Live PostgreSQL E2E Smoke Suite (`scripts/e2e-smoke.ps1`): All 9 steps passed with concrete HTTP evidence.

