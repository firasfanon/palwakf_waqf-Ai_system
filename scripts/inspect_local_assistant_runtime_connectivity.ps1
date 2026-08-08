[CmdletBinding()]
param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')
$paths = @(
  '/api/health/database-config',
  '/api/health/supabase',
  '/api/health/readiness'
)

foreach ($path in $paths) {
  $uri = "$base$path"
  try {
    $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 15
    Write-Host "HTTP $($response.StatusCode) $path" -ForegroundColor Green
    try { $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 8 } catch { $response.Content }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $status $path" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) { Write-Output $_.ErrorDetails.Message } else { Write-Output $_.Exception.Message }
  }
}

Write-Host 'No secret or environment-variable values are printed by this script.' -ForegroundColor Cyan
