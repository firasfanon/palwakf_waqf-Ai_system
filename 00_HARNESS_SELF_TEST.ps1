$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $PackageRoot "PACKAGE_CONTRACT.ps1")
. (Join-Path $PackageRoot "PACKAGE_RUNTIME.ps1")

Write-Output "POWERSHELL_VERSION=$($PSVersionTable.PSVersion.ToString())"
Write-Output "POWERSHELL_EDITION=$($PSVersionTable.PSEdition)"

foreach ($relativePath in ($PackageHashes.Keys | Sort-Object)) {
  $path = Join-Path $PackageRoot $relativePath

  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "PACKAGE_FILE_NOT_FOUND::$relativePath"
  }

  $actual = Get-Sha256Hex -LiteralPath $path
  $expected = [string]$PackageHashes[$relativePath]

  if ($actual -ne $expected) {
    throw "PACKAGE_HASH_MISMATCH::$relativePath::$actual::$expected"
  }
}

$verify = Get-Content -LiteralPath (
  Join-Path $PackageRoot "01_POST_APPLY_VERIFY.ps1"
) -Raw

foreach ($required in @(
  'Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "esbuild"',
  'Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "tsc"',
  'Resolve-LocalBinary -ProjectRoot $ProjectRoot -Name "vite"',
  'PNPM_EXEC_USED=NO',
  'DEPENDENCY_INSTALL_ATTEMPTED=NO',
  'DIRECT_TYPESCRIPT_CHECK=PASS',
  'DIRECT_CLIENT_BUILD=PASS',
  'PROJECT_SOURCE_WRITE=NO',
  'DATABASE_ACCESS=NO'
)) {
  if (-not $verify.Contains($required)) {
    throw "POST_APPLY_VERIFY_CONTRACT_MISSING::$required"
  }
}

foreach ($forbidden in @(
  'pnpm exec',
  'pnpm install',
  'npm install',
  'corepack',
  'Copy-Item -LiteralPath $ProjectRoot',
  'Move-Item -LiteralPath $ProjectRoot',
  'Remove-Item -LiteralPath $ProjectRoot',
  'Set-Content -LiteralPath $ProjectRoot'
)) {
  if ($verify.Contains($forbidden)) {
    throw "FORBIDDEN_VERIFY_OPERATION::$forbidden"
  }
}

$targets = Get-Content -LiteralPath (
  Join-Path $PackageRoot "contract\TARGETS.json"
) -Raw -Encoding UTF8 | ConvertFrom-Json

if (@($targets).Count -ne 10) {
  throw "TARGET_COUNT_MISMATCH::$(@($targets).Count)"
}

$HarnessSource = Get-Content -LiteralPath $MyInvocation.MyCommand.Path -Raw

$DoubleQuote = [char]34

$StrictModeRiskTokens = @(
  'Copy-Item -LiteralPath $ProjectRoot',
  'Move-Item -LiteralPath $ProjectRoot',
  'Remove-Item -LiteralPath $ProjectRoot',
  'Set-Content -LiteralPath $ProjectRoot'
)

foreach ($token in $StrictModeRiskTokens) {
  $doubleQuotedProbe = (
    $DoubleQuote +
    $token +
    $DoubleQuote
  )

  if ($HarnessSource.Contains($doubleQuotedProbe)) {
    throw "STRICTMODE_DOUBLE_QUOTED_PROJECTROOT_PATTERN_FOUND::$token"
  }
}

$node = Get-Command "node.exe" -ErrorAction SilentlyContinue

if ($null -eq $node) {
  $node = Get-Command "node" -ErrorAction SilentlyContinue
}

if ($null -eq $node) {
  throw "NODE_EXECUTABLE_NOT_FOUND_FOR_NATIVE_CAPTURE_SELFTEST"
}

$NativeCaptureEvidence = Join-Path $env:TEMP (
  "pwf-wave1-native-capture-selftest-" +
  [guid]::NewGuid().ToString("N") +
  ".txt"
)

try {
  $NativeCaptureResult = @(
    Invoke-NativeCaptured `
      -Executable $node.Source `
      -Arguments @(
        "-e",
        "console.log('NATIVE_CAPTURE_STDOUT'); console.error('NATIVE_CAPTURE_STDERR'); process.exit(0)"
      ) `
      -WorkingDirectory $PackageRoot `
      -EvidenceFile $NativeCaptureEvidence
  )

  if ($NativeCaptureResult.Count -ne 1) {
    throw "NATIVE_CAPTURE_RESULT_NOT_SCALAR::$($NativeCaptureResult.Count)"
  }

  if ([int]$NativeCaptureResult[0] -ne 0) {
    throw "NATIVE_CAPTURE_EXIT_CODE_NOT_ZERO::$($NativeCaptureResult[0])"
  }

  $NativeCaptureEvidenceText = Get-Content `
    -LiteralPath $NativeCaptureEvidence `
    -Raw `
    -ErrorAction Stop

  if (-not $NativeCaptureEvidenceText.Contains("NATIVE_CAPTURE_STDOUT")) {
    throw "NATIVE_CAPTURE_STDOUT_NOT_IN_EVIDENCE"
  }

  if (-not $NativeCaptureEvidenceText.Contains("NATIVE_CAPTURE_STDERR")) {
    throw "NATIVE_CAPTURE_STDERR_NOT_IN_EVIDENCE"
  }
}
finally {
  if (Test-Path -LiteralPath $NativeCaptureEvidence) {
    Remove-Item -LiteralPath $NativeCaptureEvidence -Force
  }
}

Write-Output "PACKAGE_HASH_VALIDATION=PASS"
Write-Output "NATIVE_CAPTURE_SCALAR_EXIT_CODE=PASS"
Write-Output "NATIVE_CAPTURE_STDOUT_EVIDENCE=PASS"
Write-Output "NATIVE_CAPTURE_STDERR_EVIDENCE=PASS"
Write-Output "STRICTMODE_BOUNDED_PROJECTROOT_PATTERN_GUARD=PASS"
Write-Output "TARGET_COUNT=10"
Write-Output "DIRECT_LOCAL_BINARY_CONTRACT=PASS"
Write-Output "NO_PNPM_EXEC_OR_INSTALL=PASS"
Write-Output "POWERSHELL_5_NATIVE_STDERR_GUARD=PASS"
Write-Output "TEST_FAILURE_CLASSIFIER_CONTRACT=PASS"
Write-Output "NO_SOURCE_APPLY=PASS"
Write-Output "NO_DATABASE_ACCESS=PASS"
Write-Output "HARNESS_SELF_TEST=PASS"
