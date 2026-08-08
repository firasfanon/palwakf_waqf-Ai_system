[CmdletBinding()]
param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706",
  [string]$OutputParent = (Join-Path $env:USERPROFILE "Downloads")
)

$ErrorActionPreference = "Stop"

function Write-Utf8File {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true, Position = 0)][string]$Path,
    [Parameter(Mandatory = $true, Position = 1, ValueFromPipeline = $true)][AllowEmptyString()][string]$Value
  )

  process {
    $Value | Set-Content -LiteralPath $Path -Encoding UTF8
  }
}
function Get-SafeRelativePath {
  param([Parameter(Mandatory = $true)][string]$BasePath, [Parameter(Mandatory = $true)][string]$FullPath)
  $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\') + '\'
  $full = [System.IO.Path]::GetFullPath($FullPath)
  if ($full.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $full.Substring($base.Length).Replace('\', '/')
  }
  return $full.Replace('\', '/')
}

function Test-ExcludedPath {
  param([Parameter(Mandatory = $true)][string]$FullPath)
  $segments = $FullPath -split '[\\/]'
  $excluded = @('node_modules', 'dist', 'build', 'coverage', '.git', '.next', 'backups', '.pwf-backups', '.palwakf_backups', 'C4_RECON_BASELINE_CAPTURE_20260704_000202', 'payload', 'files')
  return @($segments | Where-Object { $excluded -contains $_ }).Count -gt 0
}

function Get-EnvKeySummary {
  param([Parameter(Mandatory = $true)][System.IO.FileInfo]$File)
  $result = @()
  try {
    $lineNumber = 0
    foreach ($line in (Get-Content -LiteralPath $File.FullName -Encoding UTF8 -ErrorAction Stop)) {
      $lineNumber++
      if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $key = $Matches[1]
        $rawValue = $Matches[2]
        $state = if ([string]::IsNullOrWhiteSpace($rawValue)) { 'blank' } elseif ($rawValue -match '(?i)(replace|change|example|placeholder|your_)') { 'placeholder_like' } else { 'present_redacted' }
        $result += [pscustomobject]@{ key = $key; value_state = $state; line = $lineNumber }
      }
    }
  } catch {
    $result += [pscustomobject]@{ key = '__READ_ERROR__'; value_state = $_.Exception.Message; line = 0 }
  }
  return $result
}

if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw "SOURCE_ROOT_NOT_FOUND=$SourceRoot"
}
if (-not (Test-Path -LiteralPath $OutputParent -PathType Container)) {
  New-Item -ItemType Directory -Path $OutputParent -Force | Out-Null
}

$resolvedSourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outDir = Join-Path $OutputParent "ASSISTANT_STAGING_DEPLOYMENT_DISCOVERY_$stamp"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$artifactNames = @(
  'vercel.json','netlify.toml','render.yaml','render.yml','railway.json','fly.toml',
  'app.yaml','app.yml','Dockerfile','docker-compose.yml','docker-compose.yaml',
  'compose.yml','compose.yaml','Procfile','ecosystem.config.js','ecosystem.config.cjs',
  'nginx.conf','Caddyfile','serverless.yml','serverless.yaml','.gitlab-ci.yml'
)
$textExtensions = @('.ts','.tsx','.js','.mjs','.cjs','.json','.yaml','.yml','.toml','.md','.txt','.sh','.ps1','.bat','.cmd','.conf')
$contentPatterns = @('vercel','netlify','render','railway','fly.io','docker','kubernetes','helm','pm2','nginx','systemd','deploy','staging','production','health','readiness')

$allFiles = Get-ChildItem -LiteralPath $resolvedSourceRoot -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object { -not (Test-ExcludedPath $_.FullName) }

$topLevel = Get-ChildItem -LiteralPath $resolvedSourceRoot -Force -ErrorAction Stop |
  Select-Object @{n='name';e={$_.Name}}, @{n='type';e={if ($_.PSIsContainer) {'directory'} else {'file'}}}, @{n='bytes';e={if ($_.PSIsContainer) {$null} else {$_.Length}}}
$topLevel | ConvertTo-Json -Depth 4 | Write-Utf8File (Join-Path $outDir 'TOP_LEVEL_INVENTORY.json')

$deploymentArtifacts = @()
foreach ($file in $allFiles) {
  $relative = Get-SafeRelativePath -BasePath $resolvedSourceRoot -FullPath $file.FullName
  $nameMatch = $artifactNames -contains $file.Name
  $pathMatch = $relative -match '(?i)(^|/)(deploy|deployment|infra|infrastructure|staging|docker|k8s|kubernetes|helm)(/|$)'
  if ($nameMatch -or $pathMatch) {
    $deploymentArtifacts += [pscustomobject]@{
      relative_path = $relative
      reason = (@(if ($nameMatch) {'known_deployment_filename'}; if ($pathMatch) {'deployment_named_path'}) -join ';')
      bytes = $file.Length
      sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    }
  }
}
$deploymentArtifacts | Sort-Object relative_path | ConvertTo-Json -Depth 4 | Write-Utf8File (Join-Path $outDir 'DEPLOYMENT_ARTIFACT_CANDIDATES.json')

