param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706",
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$Batch = "MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1"
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadRoot = Join-Path $PackageRoot "payload"
$ManifestPath = Join-Path $PackageRoot "PREIMAGE_SHA256.json"

if (!(Test-Path -LiteralPath $SourceRoot -PathType Container)) { throw "SOURCE_ROOT_NOT_FOUND: $SourceRoot" }
if (!(Test-Path -LiteralPath $PayloadRoot -PathType Container)) { throw "PAYLOAD_ROOT_NOT_FOUND: $PayloadRoot" }
if (!(Test-Path -LiteralPath $ManifestPath -PathType Leaf)) { throw "MANIFEST_NOT_FOUND: $ManifestPath" }

$entries = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$preflight = @()
$allAlreadyApplied = $true

foreach ($entry in $entries) {
  $relative = [string]$entry.path
  $windowsRelative = $relative -replace '/', '\'
  $target = Join-Path $SourceRoot $windowsRelative
  $payload = Join-Path $PayloadRoot $windowsRelative
  if (!(Test-Path -LiteralPath $payload -PathType Leaf)) { throw "PAYLOAD_FILE_NOT_FOUND: $relative" }
  $payloadHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $payload).Hash.ToUpperInvariant()
  $expectedPost = ([string]$entry.postimage_sha256).ToUpperInvariant()
  if ($payloadHash -ne $expectedPost) { throw "PAYLOAD_HASH_MISMATCH path=$relative expected=$expectedPost actual=$payloadHash" }

  $exists = Test-Path -LiteralPath $target -PathType Leaf
  $actual = $null
  $status = $null
  if ($exists) {
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToUpperInvariant()
    if ($actual -eq $expectedPost) {
      $status = "ALREADY_POSTIMAGE"
    } else {
      $allAlreadyApplied = $false
      $expectedPre = if ($null -eq $entry.preimage_sha256) { $null } else { ([string]$entry.preimage_sha256).ToUpperInvariant() }
      if ([string]::IsNullOrWhiteSpace($expectedPre)) { throw "CREATE_TARGET_DRIFT path=$relative actual=$actual" }
      if ($actual -ne $expectedPre) { throw "PREIMAGE_MISMATCH path=$relative expected=$expectedPre actual=$actual" }
      $status = "READY_REPLACE"
    }
  } else {
    $allAlreadyApplied = $false
    if ($null -ne $entry.preimage_sha256 -and ![string]::IsNullOrWhiteSpace([string]$entry.preimage_sha256)) {
      throw "REQUIRED_PREIMAGE_MISSING path=$relative"
    }
    $status = "READY_CREATE"
  }
  $preflight += [ordered]@{ path=$relative; status=$status; actual_sha256=$actual; postimage_sha256=$expectedPost }
}

Write-Host ""
Write-Host "$Batch`_PREFLIGHT=PASS"
$preflight | ForEach-Object { Write-Host ("{0} :: {1}" -f $_.status, $_.path) }

if ($WhatIf) {
  Write-Host "WHATIF=TRUE"
  Write-Host "NO_FILES_CHANGED=TRUE"
  exit 0
}

if ($allAlreadyApplied) {
  Write-Host "$Batch=ALREADY_APPLIED"
} else {
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupDir = Join-Path $SourceRoot "backups\$Batch`_$stamp"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $backupEntries = @()

  foreach ($entry in $entries) {
    $relative = [string]$entry.path
    $windowsRelative = $relative -replace '/', '\'
    $target = Join-Path $SourceRoot $windowsRelative
    $payload = Join-Path $PayloadRoot $windowsRelative
    $targetDir = Split-Path -Parent $target
    if (!(Test-Path -LiteralPath $targetDir -PathType Container)) { New-Item -ItemType Directory -Force -Path $targetDir | Out-Null }

    $existed = Test-Path -LiteralPath $target -PathType Leaf
    $backupRelative = $null
    if ($existed) {
      $backupRelative = $windowsRelative
      $backupTarget = Join-Path $backupDir $backupRelative
      $backupTargetDir = Split-Path -Parent $backupTarget
      if (!(Test-Path -LiteralPath $backupTargetDir -PathType Container)) { New-Item -ItemType Directory -Force -Path $backupTargetDir | Out-Null }
      Copy-Item -LiteralPath $target -Destination $backupTarget -Force
    }
    $backupEntries += [ordered]@{ path=$relative; existed_before=$existed; backup_relative=$backupRelative }
    Copy-Item -LiteralPath $payload -Destination $target -Force
  }

  $backupEntries | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $backupDir "BACKUP_MANIFEST.json") -Encoding UTF8

  foreach ($entry in $entries) {
    $relative = [string]$entry.path
    $target = Join-Path $SourceRoot ($relative -replace '/', '\')
    $actualPost = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToUpperInvariant()
    $expectedPost = ([string]$entry.postimage_sha256).ToUpperInvariant()
    if ($actualPost -ne $expectedPost) { throw "POSTIMAGE_HASH_MISMATCH path=$relative expected=$expectedPost actual=$actualPost" }
  }

  $receipt = [ordered]@{
    batch=$Batch
    applied_at=(Get-Date).ToString("s")
    source_root=$SourceRoot
    backup_dir=$backupDir
    file_count=$entries.Count
    no_sql=$true
    no_database_write=$true
    no_source_link_write=$true
    no_rights_assignment=$true
    no_chat_or_public_release=$true
    production_not_approved=$true
  }
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $backupDir "APPLY_RECEIPT.json") -Encoding UTF8
  Write-Host "BACKUP_DIR=$backupDir"
}

Push-Location $SourceRoot
try {
  node "scripts/verify-mega-batch-ar1-c4-direct-knowledge-document-metadata-exact-lookup-repair-v1.mjs"
  if ($LASTEXITCODE -ne 0) { throw "STATIC_VERIFIER_FAILED exit=$LASTEXITCODE" }
} finally { Pop-Location }

Write-Host ""
Write-Host "$Batch=APPLIED_AND_STATICALLY_VERIFIED"
Write-Host "RUNTIME_UAT=PENDING"
Write-Host "DATABASE_WRITE=NO"
Write-Host "PRODUCTION_NOT_APPROVED=YES"
