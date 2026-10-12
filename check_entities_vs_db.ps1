# ============================================================
# check_entities_vs_db.ps1
# Compare Java entities (@Entity) vs PostgreSQL schema
# Detect missing tables/columns caused by migration bugs
# ============================================================

param(
    [string]$BackendPath = "backend\src\main\java\com\carrental",
    [string]$DbContainer = "car-rental-db",
    [string]$DbName = "car_rental",
    [string]$DbUser = "postgres"
)

if (-not (Test-Path $BackendPath)) {
    Write-Host "ERROR: Not found: $BackendPath" -ForegroundColor Red
    Write-Host "Run from project root: D:\CAR-RENTAL-SYSTEM---QLDAPM" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ENTITY JAVA vs DB SCHEMA COMPARISON" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1. FIND ALL @Entity FILES
# ============================================================
Write-Host "[1/3] Scanning Java entities..." -ForegroundColor Yellow

$entities = @()

Get-ChildItem -Path $BackendPath -Recurse -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8

    if ($content -notmatch '@Entity') { return }

    $tableName = $null
    if ($content -match '@Table\s*\(\s*name\s*=\s*"([^"]+)"') {
        $tableName = $Matches[1]
    } else {
        if ($content -match 'public\s+class\s+(\w+)') {
            $className = $Matches[1]
            $tableName = $className.Substring(0,1).ToLower() + $className.Substring(1) + "s"
        }
    }

    if (-not $tableName) { return }

    $hasDeletedAt = $content -match '(deletedAt|deleted_at)'
    $hasCreatedAt = $content -match '(createdAt|created_at)'
    $hasUpdatedAt = $content -match '(updatedAt|updated_at)'

    $entities += [PSCustomObject]@{
        Entity       = $_.BaseName
        Table        = $tableName
        FilePath     = $_.FullName
        HasDeletedAt = $hasDeletedAt
        HasCreatedAt = $hasCreatedAt
        HasUpdatedAt = $hasUpdatedAt
    }
}

Write-Host "  -> Found $($entities.Count) entities with @Entity" -ForegroundColor Green
Write-Host ""

# ============================================================
# 2. GET DB SCHEMA
# ============================================================
Write-Host "[2/3] Reading PostgreSQL schema..." -ForegroundColor Yellow

$tablesRaw = docker exec $DbContainer psql -U $DbUser -d $DbName -t -A -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;"

$dbTables = $tablesRaw -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

Write-Host "  -> DB has $($dbTables.Count) tables" -ForegroundColor Green

$deletedAtRaw = docker exec $DbContainer psql -U $DbUser -d $DbName -t -A -c "
SELECT table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name = 'deleted_at'
ORDER BY table_name;"

$dbTablesWithDeletedAt = $deletedAtRaw -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

Write-Host "  -> DB has $($dbTablesWithDeletedAt.Count) tables with deleted_at" -ForegroundColor Green
Write-Host ""

# ============================================================
# 3. COMPARE
# ============================================================
Write-Host "[3/3] Comparing..." -ForegroundColor Yellow
Write-Host ""

$errors = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " RESULTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- 3.1. Check table existence ---
Write-Host ">> Check TABLES exist in DB:" -ForegroundColor White

foreach ($e in $entities) {
    if ($dbTables -contains $e.Table) {
        Write-Host "   OK   $($e.Table.PadRight(30)) ($($e.Entity))" -ForegroundColor Green
    } else {
        Write-Host "   MISS $($e.Table.PadRight(30)) ($($e.Entity)) - TABLE NOT FOUND" -ForegroundColor Red
        $errors += "Table '$($e.Table)' (entity $($e.Entity)) does not exist in DB"
    }
}
Write-Host ""

# --- 3.2. Check deleted_at column ---
Write-Host ">> Check deleted_at COLUMN:" -ForegroundColor White

foreach ($e in $entities | Where-Object { $_.HasDeletedAt }) {
    if ($dbTablesWithDeletedAt -contains $e.Table) {
        Write-Host "   OK   $($e.Table.PadRight(30)) has deleted_at" -ForegroundColor Green
    } else {
        Write-Host "   MISS $($e.Table.PadRight(30)) MISSING deleted_at" -ForegroundColor Red
        $errors += "Table '$($e.Table)' missing column deleted_at (entity $($e.Entity) has field deletedAt)"
    }
}
Write-Host ""

# --- 3.3. Summary ---
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host "OK! No errors. Entity and DB match." -ForegroundColor Green
} else {
    Write-Host "FOUND $($errors.Count) ERRORS:" -ForegroundColor Red
    Write-Host ""
    $i = 1
    foreach ($err in $errors) {
        Write-Host "   $i. $err" -ForegroundColor Yellow
        $i++
    }
    Write-Host ""
    Write-Host "SUGGEST: Create migration V<NEXT> to fix:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan