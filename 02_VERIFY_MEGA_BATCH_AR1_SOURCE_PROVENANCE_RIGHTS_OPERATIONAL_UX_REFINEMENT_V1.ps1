[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path $_ })]
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
Push-Location $ProjectRoot
try {
  Write-Host '1/3 Static scope and guard verification' -ForegroundColor Cyan
  & node .\scripts\verify-mega-batch-ar1-source-provenance-rights-operational-ux-refinement.mjs
  if ($LASTEXITCODE -ne 0) { throw "STATIC_VERIFY_FAILED=$LASTEXITCODE" }

  Write-Host '2/3 TypeScript check' -ForegroundColor Cyan
  & pnpm.cmd run check
  if ($LASTEXITCODE -ne 0) { throw "TSC_CHECK_FAILED=$LASTEXITCODE" }

  Write-Host '3/3 Production build' -ForegroundColor Cyan
  & pnpm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "BUILD_FAILED=$LASTEXITCODE" }

  Write-Host 'FINAL_RESULT=PASS' -ForegroundColor Green
  Write-Host 'NEXT=Run browser UAT from docs\ar1_source_provenance_rights_operational_ux_refinement\UAT_RUNBOOK_AR.md'
}
finally {
  Pop-Location
}
