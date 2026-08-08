[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$ProjectRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path

$checks = @()
function Add-Check([string]$Name, [bool]$Condition) {
  $script:checks += [pscustomobject]@{ Name = $Name; Passed = $Condition }
  Write-Output ("{0}={1}" -f $Name, $(if ($Condition) { 'PASS' } else { 'FAIL' }))
}

$guide = Join-Path $ProjectRoot 'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md'
$changelog = Join-Path $ProjectRoot 'CHANGELOG.md'
$source = Join-Path $ProjectRoot 'client\src\pages\admin\SourceProvenanceRightsRegistry.tsx'
$docs = Join-Path $ProjectRoot 'docs\ar1_source_provenance_rights_operational_ux_refinement'
$manifest = Join-Path $ProjectRoot 'BASELINE_MANIFEST_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706.json'

Add-Check 'GUIDE_UPDATED' ((Test-Path -LiteralPath $guide) -and ((Get-Content -LiteralPath $guide -Raw -Encoding UTF8) -match 'MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1'))
Add-Check 'CHANGELOG_UPDATED' ((Test-Path -LiteralPath $changelog) -and ((Get-Content -LiteralPath $changelog -Raw -Encoding UTF8) -match 'MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1'))
Add-Check 'SESSION_HANDOFF_PRESENT' (Test-Path -LiteralPath (Join-Path $docs 'SESSION_HANDOFF_20260706.md'))
Add-Check 'BASELINE_ACCEPTANCE_PRESENT' (Test-Path -LiteralPath (Join-Path $docs 'BASELINE_ACCEPTANCE_STATE_20260706.md'))
Add-Check 'ERROR_RECORD_PRESENT' (Test-Path -LiteralPath (Join-Path $docs 'ERROR_RECORD_BASELINE_HYGIENE_LOCKFILE_20260706.md'))
Add-Check 'BASELINE_MANIFEST_PRESENT' (Test-Path -LiteralPath $manifest)

$sourceText = if (Test-Path -LiteralPath $source) { Get-Content -LiteralPath $source -Raw -Encoding UTF8 } else { '' }
Add-Check 'AR1_UX_SOURCE_MARKERS' (($sourceText -match 'الخطوة المطلوبة الآن') -and ($sourceText -match 'C3') -and ($sourceText -match 'C4') -and ($sourceText -match 'إنشاء جلسة AR1'))

$failed = @($checks | Where-Object { -not $_.Passed })
if ($failed.Count -gt 0) {
  Write-Output 'FINAL_RESULT=FAIL'
  exit 1
}
Write-Output 'FINAL_RESULT=PASS'
