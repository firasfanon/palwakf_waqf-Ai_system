<#
Mega Batch 29A — Remote Staging Evidence Collector
Captures only public/safe health JSON. It never reads environment variables or secrets.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]$StagingBaseUrl,

  [string]$EvidenceRoot = (Join-Path (Get-Location) 'evidence\mega_batch_29a'),

  [string]$DeploymentRef = 'record-in-manifest',

  [string]$BaselineId = 'v65_mega_batch_29a_remote_staging_rbac_rls_uat_preapply_2026_06_20'
)

$ErrorActionPreference = 'Stop'
$base = $StagingBaseUrl.TrimEnd('/')
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outDir = Join-Path $EvidenceRoot $timestamp
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$endpoints = @(
  @{ Name = 'database-config'; Path = '/api/health/database-config' },
  @{ Name = 'supabase'; Path = '/api/health/supabase' },
  @{ Name = 'readiness'; Path = '/api/health/readiness' },
  @{ Name = 'staging-evidence'; Path = '/api/health/staging-evidence' }
)

$results = @()
foreach ($endpoint in $endpoints) {
  $url = "$base$($endpoint.Path)"
  $path = Join-Path $outDir "$($endpoint.Name).json"
  try {
    $response = Invoke-WebRequest -Uri $url -Method Get -Headers @{ Accept = 'application/json' } -UseBasicParsing
    $response.Content | Set-Content -Path $path -Encoding utf8
    $results += [ordered]@{ name = $endpoint.Name; url = $url; status = [int]$response.StatusCode; file = (Split-Path $path -Leaf); captured = $true }
  } catch {
    $message = $_.Exception.Message
    @{ error = $message; url = $url } | ConvertTo-Json -Depth 5 | Set-Content -Path $path -Encoding utf8
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { $null }
    $results += [ordered]@{ name = $endpoint.Name; url = $url; status = $status; file = (Split-Path $path -Leaf); captured = $false; error = $message }
  }
}

$manifest = [ordered]@{
  contract = 'palwakf_mb29a_remote_staging_capture_v1'
  captured_at_local = (Get-Date).ToString('o')
  staging_base_url = $base
  deployment_ref = $DeploymentRef
  baseline_id = $BaselineId
  endpoints = $results
  next_gate = 'MANUAL_BROWSER_RBAC_RLS_NEGATIVE_UAT_REQUIRED'
  production_approved = $false
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $outDir 'capture_manifest.json') -Encoding utf8
Write-Host "MB29A evidence written to: $outDir"
Write-Host "Do not treat this as production approval. Capture browser, RBAC/RLS, and secret-isolation evidence next."
