param(
  [Parameter(Mandatory=$true)][string]$SourceRoot,
  [Parameter(Mandatory=$true)][string]$BackupDir
)
$ErrorActionPreference = "Stop"
$Batch = "MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1"
$manifestPath = Join-Path $BackupDir "BACKUP_MANIFEST.json"
if (!(Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "BACKUP_MANIFEST_NOT_FOUND: $manifestPath" }
$entries = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($entry in $entries) {
  $relative = [string]$entry.path
  $target = Join-Path $SourceRoot ($relative -replace '/', '\')
  if ([bool]$entry.existed_before) {
    $backup = Join-Path $BackupDir (([string]$entry.backup_relative) -replace '/', '\')
    if (!(Test-Path -LiteralPath $backup -PathType Leaf)) { throw "BACKUP_FILE_MISSING: $relative" }
    $parent = Split-Path -Parent $target
    if (!(Test-Path -LiteralPath $parent -PathType Container)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Copy-Item -LiteralPath $backup -Destination $target -Force
  } else {
    if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force }
  }
}
Write-Host "$Batch`_ROLLBACK=COMPLETED"
Write-Host "DATABASE_ROLLBACK=NOT_REQUIRED_NO_DATABASE_WRITE"
