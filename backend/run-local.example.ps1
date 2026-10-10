# Local Development Environment Template (PLACEHOLDERS ONLY - DO NOT PUT REAL SECRETS HERE)

$env:APP_STORAGE_PROVIDER = "REPLACE_ME"
$env:BUNNY_STORAGE_HOST = "REPLACE_ME"
$env:BUNNY_STORAGE_ZONE = "REPLACE_ME"
$env:BUNNY_STORAGE_PASSWORD = "REPLACE_ME"
$env:BUNNY_STORAGE_CDN_HOST = "REPLACE_ME"
$env:BUNNY_LIBRARY_ID = "REPLACE_ME"
$env:BUNNY_CDN_HOST = "REPLACE_ME"
$env:BUNNY_API_KEY = "REPLACE_ME"
$env:BUNNY_TOKEN_AUTH_KEY = "REPLACE_ME"
$env:BUNNY_WEBHOOK_SECRET = "REPLACE_ME"
$env:DB_HOST = "REPLACE_ME"
$env:DB_PORT = "REPLACE_ME"
$env:DB_NAME = "REPLACE_ME"
$env:DB_USER = "REPLACE_ME"
$env:DB_PASSWORD = "REPLACE_ME"
$env:JWT_SECRET = "REPLACE_ME"
$env:JWT_EXPIRATION_MS = "REPLACE_ME"
$env:ADMIN_EMAIL = "REPLACE_ME"
$env:ADMIN_PASSWORD = "REPLACE_ME"
$env:CORS_ORIGINS = "REPLACE_ME"

$requiredVars = @(
    "APP_STORAGE_PROVIDER",
    "BUNNY_STORAGE_HOST",
    "BUNNY_STORAGE_ZONE",
    "BUNNY_STORAGE_PASSWORD",
    "BUNNY_STORAGE_CDN_HOST",
    "BUNNY_LIBRARY_ID",
    "BUNNY_CDN_HOST",
    "BUNNY_API_KEY",
    "BUNNY_TOKEN_AUTH_KEY",
    "BUNNY_WEBHOOK_SECRET",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
    "JWT_EXPIRATION_MS",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "CORS_ORIGINS"
)

$missingVars = @()
foreach ($varName in $requiredVars) {
    $val = [Environment]::GetEnvironmentVariable($varName)
    if ([string]::IsNullOrWhiteSpace($val) -or $val -eq "REPLACE_ME") {
        $missingVars += $varName
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "FATAL ERROR: The following required environment variables are missing or unconfigured:" -ForegroundColor Red
    foreach ($missing in $missingVars) {
        Write-Host " - $missing" -ForegroundColor Red
    }
    Write-Host "Please copy run-local.example.ps1 to run-local.ps1 and populate all values." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Zoro Academy Backend with environment configuration..." -ForegroundColor Green
mvn spring-boot:run
