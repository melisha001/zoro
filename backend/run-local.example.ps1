# Local execution script template for Zoro Academy Backend
# Copy this file to run-local.ps1 and adjust variables if needed.

$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$env:DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "zoro_academy" }
$env:DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

# JWT Secret (Base64-encoded string, minimum 32 bytes / 256 bits)
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=" }
$env:JWT_EXPIRATION = if ($env:JWT_EXPIRATION) { $env:JWT_EXPIRATION } else { "86400000" }

# Bunny Stream Credentials
$env:BUNNY_LIBRARY_ID = if ($env:BUNNY_LIBRARY_ID) { $env:BUNNY_LIBRARY_ID } else { "770045" }
$env:BUNNY_API_KEY = if ($env:BUNNY_API_KEY) { $env:BUNNY_API_KEY } else { "test-bunny-api-key" }
$env:BUNNY_CDN_HOST = if ($env:BUNNY_CDN_HOST) { $env:BUNNY_CDN_HOST } else { "vz-251d06e3-32f.b-cdn.net" }
$env:BUNNY_TOKEN_AUTH_KEY = if ($env:BUNNY_TOKEN_AUTH_KEY) { $env:BUNNY_TOKEN_AUTH_KEY } else { "test-bunny-token-auth-key" }

# Initial Admin Bootstrap Credentials
$env:ADMIN_EMAIL = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@zoro.com" }
$env:ADMIN_PASSWORD = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "Admin@123456" }

# Fail-fast check for missing values
$required = @("DB_PASSWORD", "JWT_SECRET", "BUNNY_API_KEY", "BUNNY_TOKEN_AUTH_KEY", "ADMIN_EMAIL", "ADMIN_PASSWORD")
foreach ($var in $required) {
    $val = [Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Error "FATAL: Required environment variable '$var' is missing or empty."
        exit 1
    }
}

mvn spring-boot:run
