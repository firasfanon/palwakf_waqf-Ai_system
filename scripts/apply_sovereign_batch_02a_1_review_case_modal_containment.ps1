[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $PSScriptRoot
$required = @(
  'client\src\components\ui\dialog.tsx',
  'client\src\pages\admin\KnowledgeReviewOperations.tsx',
  'server\runtimeRepository.ts'
)

if (-not (Test-Path -LiteralPath $ProjectRoot)) { throw "PROJECT_ROOT_NOT_FOUND: $ProjectRoot" }
foreach ($relative in $required) {
  $source = Join-Path $packageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  if (-not (Test-Path -LiteralPath $source)) { throw "PACKAGE_FILE_MISSING: $source" }
  if (-not (Test-Path -LiteralPath $target)) { throw "PROJECT_TARGET_MISSING: $target" }
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $ProjectRoot (".palwakf_backups\sovereign_batch_02a_1_$stamp")
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

foreach ($name in @(
  'README_AR.md',
  'CHANGELOG_SOVEREIGN_BATCH_02A_1_2026_06_20.md',
  'ERROR_RECORD_SOVEREIGN_BATCH_02A_1_2026_06_20.md',
  'LATEST_BASELINE_SOVEREIGN_BATCH_02A_1_PREAPPLY_2026_06_20.md',
  'SESSION_HANDOFF_SOVEREIGN_BATCH_02A_1_2026_06_20.md',
  'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE_PATCH_SOVEREIGN_BATCH_02A_1_2026_06_20.md'
)) {
  $source = Join-Path $packageRoot $name
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $ProjectRoot $name) -Force
  }
}

Write-Host "APPLY_COMPLETE"
Write-Host "BACKUP_ROOT: $backupRoot"
Write-Host "NEXT: pnpm.cmd run check; pnpm.cmd run build; then re-open one review case only and capture browser evidence."
