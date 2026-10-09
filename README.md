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

### 2. Backend Setup (`/backend`)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create your local environment file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Note*: The application includes `springboot3-dotenv`, which automatically loads `backend/.env` during local execution. The `.env` file is gitignored.

3. Configure your local settings inside `backend/.env`:
   ```properties
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=zoro_academy
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password

   # JWT Security (Must be a Base64-encoded key of at least 32 bytes / 256 bits)
   JWT_SECRET=Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=
   JWT_EXPIRATION=86400000

   # Bunny Stream Video Storage & Streaming (Required env vars)
   BUNNY_LIBRARY_ID=770045
   BUNNY_API_KEY=your_bunny_api_key
   BUNNY_CDN_HOST=vz-251d06e3-32f.b-cdn.net
   BUNNY_TOKEN_AUTH_KEY=your_bunny_token_auth_key
   BUNNY_WEBHOOK_SECRET=your_bunny_webhook_secret

   # Initial Administrator Bootstrap Credentials (Required on initial launch)
   ADMIN_EMAIL=admin@zoro.com
   ADMIN_PASSWORD=your_secure_admin_password

   # CORS Settings
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
   ```

4. Run automated test suite:
   ```bash
   mvn clean test
   ```

5. Start the backend application:
   You can run directly via Maven:
   ```bash
   mvn spring-boot:run
   ```
   Or use the PowerShell local runner script (sets environment variables and executes `mvn spring-boot:run`):
   ```powershell
   cp backend/run-local.example.ps1 backend/run-local.ps1
   .\backend\run-local.ps1
   ```
   The script enforces fail-fast checking for required environment variables (`DB_PASSWORD`, `JWT_SECRET`, `BUNNY_API_KEY`, `BUNNY_TOKEN_AUTH_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
   The backend runs on `http://localhost:8080`. Swagger documentation is available at `http://localhost:8080/swagger-ui.html`.

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

Unauthenticated access to any protected route immediately redirects to the public landing page. Roles are strictly validated from authenticated JWT tokens retrieved via `/api/auth/me` on session restoration.
