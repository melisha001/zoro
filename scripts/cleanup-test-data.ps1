# scripts/cleanup-test-data.ps1
# Usage:
#   .\scripts\cleanup-test-data.ps1 -DryRun
#   .\scripts\cleanup-test-data.ps1 -Database zoro_academy_test
param(
    [switch]$DryRun,
    [string]$Database = "zoro_academy_test",
    [string]$DbHost = "localhost",
    [string]$Port = "5432",
    [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = "password"
}

Write-Host "=== Zoro Academy Test Data Cleanup ===" -ForegroundColor Cyan
Write-Host "Database : $Database"
Write-Host "Dry-Run  : $DryRun"
Write-Host "---------------------------------------"

$countQuery = @"
SELECT 'notifications' as tbl, count(*) as cnt FROM notifications 
WHERE title LIKE '__TEST__%' OR message LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR message ILIKE '%Smoke%' OR message ILIKE '%Test PostgreSQL Assignment%'
UNION ALL
SELECT 'assignment_submissions', count(*) FROM assignment_submissions 
WHERE student_email LIKE '__TEST__%' OR student_email ILIKE '%smoke%' OR assignment_title LIKE '__TEST__%' OR assignment_title ILIKE '%Smoke Assignment%' OR assignment_title ILIKE '%Test PostgreSQL Assignment%'
UNION ALL
SELECT 'attendance_records', count(*) FROM attendance_records 
WHERE student_id IN (SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%')
UNION ALL
SELECT 'student_module_progress', count(*) FROM student_module_progress 
WHERE student_id IN (SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%')
UNION ALL
SELECT 'schedules', count(*) FROM schedules 
WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%'
UNION ALL
SELECT 'batches', count(*) FROM batches 
WHERE name LIKE '__TEST__%' OR name ILIKE '%Smoke%'
UNION ALL
SELECT 'courses', count(*) FROM courses 
WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
UNION ALL
SELECT 'stored_files', count(*) FROM stored_files 
WHERE original_name LIKE '__TEST__%' OR storage_path LIKE '%/test/%' OR original_name ILIKE '%test_banner%' OR original_name ILIKE 'Test_%.pdf'
UNION ALL
SELECT 'users', count(*) FROM users 
WHERE (email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%' OR username ILIKE 'teststudent%')
  AND email NOT IN ('admin@zoro.com', 'j@gmail.com', 'd@gmail.com', 'a@gmail.com')
  AND id NOT IN ('usr-admin-1', 'std_a7e2fcb8-7e38-4d56-a24a-355eb5fa233b', 'trn_b75a017f-0844-4127-97d5-d2bf949a9110', 'trn_d84446a6-bfdc-4b36-bdd1-042fecd24d75');
"@

Write-Host "`n[1] Candidate Counts Before Cleanup:" -ForegroundColor Yellow
psql -U $User -h $DbHost -p $Port -d $Database -c $countQuery

if ($DryRun) {
    Write-Host "`n[Dry-Run Complete] No rows were modified or deleted." -ForegroundColor Green
    return
}

Write-Host "`n[2] Executing SQL Cleanup Script..." -ForegroundColor Cyan
$scriptPath = Join-Path $PSScriptRoot "cleanup-test-data.sql"
psql -U $User -h $DbHost -p $Port -d $Database -f $scriptPath

Write-Host "`n[3] Candidate Counts After Cleanup:" -ForegroundColor Green
psql -U $User -h $DbHost -p $Port -d $Database -c $countQuery

Write-Host "`n[Cleanup Complete]" -ForegroundColor Green
