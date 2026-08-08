param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
)

$ErrorActionPreference = "Stop"

$Batch = "MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1"
$ExpectedPreimageHash = "E7EDE391B6C5B759086E539E9A289FC7EA01795B4483DB40BC37BB783A94CC9D"
$ExpectedPostimageHash = "6C78DAF6D613A10F60AA26CC5E28FBB7DE7CF7A4064BECA72D68CA04E00EF92B"
$ExpectedRouterHash = "8E058D6C376B7DDBFD6DAC6B37EBA3E6D5B660D3AAA5FABB98422C8E08163B95"

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadFile = Join-Path $PackageRoot "payload\server\governedAgenticRagPilot.ts"

$TargetGoverned = Join-Path $SourceRoot "server\governedAgenticRagPilot.ts"
$TargetRouter = Join-Path $SourceRoot "server\routers.ts"

if (!(Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw "SOURCE_ROOT_NOT_FOUND: $SourceRoot"
}
if (!(Test-Path -LiteralPath $PayloadFile -PathType Leaf)) {
  throw "PAYLOAD_NOT_FOUND: $PayloadFile"
}
if (!(Test-Path -LiteralPath $TargetGoverned -PathType Leaf)) {
  throw "TARGET_NOT_FOUND: $TargetGoverned"
}

$ActualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetGoverned).Hash.ToUpperInvariant()
$PayloadHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $PayloadFile).Hash.ToUpperInvariant()

if ($PayloadHash -ne $ExpectedPostimageHash) {
  throw "PAYLOAD_HASH_MISMATCH expected=$ExpectedPostimageHash actual=$PayloadHash"
}

if ($ActualHash -eq $ExpectedPostimageHash) {
  Write-Host ""
  Write-Host "$Batch=ALREADY_APPLIED"
  Write-Host "POSTIMAGE_GOVERNED_SHA256=$ActualHash"
  Write-Host "NO_ACTION_NEEDED=TRUE"
  Write-Host ""
  exit 0
}

if ($ActualHash -ne $ExpectedPreimageHash) {
  throw "PREIMAGE_MISMATCH governedAgenticRagPilot.ts expected=$ExpectedPreimageHash actual=$ActualHash"
}

$RouterHash = $null
if (Test-Path -LiteralPath $TargetRouter -PathType Leaf) {
  $RouterHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetRouter).Hash.ToUpperInvariant()
  if ($RouterHash -ne $ExpectedRouterHash) {
    Write-Warning "ROUTER_HASH_DRIFT_READONLY expected=$ExpectedRouterHash actual=$RouterHash"
  }
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $SourceRoot "backups\$Batch`_$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Copy-Item -LiteralPath $TargetGoverned -Destination (Join-Path $backupDir "governedAgenticRagPilot.ts.preimage") -Force
if (Test-Path -LiteralPath $TargetRouter -PathType Leaf) {
  Copy-Item -LiteralPath $TargetRouter -Destination (Join-Path $backupDir "routers.ts.readonly") -Force
}

Copy-Item -LiteralPath $PayloadFile -Destination $TargetGoverned -Force

$PostHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetGoverned).Hash.ToUpperInvariant()
if ($PostHash -ne $ExpectedPostimageHash) {
  throw "POSTIMAGE_HASH_MISMATCH expected=$ExpectedPostimageHash actual=$PostHash"
}

$result = [ordered]@{
  batch = $Batch
  applied_at = (Get-Date).ToString("s")
  source_root = $SourceRoot
  changed_files = @("server\governedAgenticRagPilot.ts")
  preimage_governed_sha256 = $ActualHash
  postimage_governed_sha256 = $PostHash
  router_sha256_readonly = $RouterHash
  backup_dir = $backupDir
  no_sql = $true
  no_supabase_write = $true
  no_source_registry_write = $true
  no_rights_assignment = $true
  no_ledger_decision = $true
  no_chat_rag = $true
  no_ar1_session_start = $true
}

$resultPath = Join-Path $backupDir "APPLY_RESULT.json"
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $resultPath -Encoding UTF8

Write-Host ""
Write-Host "$Batch=APPLIED"
Write-Host "BACKUP_DIR=$backupDir"
Write-Host "POSTIMAGE_GOVERNED_SHA256=$PostHash"
Write-Host "APPLY_RESULT=$resultPath"
Write-Host ""
