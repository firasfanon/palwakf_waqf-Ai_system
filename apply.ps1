param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $PackageRoot 'PATCH_MANIFEST.json'
$PayloadRoot = Join-Path $PackageRoot 'payload'
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Resolve-ProjectPath([string]$RelativePath) {
  return Join-Path $ProjectRoot ($RelativePath -replace '/', '\')
}
if (-not (Test-Path -LiteralPath $ProjectRoot)) { throw "AR1R_PROJECT_ROOT_NOT_FOUND::$ProjectRoot" }

$CopyEntries = @()
foreach ($Entry in $Manifest.entries) {
  $Target = Resolve-ProjectPath $Entry.path
  if ($Entry.is_new -eq $true) {
    if (Test-Path -LiteralPath $Target) {
      $ActualHash = Get-Sha256 $Target
      if ($ActualHash -ne $Entry.post_hash) { throw "AR1R_NEWFILE_COLLISION::$($Entry.path)::$ActualHash" }
    } else {
      $CopyEntries += $Entry
    }
    continue
  }
  if (-not (Test-Path -LiteralPath $Target)) { throw "AR1R_PREIMAGE_MISSING::$($Entry.path)" }
  $ActualHash = Get-Sha256 $Target
  if ($ActualHash -eq $Entry.post_hash) { continue }
  if ($ActualHash -ne $Entry.pre_hash) { throw "AR1R_PREIMAGE_MISMATCH::$($Entry.path)::$ActualHash" }
  $CopyEntries += $Entry
}

$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupRoot = Join-Path $ProjectRoot ("backups\mega_batch_ar1_corpus_resolution_and_internal_pilot_activation_" + $Timestamp)
foreach ($Entry in $CopyEntries) {
  if ($Entry.is_new -eq $true) { continue }
  $Target = Resolve-ProjectPath $Entry.path
  $Backup = Join-Path $BackupRoot ($Entry.path -replace '/', '\')
  New-Item -ItemType Directory -Path (Split-Path -Parent $Backup) -Force | Out-Null
  Copy-Item -LiteralPath $Target -Destination $Backup -Force
}
foreach ($Entry in $CopyEntries) {
  $Source = Join-Path $PayloadRoot ($Entry.path -replace '/', '\')
  $Target = Resolve-ProjectPath $Entry.path
  if (-not (Test-Path -LiteralPath $Source)) { throw "AR1R_PAYLOAD_MISSING::$($Entry.path)" }
  New-Item -ItemType Directory -Path (Split-Path -Parent $Target) -Force | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Target -Force
}
foreach ($Entry in $Manifest.entries) {
  $Target = Resolve-ProjectPath $Entry.path
  if (-not (Test-Path -LiteralPath $Target)) { throw "AR1R_POSTIMAGE_MISSING::$($Entry.path)" }
  $ActualHash = Get-Sha256 $Target
  if ($ActualHash -ne $Entry.post_hash) { throw "AR1R_POSTIMAGE_MISMATCH::$($Entry.path)::$ActualHash" }
}
Push-Location $ProjectRoot
try { node scripts/verify-mega-batch-ar1-governed-agentic-rag-internal-pilot.mjs } finally { Pop-Location }
Write-Output 'MEGA_BATCH_AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION_APPLY=PASS'
Write-Output "AR1_CORPUS_RESOLUTION_FILES_CHANGED=$($CopyEntries.Count)"
Write-Output 'SQL_OPERATOR_APPLY=NOT_APPLICABLE'
Write-Output 'DATABASE_WRITE_BY_APPLY=0'
Write-Output 'EXTERNAL_WEB_REQUESTS_BY_APPLY=0'
Write-Output 'NO_FUZZY_OR_SEMANTIC_CORPUS_LINKING=PASS_BY_CODE_SCOPE'
Write-Output 'PUBLIC_CHAT_RELEASE=NOT_AUTHORIZED'
Write-Output 'PUBLIC_RELEASE=NOT_AUTHORIZED'
Write-Output 'PRODUCTION=NOT_AUTHORIZED'
Write-Output "BACKUP_PATH=$BackupRoot"
