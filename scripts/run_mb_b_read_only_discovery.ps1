param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
  throw "PROJECT_ROOT_NOT_FOUND: $ProjectRoot"
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw 'DATABASE_URL_NOT_SET. Set a PostgreSQL connection string in the current PowerShell session before running this script.'
}

$packageRoot = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $packageRoot '06_READ_ONLY_DISCOVERY.sql'
$evidenceDir = Join-Path $packageRoot 'evidence'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outputPath = Join-Path $evidenceDir "mega_batch_b_read_only_discovery_$stamp.txt"

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw 'PSQL_NOT_FOUND. Install PostgreSQL client tools or add psql to PATH.'
}

New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

# psql receives one read-only SQL file. No DB mutation command is present in the script.
& psql $env:DATABASE_URL -X -v ON_ERROR_STOP=1 -P pager=off -f $sqlPath 2>&1 |
  Tee-Object -FilePath $outputPath

if ($LASTEXITCODE -ne 0) {
  throw "READ_ONLY_DISCOVERY_FAILED. Inspect: $outputPath"
}

Write-Host "MEGA_BATCH_B_READ_ONLY_DISCOVERY=PASS"
Write-Host "EVIDENCE_FILE=$outputPath"