$packageSummary = @()
$packageFiles = $allFiles | Where-Object { $_.Name -eq 'package.json' }
foreach ($pkgFile in $packageFiles) {
  $relative = Get-SafeRelativePath -BasePath $resolvedSourceRoot -FullPath $pkgFile.FullName
  try {
    $pkg = Get-Content -LiteralPath $pkgFile.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    $scripts = @()
    if ($pkg.scripts) {
      foreach ($property in $pkg.scripts.PSObject.Properties) {
        $scripts += [pscustomobject]@{ name = $property.Name; command = [string]$property.Value }
      }
    }
    $packageSummary += [pscustomobject]@{
      relative_path = $relative
      name = [string]$pkg.name
      version = [string]$pkg.version
      package_manager_hints = @($pkg.packageManager, $pkg.engines.node, $pkg.engines.pnpm | Where-Object { $_ })
      scripts = $scripts | Sort-Object name
    }
  } catch {
    $packageSummary += [pscustomobject]@{ relative_path = $relative; parse_error = $_.Exception.Message }
  }
}
$packageSummary | ConvertTo-Json -Depth 8 | Write-Utf8File (Join-Path $outDir 'PACKAGE_SCRIPTS_AND_RUNTIME_HINTS.json')

$envFiles = $allFiles | Where-Object { $_.Name -match '^\.env($|\.)' }
$envSummary = @()
foreach ($envFile in $envFiles) {
  $envSummary += [pscustomobject]@{
    relative_path = Get-SafeRelativePath -BasePath $resolvedSourceRoot -FullPath $envFile.FullName
    keys = @(Get-EnvKeySummary -File $envFile)
  }
}
$envSummary | ConvertTo-Json -Depth 8 | Write-Utf8File (Join-Path $outDir 'ENVIRONMENT_KEY_INVENTORY_REDACTED.json')

$contentHits = @()
foreach ($file in ($allFiles | Where-Object { $textExtensions -contains $_.Extension.ToLowerInvariant() -and $_.Length -le 1048576 -and $_.Name -notmatch '^\.env' })) {
  $relative = Get-SafeRelativePath -BasePath $resolvedSourceRoot -FullPath $file.FullName
  try {
    $lineNumber = 0
    foreach ($line in (Get-Content -LiteralPath $file.FullName -Encoding UTF8 -ErrorAction Stop)) {
      $lineNumber++
      $matched = @($contentPatterns | Where-Object { $line -match "(?i)$_" })
      if ($matched.Count -gt 0) {
        $contentHits += [pscustomobject]@{ relative_path = $relative; line = $lineNumber; matched_terms = $matched }
      }
    }
  } catch {
    $contentHits += [pscustomobject]@{ relative_path = $relative; line = 0; matched_terms = @('__READ_ERROR__') }
  }
}
$contentHits | ConvertTo-Json -Depth 5 | Write-Utf8File (Join-Path $outDir 'DEPLOYMENT_SIGNAL_INDEX_REDACTED.json')

$gitTopLevel = $null
$gitRemoteNames = @()
try {
  $gitTopLevel = (& git -C $resolvedSourceRoot rev-parse --show-toplevel 2>$null)
  if ($LASTEXITCODE -eq 0 -and $gitTopLevel) {
    $gitRemoteNames = @(& git -C $resolvedSourceRoot remote 2>$null)
  } else {
    $gitTopLevel = $null
  }
} catch {
  $gitTopLevel = $null
}

$summary = [ordered]@{
  batch = 'MEGA_BATCH_ASSISTANT_STAGING_DEPLOYMENT_DISCOVERY_AND_CERTIFICATION_V1'
  mode = 'READ_ONLY_DISCOVERY'
  source_root = $resolvedSourceRoot
  generated_local_time = (Get-Date).ToString('o')
  live_source_file_count_excluding_generated_and_backups = @($allFiles).Count
  git_repository_root_detected = if ($gitTopLevel) { $true } else { $false }
  git_remote_names_only = $gitRemoteNames
  known_deployment_artifact_candidates = @($deploymentArtifacts).Count
  package_manifest_count = @($packageSummary).Count
  environment_file_count = @($envSummary).Count
  deployment_signal_count = @($contentHits).Count
  deployment_action = 'NOT_PERFORMED'
  database_write = 'NONE'
  sql_execution = 'NONE'
  production_action = 'NONE'
  certification_status = 'DISCOVERY_EVIDENCE_COLLECTED_NOT_DEPLOYMENT_CERTIFIED'
  required_next_evidence = @(
    'authoritative hosting/provider identity',
    'remote staging URL',
    'deployment command or CI/CD workflow actually used for this Assistant',
    'staging environment-variable key mapping without secret values',
    'rollback target/version and operator procedure'
  )
}
$summary | ConvertTo-Json -Depth 8 | Write-Utf8File (Join-Path $outDir 'DISCOVERY_SUMMARY.json')

$readme = @"
MEGA_BATCH_ASSISTANT_STAGING_DEPLOYMENT_DISCOVERY_AND_CERTIFICATION_V1

MODE: READ_ONLY_DISCOVERY

This evidence package contains paths, hashes, file names, package scripts, redacted environment key names, and keyword-only deployment signal locations.
It intentionally does not copy environment values, remote URLs, tokens, secrets, or source files.

No deployment, source mutation, SQL execution, database write, or production action was performed.

Upload the generated ZIP package only after reviewing that its JSON files contain no sensitive information unexpected to you.
"@
Write-Utf8File (Join-Path $outDir 'README.txt') $readme

$zipFile = "$outDir.zip"
Compress-Archive -LiteralPath (Join-Path $outDir '*') -DestinationPath $zipFile -Force

"DISCOVERY_OUTPUT_DIRECTORY=$outDir"
"DISCOVERY_OUTPUT_ZIP=$zipFile"
"DISCOVERY_MODE=READ_ONLY"
"DEPLOYMENT_ACTION=NONE"
"DATABASE_WRITE=NONE"
"CERTIFICATION_STATUS=DISCOVERY_EVIDENCE_COLLECTED_NOT_DEPLOYMENT_CERTIFIED"


