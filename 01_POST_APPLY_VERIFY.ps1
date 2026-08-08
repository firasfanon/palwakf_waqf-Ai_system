param(
  [string]$ProjectRoot = "D:\waqf_ai_model"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $PackageRoot "PACKAGE_RUNTIME.ps1")

if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
  throw "PROJECT_ROOT_NOT_FOUND::$ProjectRoot"
}

$EvidenceRoot = Join-Path $PackageRoot "evidence"
New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$EvidenceFile = Join-Path $EvidenceRoot (
  "PRODUCT_SURFACES_WAVE_1_POST_APPLY_VERIFY_" + $Stamp + ".txt"
)

"PRODUCT_SURFACES_WAVE_1_POST_APPLY_VERIFY_START" |
  Tee-Object -FilePath $EvidenceFile

$Targets = Get-TargetContracts -PackageRoot $PackageRoot
Assert-ProjectPostimage -ProjectRoot $ProjectRoot -Targets $Targets

"PROJECT_POSTIMAGE_HASHES=PASS" |
  Tee-Object -FilePath $EvidenceFile -Append

Invoke-StaticVerifier `
  -PackageRoot $PackageRoot `
  -ProjectRoot $ProjectRoot `
  -EvidenceFile $EvidenceFile

$esbuild = Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "esbuild"
$tsc = Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "tsc"
$vite = Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "vite"

"LOCAL_ESBUILD_BINARY=$esbuild" |
  Tee-Object -FilePath $EvidenceFile -Append
"LOCAL_TSC_BINARY=$tsc" |
  Tee-Object -FilePath $EvidenceFile -Append
"LOCAL_VITE_BINARY=$vite" |
  Tee-Object -FilePath $EvidenceFile -Append
"PNPM_EXEC_USED=NO" |
  Tee-Object -FilePath $EvidenceFile -Append
"DEPENDENCY_INSTALL_ATTEMPTED=NO" |
  Tee-Object -FilePath $EvidenceFile -Append

$TempRoot = Join-Path $env:TEMP (
  "pwf-wave1-post-apply-verify-" + [guid]::NewGuid().ToString("N")
)
$ParseRoot = Join-Path $TempRoot "parse"
$BuildRoot = Join-Path $TempRoot "client-build"

New-Item -ItemType Directory -Path $ParseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $BuildRoot -Force | Out-Null

try {
  $index = 0

  foreach ($target in $Targets) {
    if (
      $target.relativePath -notlike "client/src/*.ts" -and
      $target.relativePath -notlike "client/src/*.tsx" -and
      $target.relativePath -notlike "client/src/*/*.ts" -and
      $target.relativePath -notlike "client/src/*/*.tsx" -and
      $target.relativePath -notlike "client/src/*/*/*.ts" -and
      $target.relativePath -notlike "client/src/*/*/*.tsx"
    ) {
      continue
    }

    $index += 1
    $sourcePath = Resolve-RelativePath `
      -Root $ProjectRoot `
      -RelativePath $target.relativePath
    $outPath = Join-Path $ParseRoot ("target-" + $index + ".js")

    $parseExitCode = Invoke-NativeCaptured `
      -Executable $esbuild `
      -Arguments @(
        $sourcePath,
        "--bundle",
        "--platform=browser",
        "--format=esm",
        "--external:*",
        "--log-level=error",
        ("--outfile=" + $outPath)
      ) `
      -WorkingDirectory $ProjectRoot `
      -EvidenceFile $EvidenceFile

    if ($parseExitCode -ne 0) {
      throw "DIRECT_ESBUILD_PARSE_FAILED::$($target.relativePath)::$parseExitCode"
    }

    "DIRECT_ESBUILD_PARSE_PASS=$($target.relativePath)" |
      Tee-Object -FilePath $EvidenceFile -Append
  }

  $tscExitCode = Invoke-NativeCaptured `
    -Executable $tsc `
    -Arguments @("--noEmit", "--pretty", "false") `
    -WorkingDirectory $ProjectRoot `
    -EvidenceFile $EvidenceFile

  "DIRECT_TYPESCRIPT_CHECK_EXIT_CODE=$tscExitCode" |
    Tee-Object -FilePath $EvidenceFile -Append

  if ($tscExitCode -ne 0) {
    throw "DIRECT_TYPESCRIPT_CHECK_FAILED::$tscExitCode"
  }

  $viteExitCode = Invoke-NativeCaptured `
    -Executable $vite `
    -Arguments @(
      "build",
      "--outDir",
      $BuildRoot,
      "--emptyOutDir"
    ) `
    -WorkingDirectory $ProjectRoot `
    -EvidenceFile $EvidenceFile

  "DIRECT_CLIENT_BUILD_EXIT_CODE=$viteExitCode" |
    Tee-Object -FilePath $EvidenceFile -Append

  if ($viteExitCode -ne 0) {
    throw "DIRECT_CLIENT_BUILD_FAILED::$viteExitCode"
  }
}
finally {
  if (Test-Path -LiteralPath $TempRoot) {
    Remove-Item -LiteralPath $TempRoot -Recurse -Force
  }
}

"TARGET_FILE_COUNT=$($Targets.Count)" |
  Tee-Object -FilePath $EvidenceFile -Append
"DIRECT_ESBUILD_PARSE=PASS" |
  Tee-Object -FilePath $EvidenceFile -Append
"DIRECT_TYPESCRIPT_CHECK=PASS" |
  Tee-Object -FilePath $EvidenceFile -Append
"DIRECT_CLIENT_BUILD=PASS" |
  Tee-Object -FilePath $EvidenceFile -Append
"PROJECT_SOURCE_WRITE=NO" |
  Tee-Object -FilePath $EvidenceFile -Append
"DATABASE_ACCESS=NO" |
  Tee-Object -FilePath $EvidenceFile -Append
"SERVER_API_CHANGE=NO" |
  Tee-Object -FilePath $EvidenceFile -Append
"ROLLBACK_REQUIRED=NO" |
  Tee-Object -FilePath $EvidenceFile -Append
"PRODUCT_SURFACES_WAVE_1_POST_APPLY_VERIFY=PASS" |
  Tee-Object -FilePath $EvidenceFile -Append
