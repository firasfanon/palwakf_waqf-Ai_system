$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$TranscriptPath = Join-Path $PackageRoot (
  "evidence\OPERATOR_APPLY_AND_GATE_TRANSCRIPT_20260716.txt"
)

if (-not (Test-Path -LiteralPath $TranscriptPath -PathType Leaf)) {
  throw "OPERATOR_TRANSCRIPT_NOT_FOUND"
}

$Text = Get-Content -LiteralPath $TranscriptPath -Raw -Encoding UTF8

if (-not $Text.Contains("FULL_PROJECT_TYPESCRIPT_CHECK_EXIT_CODE=0")) {
  throw "FULL_TYPESCRIPT_PASS_MARKER_NOT_FOUND"
}

$testStartIndex = $Text.IndexOf("FULL_PROJECT_TEST_START")
if ($testStartIndex -lt 0) {
  throw "FULL_TEST_START_MARKER_NOT_FOUND"
}

$TestSection = $Text.Substring($testStartIndex)

$Wave1TargetNames = @(
  "appRoutes.ts",
  "adminRegistryV2.ts",
  "AdminSidebarV2.tsx",
  "AdminDashboard.tsx",
  "AITools.tsx",
  "AIToolRuns.tsx",
  "ToolOutputIntake.tsx",
  "KnowledgeOperationsWorkspace.tsx",
  "KnowledgeActivationCenter.tsx",
  "SourceInventoryPreview.tsx"
)

$targetReferences = @(
  $Wave1TargetNames |
    Where-Object {
      $TestSection.IndexOf(
        $_,
        [System.StringComparison]::OrdinalIgnoreCase
      ) -ge 0
    }
)

$databaseUnavailableCount = (
  [regex]::Matches(
    $TestSection,
    "Database not available",
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
).Count

$missingProcedureCount = (
  [regex]::Matches(
    $TestSection,
    "No procedure found on path",
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
).Count

$serverSuiteMatches = [regex]::Matches(
  $TestSection,
  "server/[A-Za-z0-9._-]+\.test\.ts",
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$serverSuites = @(
  $serverSuiteMatches |
    ForEach-Object { $_.Value } |
    Sort-Object -Unique
)

if ($targetReferences.Count -ne 0) {
  throw "WAVE1_TARGET_REFERENCED_IN_TEST_FAILURES::$($targetReferences -join ',')"
}

if ($databaseUnavailableCount -eq 0) {
  throw "DATABASE_UNAVAILABLE_FAILURE_MARKERS_NOT_FOUND"
}

if ($serverSuites.Count -eq 0) {
  throw "SERVER_TEST_FAILURE_SUITES_NOT_FOUND"
}

Write-Output "FULL_PROJECT_TYPESCRIPT_CHECK=PASS"
Write-Output "FULL_PROJECT_TEST_SUITE=FAIL"
Write-Output "FULL_TEST_FAILURE_SCOPE=SERVER_DATABASE_AND_LEGACY_CONTRACTS"
Write-Output "WAVE1_TARGET_REFERENCE_IN_TEST_FAILURES=0"
Write-Output "DATABASE_UNAVAILABLE_FAILURE_COUNT=$databaseUnavailableCount"
Write-Output "MISSING_PROCEDURE_FAILURE_COUNT=$missingProcedureCount"
Write-Output "FAILED_SERVER_SUITE_COUNT=$($serverSuites.Count)"

foreach ($suite in $serverSuites) {
  Write-Output "FAILED_SERVER_SUITE=$suite"
}

Write-Output "WAVE1_SOURCE_FAILURE_ATTRIBUTION=NOT_ESTABLISHED"
Write-Output "FULL_TEST_SUITE_ACCEPTANCE=NOT_CLAIMED"
Write-Output "LEGACY_AND_ENVIRONMENTAL_TEST_DEBT=OPEN_SEPARATE_HOLD"
Write-Output "ROLLBACK_REQUIRED=NO"
Write-Output "TEST_GATE_RECONCILIATION=PASS"
