param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
)

$ErrorActionPreference = "Stop"

$Batch = "MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1"
$ExpectedGovernedHash = "6F0B15D99679DB3D97089FC76627F814E94F3D598ADDE2FAE5EC396A936B3CD0"
$ExpectedRouterHash = "8E058D6C376B7DDBFD6DAC6B37EBA3E6D5B660D3AAA5FABB98422C8E08163B95"
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadFile = Join-Path $PackageRoot "payload\server\governedAgenticRagPilot.ts"

$TargetGoverned = Join-Path $SourceRoot "server\governedAgenticRagPilot.ts"
$TargetRouter = Join-Path $SourceRoot "server\routers.ts"

if (!(Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw "SOURCE_ROOT_NOT_FOUND: $SourceRoot"
}
if (!(Test-Path -LiteralPath $TargetGoverned -PathType Leaf)) {
  throw "TARGET_NOT_FOUND: $TargetGoverned"
}
if (!(Test-Path -LiteralPath $TargetRouter -PathType Leaf)) {
  throw "ROUTER_NOT_FOUND: $TargetRouter"
}
if (!(Test-Path -LiteralPath $PayloadFile -PathType Leaf)) {
  throw "PAYLOAD_NOT_FOUND: $PayloadFile"
}

$ActualGovernedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetGoverned).Hash.ToUpperInvariant()
$ActualRouterHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetRouter).Hash.ToUpperInvariant()

if ($ActualGovernedHash -ne $ExpectedGovernedHash) {
  throw "PREIMAGE_MISMATCH governedAgenticRagPilot.ts expected=$ExpectedGovernedHash actual=$ActualGovernedHash"
}

if ($ActualRouterHash -ne $ExpectedRouterHash) {
  throw "ROUTER_PREIMAGE_MISMATCH routers.ts expected=$ExpectedRouterHash actual=$ActualRouterHash"
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $SourceRoot "backups\$Batch`_$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Copy-Item -LiteralPath $TargetGoverned -Destination (Join-Path $backupDir "governedAgenticRagPilot.ts.preimage") -Force
Copy-Item -LiteralPath $TargetRouter -Destination (Join-Path $backupDir "routers.ts.preimage.readonly") -Force

Copy-Item -LiteralPath $PayloadFile -Destination $TargetGoverned -Force

$PostGovernedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetGoverned).Hash.ToUpperInvariant()

$result = [ordered]@{
  batch = $Batch
  applied_at = (Get-Date).ToString("s")
  source_root = $SourceRoot
  changed_files = @("server\governedAgenticRagPilot.ts")
  readonly_verified_files = @("server\routers.ts")
  preimage_governed_sha256 = $ActualGovernedHash
  postimage_governed_sha256 = $PostGovernedHash
  router_sha256_readonly = $ActualRouterHash
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
Write-Host "POSTIMAGE_GOVERNED_SHA256=$PostGovernedHash"
Write-Host "APPLY_RESULT=$resultPath"
Write-Host ""
