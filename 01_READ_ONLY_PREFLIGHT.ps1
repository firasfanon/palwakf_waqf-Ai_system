$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $PackageRoot "PACKAGE_RUNTIME.ps1")

$SqlFile = Join-Path $PackageRoot "sql\00_READ_ONLY_EFFECTIVE_DEFAULT_ACL_PREFLIGHT.sql"
$EvidenceRoot = Join-Path $PackageRoot "evidence"
New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$EvidenceFile = Join-Path $EvidenceRoot ("DEFAULT_PRIVILEGES_READ_ONLY_PREFLIGHT_" + $Stamp + ".txt")

Invoke-PsqlEvidence -SqlFile $SqlFile -EvidenceFile $EvidenceFile

$Text = Get-Content -LiteralPath $EvidenceFile -Raw
foreach ($Marker in @(
  "ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_PREFLIGHT_START",
  "ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_DECISION",
  "ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_PREFLIGHT_COMPLETE",
  "NO_DATABASE_WRITE",
  "NO_DEFAULT_ACL_CHANGE",
  "NO_EXISTING_OBJECT_GRANT_CHANGE",
  "NO_KNOWLEDGE_MUTATION",
  "NO_CHAT_RELEASE",
  "NO_PRODUCTION",
  "ROLLBACK"
)) {
  if (-not $Text.Contains($Marker)) {
    throw "DEFAULT_PRIVILEGES_PREFLIGHT_MARKER_NOT_FOUND::$Marker"
  }
}

Write-Output "DEFAULT_PRIVILEGES_READ_ONLY_PREFLIGHT=PASS"
Write-Output "DATABASE_WRITE=NO"
Write-Output "DEFAULT_ACL_CHANGE=NO"
Write-Output "EXISTING_OBJECT_GRANT_CHANGE=NO"
Write-Output "STOP_BEFORE_HARDENING_APPLY=YES"
