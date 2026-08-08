[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$ProjectRoot,

  [Parameter(Mandatory = $false)]
  [string]$OutputDirectory = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BatchId = 'MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1'
$BaselineId = 'PALWAKF_ASSISTANT_SOURCE_BASELINE_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706'
$GuideMarker = '## MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1 — 2026-07-06'
$ChangelogMarker = '## 2026-07-06 — MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1'

function Write-Status([string]$Name, [string]$Value) {
  Write-Output ("{0}={1}" -f $Name, $Value)
}

function Copy-RelativeTree([string]$SourceDir, [string]$DestinationDir) {
  if (-not (Test-Path -LiteralPath $SourceDir)) { return }
  Get-ChildItem -LiteralPath $SourceDir -Recurse -File -Force | ForEach-Object {
    $relative = $_.FullName.Substring($SourceDir.Length).TrimStart('\','/')
    $target = Join-Path $DestinationDir $relative
    $targetDir = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
}

function Add-SectionIfMissing([string]$FilePath, [string]$Marker, [string]$SectionFile) {
  $existing = if (Test-Path -LiteralPath $FilePath) { Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8 } else { '' }
  if ($existing -notmatch [regex]::Escape($Marker)) {
    $section = Get-Content -LiteralPath $SectionFile -Raw -Encoding UTF8
    Add-Content -LiteralPath $FilePath -Value $section -Encoding UTF8
    return $true
  }
  return $false
}

function Test-ExcludedFromBaseline([System.IO.FileInfo]$File, [string]$Root, [string]$OutputRoot) {
  $relative = $File.FullName.Substring($Root.Length).TrimStart('\','/')
  $segments = $relative -split '[\\/]'
  $excludedDirectories = @('node_modules', 'dist', '.vite-dev-cache', '.git', '.turbo', '.next', '.cache')
  if ($segments | Where-Object { $excludedDirectories -contains $_ }) { return $true }

  $name = $File.Name
  if ($name -eq '.env') { return $true }
  if ($name -like '.env.*' -and $name -ne '.env.example') { return $true }
  if ($name -match '\.(zip|z[0-9]{2}|tmp)$') { return $true }
  if ($File.FullName.StartsWith($OutputRoot, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  return $false
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$PackageRoot = Split-Path -Parent $PSCommandPath
$UpdatesRoot = Join-Path $PackageRoot 'updates'

$required = @(
  (Join-Path $ProjectRoot 'package.json'),
  (Join-Path $ProjectRoot 'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md'),
  (Join-Path $ProjectRoot 'CHANGELOG.md'),
  (Join-Path $ProjectRoot 'client\src\pages\admin\SourceProvenanceRightsRegistry.tsx')
)
foreach ($path in $required) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Required project file not found: $path" }
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path (Split-Path -Parent $ProjectRoot) 'PALWAKF_ASSISTANT_BASELINES'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = Join-Path $ProjectRoot ("backups\{0}_BASELINE_CLOSURE_{1}" -f $BatchId, $stamp)
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$backupFiles = @(
  'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md',
  'CHANGELOG.md',
  'LATEST_BASELINE_CURRENT.md'
)
foreach ($relative in $backupFiles) {
  $source = Join-Path $ProjectRoot $relative
  if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $backupDir $relative) -Force }
}

$docsTarget = Join-Path $ProjectRoot 'docs\ar1_source_provenance_rights_operational_ux_refinement'
Copy-RelativeTree (Join-Path $UpdatesRoot 'docs\ar1_source_provenance_rights_operational_ux_refinement') $docsTarget
Copy-Item -LiteralPath (Join-Path $UpdatesRoot 'root\LATEST_BASELINE_CURRENT.md') -Destination (Join-Path $ProjectRoot 'LATEST_BASELINE_CURRENT.md') -Force

$guideUpdated = Add-SectionIfMissing (Join-Path $ProjectRoot 'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md') $GuideMarker (Join-Path $UpdatesRoot 'root\GUIDE_SECTION.md')
$changelogUpdated = Add-SectionIfMissing (Join-Path $ProjectRoot 'CHANGELOG.md') $ChangelogMarker (Join-Path $UpdatesRoot 'root\CHANGELOG_ENTRY.md')

$tracked = @(
  'client\src\pages\admin\SourceProvenanceRightsRegistry.tsx',
  'scripts\verify-mega-batch-ar1-source-provenance-rights-operational-ux-refinement.mjs',
  'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md',
  'CHANGELOG.md',
  'LATEST_BASELINE_CURRENT.md',
  'docs\ar1_source_provenance_rights_operational_ux_refinement\BASELINE_ACCEPTANCE_STATE_20260706.md',
  'docs\ar1_source_provenance_rights_operational_ux_refinement\SESSION_HANDOFF_20260706.md',
  'docs\ar1_source_provenance_rights_operational_ux_refinement\ERROR_RECORD_BASELINE_HYGIENE_LOCKFILE_20260706.md',
  'docs\ar1_source_provenance_rights_operational_ux_refinement\EVIDENCE_ACCEPTANCE_20260706.md'
)

$hashes = @()
foreach ($relative in $tracked) {
  $full = Join-Path $ProjectRoot $relative
  if (Test-Path -LiteralPath $full) {
    $hashes += [pscustomobject]@{ path = $relative.Replace('\','/'); sha256 = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash }
  } else {
    $hashes += [pscustomobject]@{ path = $relative.Replace('\','/'); sha256 = 'NOT_PRESENT' }
  }
}

$manifest = [ordered]@{
  baseline_id = $BaselineId
  batch_id = $BatchId
  created_at_local = (Get-Date).ToString('o')
  acceptance = [ordered]@{
    local_only = $true
    static_verify = 'PASS'
    patch_apply = 'PASS'
    browser_uat = 'PASS'
    staging = 'NOT_APPROVED'
    production = 'NOT_APPROVED'
  }
  exclusions = @('node_modules/', 'dist/', '.vite-dev-cache/', '.env', '.env.* except .env.example', 'generated archives')
  tracked_files = $hashes
  known_deferred = @(
    'Mega Batch C support-layer SQL / rights activation is not applied.',
    'C4 has zero eligible deterministic candidates in accepted browser UAT.',
    'Strict frozen lockfile revalidation is not re-evidenced in this closure.'
  )
}
$manifestPath = Join-Path $ProjectRoot 'BASELINE_MANIFEST_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706.json'
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$baselineStage = Join-Path $OutputDirectory ("_stage_source_{0}" -f $stamp)
$updatesStage = Join-Path $OutputDirectory ("_stage_updates_{0}" -f $stamp)
New-Item -ItemType Directory -Path $baselineStage -Force | Out-Null
New-Item -ItemType Directory -Path $updatesStage -Force | Out-Null

Get-ChildItem -LiteralPath $ProjectRoot -Recurse -File -Force | ForEach-Object {
  if (-not (Test-ExcludedFromBaseline $_ $ProjectRoot $OutputDirectory)) {
    $relative = $_.FullName.Substring($ProjectRoot.Length).TrimStart('\','/')
    $target = Join-Path $baselineStage $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
}

$updatesOnly = @(
  'client\src\pages\admin\SourceProvenanceRightsRegistry.tsx',
  'scripts\verify-mega-batch-ar1-source-provenance-rights-operational-ux-refinement.mjs',
  'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md',
  'CHANGELOG.md',
  'LATEST_BASELINE_CURRENT.md',
  'BASELINE_MANIFEST_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706.json',
  'docs\ar1_source_provenance_rights_operational_ux_refinement'
)
foreach ($relative in $updatesOnly) {
  $source = Join-Path $ProjectRoot $relative
  if (-not (Test-Path -LiteralPath $source)) { continue }
  $target = Join-Path $updatesStage $relative
  if ((Get-Item -LiteralPath $source).PSIsContainer) {
    Copy-RelativeTree $source $target
  } else {
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
  }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$baselineZip = Join-Path $OutputDirectory ("{0}_{1}.zip" -f $BaselineId, $stamp)
$updatesZip = Join-Path $OutputDirectory ("PALWAKF_ASSISTANT_UPDATES_ONLY_AR1_UX_REFINEMENT_V1_20260706_{0}.zip" -f $stamp)
[System.IO.Compression.ZipFile]::CreateFromDirectory($baselineStage, $baselineZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
[System.IO.Compression.ZipFile]::CreateFromDirectory($updatesStage, $updatesZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$index = @"
# Baseline Closure Index

- Batch: `$BatchId`
- Baseline ID: `$BaselineId`
- Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')
- Local only: yes
- Staging approved: no
- Production approved: no

## Archives

- Source baseline: `$baselineZip`
- Updates-only: `$updatesZip`

## SHA-256

- Source baseline: $((Get-FileHash -LiteralPath $baselineZip -Algorithm SHA256).Hash)
- Updates-only: $((Get-FileHash -LiteralPath $updatesZip -Algorithm SHA256).Hash)

## Documentation backup

`$backupDir`
"@
$indexPath = Join-Path $OutputDirectory ("BASELINE_CLOSURE_INDEX_AR1_UX_REFINEMENT_V1_{0}.md" -f $stamp)
$index | Set-Content -LiteralPath $indexPath -Encoding UTF8

Remove-Item -LiteralPath $baselineStage, $updatesStage -Recurse -Force

Write-Status 'BASELINE_DOCUMENTATION_APPLY' 'PASS'
Write-Status 'GUIDE_UPDATED' (if ($guideUpdated) { 'APPLIED' } else { 'ALREADY_PRESENT' })
Write-Status 'CHANGELOG_UPDATED' (if ($changelogUpdated) { 'APPLIED' } else { 'ALREADY_PRESENT' })
Write-Status 'SESSION_HANDOFF_PRESENT' (if (Test-Path -LiteralPath (Join-Path $docsTarget 'SESSION_HANDOFF_20260706.md')) { 'PASS' } else { 'FAIL' })
Write-Status 'BASELINE_MANIFEST_PRESENT' 'PASS'
Write-Status 'BASELINE_MANIFEST' $manifestPath
Write-Status 'SOURCE_BASELINE_ARCHIVE' 'PASS'
Write-Status 'SOURCE_BASELINE_ZIP' $baselineZip
Write-Status 'SOURCE_BASELINE_SHA256' ((Get-FileHash -LiteralPath $baselineZip -Algorithm SHA256).Hash)
Write-Status 'UPDATES_ONLY_ARCHIVE' 'PASS'
Write-Status 'UPDATES_ONLY_ZIP' $updatesZip
Write-Status 'UPDATES_ONLY_SHA256' ((Get-FileHash -LiteralPath $updatesZip -Algorithm SHA256).Hash)
Write-Status 'CLOSURE_INDEX' $indexPath
Write-Status 'FINAL_RESULT' 'PASS'
