# Local Development Environment Template (PLACEHOLDERS ONLY - DO NOT PUT REAL SECRETS HERE)

$env:APP_STORAGE_PROVIDER = "bunny"
$env:BUNNY_STORAGE_HOST = "storage.bunnycdn.com"
$env:BUNNY_STORAGE_ZONE = "your-storage-zone"
$env:BUNNY_STORAGE_PASSWORD = "REPLACE_ME"
$env:BUNNY_STORAGE_CDN_HOST = "your-storage-zone.b-cdn.net"
$env:BUNNY_LIBRARY_ID = "REPLACE_ME"
$env:BUNNY_CDN_HOST = "your-stream.b-cdn.net"
$env:BUNNY_API_KEY = "REPLACE_ME"
$env:BUNNY_TOKEN_AUTH_KEY = "REPLACE_ME"
$env:BUNNY_WEBHOOK_SECRET = "REPLACE_ME"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "zoro_academy"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "REPLACE_ME"
$env:JWT_SECRET = "REPLACE_ME_BASE64_256_BIT_SECRET_KEY"
$env:JWT_EXPIRATION_MS = "3600000"
$env:REFRESH_TOKEN_EXPIRATION_DAYS = "7"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "REPLACE_ME"
$env:RAZORPAY_KEY_ID = "rzp_test_REPLACE_ME"
$env:RAZORPAY_KEY_SECRET = "REPLACE_ME"
$env:CORS_ORIGINS = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://zoroenglish.com"
$env:APP_FRONTEND_URL = "http://localhost:5173"

# AWS SES SMTP Email Configuration
$env:AWS_SES_HOST = "email-smtp.ap-south-1.amazonaws.com"
$env:AWS_SES_PORT = "587"
$env:AWS_SES_USERNAME = "REPLACE_ME"
$env:AWS_SES_PASSWORD = "REPLACE_ME"
$env:AWS_SES_FROM_EMAIL = "noreply@zoroenglish.com"
$env:AWS_SES_FROM_NAME = "Zoro Academy"

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
    "REFRESH_TOKEN_EXPIRATION_DAYS",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "CORS_ORIGINS",
    "AWS_SES_HOST",
    "AWS_SES_PORT",
    "AWS_SES_USERNAME",
    "AWS_SES_PASSWORD",
    "AWS_SES_FROM_EMAIL",
    "AWS_SES_FROM_NAME"

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
