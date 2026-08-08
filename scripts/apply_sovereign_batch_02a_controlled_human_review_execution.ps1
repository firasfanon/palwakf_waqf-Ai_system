[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $PSScriptRoot
$required = @(
  'server\knowledgeOperations.ts',
  'server\routers.ts',
  'client\src\pages\admin\KnowledgeReviewOperations.tsx'
)

if (-not (Test-Path -LiteralPath $ProjectRoot)) { throw "PROJECT_ROOT_NOT_FOUND: $ProjectRoot" }
foreach ($relative in $required) {
  $source = Join-Path $packageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  if (-not (Test-Path -LiteralPath $source)) { throw "PACKAGE_FILE_MISSING: $source" }
  if (-not (Test-Path -LiteralPath $target)) { throw "PROJECT_TARGET_MISSING: $target" }
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $ProjectRoot (".palwakf_backups\sovereign_batch_02a_$stamp")
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

foreach ($relative in $required) {
  $source = Join-Path $packageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  $backup = Join-Path $backupRoot $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
  Copy-Item -LiteralPath $target -Destination $backup -Force
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "UPDATED: $relative"
}

$docsSource = Join-Path $packageRoot 'docs\sovereign_batch_02a_controlled_human_review_execution'
$docsTarget = Join-Path $ProjectRoot 'docs\sovereign_batch_02a_controlled_human_review_execution'
Copy-Item -LiteralPath $docsSource -Destination $docsTarget -Recurse -Force

$sqlSource = Join-Path $packageRoot 'sql_sandbox\sovereign_batch_02a_controlled_human_review_execution'
$sqlTarget = Join-Path $ProjectRoot 'sql_sandbox\sovereign_batch_02a_controlled_human_review_execution'
Copy-Item -LiteralPath $sqlSource -Destination $sqlTarget -Recurse -Force

Get-ChildItem -LiteralPath $packageRoot -Filter 'CHANGELOG_SOVEREIGN_BATCH_02A_2026_06_20.md' | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProjectRoot $_.Name) -Force
}
Get-ChildItem -LiteralPath $packageRoot -Filter 'ERROR_RECORD_SOVEREIGN_BATCH_02A_2026_06_20.md' | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProjectRoot $_.Name) -Force
}
Get-ChildItem -LiteralPath $packageRoot -Filter 'SESSION_HANDOFF_SOVEREIGN_BATCH_02A_2026_06_20.md' | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProjectRoot $_.Name) -Force
}
Get-ChildItem -LiteralPath $packageRoot -Filter 'LATEST_BASELINE_SOVEREIGN_BATCH_02A_PREAPPLY_2026_06_20.md' | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProjectRoot $_.Name) -Force
}

Write-Host "APPLY_COMPLETE"
Write-Host "BACKUP_ROOT: $backupRoot"
Write-Host "NEXT: pnpm.cmd run check; pnpm.cmd run build; then run SQL 01 manually, followed by SQL 02."
