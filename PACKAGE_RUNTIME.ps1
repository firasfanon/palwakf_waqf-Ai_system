$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-Sha256Hex {
  param([Parameter(Mandatory=$true)][string]$LiteralPath)
  return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToUpperInvariant()
}

function Get-TargetContracts {
  param([Parameter(Mandatory=$true)][string]$PackageRoot)

  $path = Join-Path $PackageRoot "contract\TARGETS.json"
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "TARGET_CONTRACT_NOT_FOUND"
  }

  return @(
    Get-Content -LiteralPath $path -Raw -Encoding UTF8 |
      ConvertFrom-Json
  )
}

function Resolve-RelativePath {
  param(
    [Parameter(Mandatory=$true)][string]$Root,
    [Parameter(Mandatory=$true)][string]$RelativePath
  )

  return Join-Path $Root ($RelativePath -replace "/", "\")
}

function Assert-ProjectPostimage {
  param(
    [Parameter(Mandatory=$true)][string]$ProjectRoot,
    [Parameter(Mandatory=$true)][array]$Targets
  )

  foreach ($target in $Targets) {
    $path = Resolve-RelativePath `
      -Root $ProjectRoot `
      -RelativePath $target.relativePath

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      throw "APPLIED_FILE_MISSING::$($target.relativePath)"
    }

    $actual = Get-Sha256Hex -LiteralPath $path
    $expected = [string]$target.postimageSha256

    if ($actual -ne $expected) {
      throw "APPLIED_HASH_MISMATCH::$($target.relativePath)::$actual::$expected"
    }
  }
}

function Resolve-LocalBinary {
  param(
    [Parameter(Mandatory=$true)][string]$ProjectRoot,
    [Parameter(Mandatory=$true)][string]$Name
  )

  foreach ($candidate in @(
    (Join-Path $ProjectRoot ("node_modules\.bin\" + $Name + ".cmd")),
    (Join-Path $ProjectRoot ("node_modules\.bin\" + $Name + ".exe"))
  )) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return $candidate
    }
  }

  throw "LOCAL_BINARY_NOT_FOUND::$Name"
}

function Invoke-NativeCaptured {
  [OutputType([int])]
  param(
    [Parameter(Mandatory=$true)][string]$Executable,
    [Parameter(Mandatory=$true)][string[]]$Arguments,
    [Parameter(Mandatory=$true)][string]$WorkingDirectory,
    [Parameter(Mandatory=$true)][string]$EvidenceFile
  )

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  $nativeOutput = @()
  $exitCode = -1

  try {
    Push-Location $WorkingDirectory
    try {
      $nativeOutput = @(
        & $Executable @Arguments 2>&1
      )

      $exitCode = [int]$LASTEXITCODE
    }
    finally {
      Pop-Location
    }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($nativeOutput.Count -gt 0) {
    $nativeOutput |
      Tee-Object -FilePath $EvidenceFile -Append |
      Out-Host
  }

  return [int]$exitCode
}

function Invoke-StaticVerifier {
  param(
    [Parameter(Mandatory=$true)][string]$PackageRoot,
    [Parameter(Mandatory=$true)][string]$ProjectRoot,
    [Parameter(Mandatory=$true)][string]$EvidenceFile
  )

  $node = Get-Command "node.exe" -ErrorAction SilentlyContinue
  if ($null -eq $node) {
    $node = Get-Command "node" -ErrorAction SilentlyContinue
  }
  if ($null -eq $node) {
    throw "NODE_EXECUTABLE_NOT_FOUND"
  }

  $verifier = Join-Path $PackageRoot "scripts\verify_product_surfaces_wave1.mjs"

  $exitCode = Invoke-NativeCaptured `
    -Executable $node.Source `
    -Arguments @($verifier, "--project-root", $ProjectRoot) `
    -WorkingDirectory $ProjectRoot `
    -EvidenceFile $EvidenceFile

  if ($exitCode -ne 0) {
    throw "STATIC_VERIFIER_FAILED::$exitCode"
  }
}
