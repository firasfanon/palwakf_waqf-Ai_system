param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
)

$ErrorActionPreference = "Stop"
$Batch = "MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1"
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $PackageRoot "POSTIMAGE_SHA256.json"
if (!(Test-Path -LiteralPath $SourceRoot -PathType Container)) { throw "SOURCE_ROOT_NOT_FOUND: $SourceRoot" }
$entries = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($entry in $entries) {
  $relative = [string]$entry.path
  $target = Join-Path $SourceRoot ($relative -replace '/', '\')
  if (!(Test-Path -LiteralPath $target -PathType Leaf)) { throw "POSTIMAGE_FILE_MISSING: $relative" }
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToUpperInvariant()
  $expected = ([string]$entry.postimage_sha256).ToUpperInvariant()
  if ($actual -ne $expected) { throw "POSTIMAGE_MISMATCH path=$relative expected=$expected actual=$actual" }
  Write-Host "PASS_HASH :: $relative :: $actual"
}
Push-Location $SourceRoot
try {
  node "scripts/verify-mega-batch-ar1-c4-direct-knowledge-document-metadata-exact-lookup-repair-v1.mjs"
  if ($LASTEXITCODE -ne 0) { throw "STATIC_VERIFIER_FAILED exit=$LASTEXITCODE" }
} finally { Pop-Location }
Write-Host "$Batch`_POSTIMAGE_VERIFY=PASS"
Write-Host "RUNTIME_UAT=PENDING"
Write-Host "NO_DATABASE_WRITE=TRUE"
