# Local Development Environment Template (PLACEHOLDERS ONLY - DO NOT PUT REAL SECRETS HERE)

$env:APP_STORAGE_PROVIDER = "bunny"
$env:BUNNY_STORAGE_HOST = "storage.bunnycdn.com"
$env:BUNNY_STORAGE_ZONE = "zoro-academy-file"
$env:BUNNY_STORAGE_PASSWORD = "049f4343-70f9-49b3-92b9c8af45d4-87a2-4bdf"
$env:BUNNY_STORAGE_CDN_HOST = "zoro-academy-files-cdn.b-cdn.net"
$env:BUNNY_LIBRARY_ID = "784226"
$env:BUNNY_CDN_HOST = "vz-b68c1f37-bc4.b-cdn.net"
$env:BUNNY_API_KEY = "245af22c-cc0c-4d84-8d8647ce3618-efdf-41ce"
$env:BUNNY_TOKEN_AUTH_KEY = "4665a579-d858-4b82-8b07-939187bbf2f9"
$env:BUNNY_WEBHOOK_SECRET = "e98a72cf5a134b9d8214fbc962e7834a"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "zoro_academy"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "password"
$env:JWT_SECRET = "Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM="
$env:JWT_EXPIRATION_MS = "3600000"
$env:REFRESH_TOKEN_EXPIRATION_DAYS = "7"
$env:ADMIN_EMAIL = "admin@zoro.com"
$env:ADMIN_PASSWORD = "adminPassword123!"
$env:RAZORPAY_KEY_ID="rzp_live_Tnpy54aDPMVwI2"
$env:RAZORPAY_KEY_SECRET="J7ycJFK9yiHaYXM16G4PNsBr"
$env:CORS_ORIGINS = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

# AWS SES SMTP Email Configuration
$env:AWS_SES_HOST = "email-smtp.ap-south-1.amazonaws.com"
$env:AWS_SES_PORT = "587"
$env:AWS_SES_USERNAME = "AKIA3TYABBDG42QKOJDV"
$env:AWS_SES_PASSWORD = "BDY2w2y0ZvUIdAkniKbm2SthAiUfZpjhLGikMKJ9+qF/"
$env:AWS_SES_FROM_EMAIL = "zorocentre@gmail.com"
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
