[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path $_ })]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$BundleRoot = $PSScriptRoot
$UpdatesRoot = Join-Path $BundleRoot 'updates'

$expectedPreimage = @{
  'client/src/pages/admin/SourceProvenanceRightsRegistry.tsx' = '4ca7c3768e511f2cf07f5e7e0eaa29aa089cd4f8ca5ccc3a7fccc85fd509ebef'
  'server/governedAgenticRagPilot.ts' = '891387c53b24da8e9a2bd8ceda1829fb15602804c0de32f2415900be150de9e7'
  'server/sourceProvenanceRights.ts' = '3a64577ba13bc36f462b5524a573d6a34f533b96dee7379f16f9c3a1bf2e707f'
  'client/src/config/adminRegistryV2.ts' = '243dd3c5dc365799aad592bcd2b6d81d2102e64622bec057ce85112b71e44010'
  'package.json' = '91a9ef001fd05f7c15cc958581e8f5d94a1924e01b8e1d8e2e50d8d2be713cf0'
}

function Get-RelativeSha256 {
  param([string]$RelativePath)
  $fullPath = Join-Path $ProjectRoot $RelativePath
  if (-not (Test-Path -LiteralPath $fullPath)) { throw "MISSING_TARGET=$RelativePath" }
  return (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
}

Write-Host 'AR1 UX refinement preflight started.' -ForegroundColor Cyan
foreach ($relativePath in $expectedPreimage.Keys) {
  $actual = Get-RelativeSha256 -RelativePath $relativePath
  $expected = $expectedPreimage[$relativePath]
  if ($actual -ne $expected) {
    throw "PREIMAGE_MISMATCH=$relativePath`nEXPECTED=$expected`nACTUAL=$actual`nNo files were changed. Stop and reconcile the baseline before applying this bundle."
  }
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $ProjectRoot ".pwf-backups\MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$sourceFiles = Get-ChildItem -LiteralPath $UpdatesRoot -Recurse -File
foreach ($sourceFile in $sourceFiles) {
  $relativePath = $sourceFile.FullName.Substring($UpdatesRoot.Length).TrimStart('\', '/')
  $targetPath = Join-Path $ProjectRoot $relativePath
  $targetDirectory = Split-Path -Parent $targetPath
  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null

  if (Test-Path -LiteralPath $targetPath) {
    $backupPath = Join-Path $backupRoot $relativePath
    $backupDirectory = Split-Path -Parent $backupPath
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    Copy-Item -LiteralPath $targetPath -Destination $backupPath -Force
  }

  Copy-Item -LiteralPath $sourceFile.FullName -Destination $targetPath -Force
}

$staticVerifier = Join-Path $ProjectRoot 'scripts\verify-mega-batch-ar1-source-provenance-rights-operational-ux-refinement.mjs'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'NODE_NOT_FOUND: install or expose Node.js before running the static verifier.'
}
& node $staticVerifier
if ($LASTEXITCODE -ne 0) { throw "STATIC_VERIFY_FAILED=$LASTEXITCODE" }

$receipt = [ordered]@{
  batch = 'MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1'
  applied_at = (Get-Date).ToString('o')
  project_root = $ProjectRoot
  backup_root = $backupRoot
  preimage_verified = $true
  static_verify = 'PASS'
  schema_change = $false
  rls_change = $false
  rpc_change = $false
  server_logic_change = $false
  chat_or_release_change = $false
  runtime_uat = 'PENDING'
  baseline_update = 'PENDING_RUNTIME_ACCEPTANCE'
}
$receiptPath = Join-Path $backupRoot 'APPLY_RECEIPT.json'
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding utf8

Write-Host 'AR1 UX refinement apply completed.' -ForegroundColor Green
Write-Host "BACKUP_ROOT=$backupRoot"
Write-Host 'NEXT=Run 02_VERIFY... then complete the two-screen browser UAT.'
