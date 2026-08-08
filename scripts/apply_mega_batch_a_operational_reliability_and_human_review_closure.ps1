[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
  throw "PROJECT_ROOT_NOT_FOUND: $ProjectRoot"
}

$files = @(
  'client\src\pages\admin\KnowledgeReviewOperations.tsx',
  'client\src\components\ui\dialog.tsx',
  'server\runtimeRepository.ts',
  'server\knowledgeOperations.ts',
  'server\routers.ts',
  'server\assistantMaturityPolicy.ts',
  'server\_core\siteSettingsRouter.ts',
  'sql_sandbox\mega_batch_a_operational_reliability_and_human_review_closure\00_MEGA_BATCH_A_PREFLIGHT_READ_ONLY.sql',
  'sql_sandbox\mega_batch_a_operational_reliability_and_human_review_closure\01_CONTROLLED_HUMAN_REVIEW_TASK_CLAIM_AND_CONTAINMENT_OPERATOR_APPLY.sql',
  'sql_sandbox\mega_batch_a_operational_reliability_and_human_review_closure\02_MEGA_BATCH_A_POST_APPLY_READ_ONLY_VERIFICATION.sql',
  'docs\mega_batch_a_operational_reliability_and_human_review_closure\README_AR.md',
  'docs\mega_batch_a_operational_reliability_and_human_review_closure\RUNBOOK_AR.md',
  'CHANGELOG_MEGA_BATCH_A_2026_06_28.md',
  'ERROR_RECORD_MEGA_BATCH_A_2026_06_28.md',
  'CURRENT_TASK.md',
  'LATEST_BASELINE_CURRENT.md',
  'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md',
  'SESSION_HANDOFF_MEGA_BATCH_A_2026_06_28.md'
)

foreach ($relative in $files) {
  $source = Join-Path $packageRoot $relative
  if (-not (Test-Path -LiteralPath $source)) {
    throw "PACKAGE_FILE_MISSING: $source"
  }
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $ProjectRoot (".palwakf_backups\mega_batch_a_$stamp")
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

foreach ($relative in $files) {
  $source = Join-Path $packageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  $backup = Join-Path $backupRoot $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
  if (Test-Path -LiteralPath $target) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
    Copy-Item -LiteralPath $target -Destination $backup -Force
  }
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "UPDATED: $relative"
}

Write-Host "APPLY_COMPLETE"
Write-Host "BACKUP_ROOT: $backupRoot"
Write-Host "NEXT_1: pnpm.cmd run check"
Write-Host "NEXT_2: pnpm.cmd run build"
Write-Host "NEXT_3: execute 00 preflight SQL, then 01 only after build PASS, then 02 verification SQL"
Write-Host "SAFETY: mapping/release/page-binding mutations stay server-blocked in Mega Batch A."
