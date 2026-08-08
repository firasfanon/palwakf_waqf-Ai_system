param(
    [string]$SourceRoot = "D:\waqf_ai_model"
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $Root "01_APPLY.ps1"
$Log = Join-Path $Root "EVIDENCE_WHATIF.txt"
$output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Script -SourceRoot $SourceRoot -WhatIf 2>&1
$rc = $LASTEXITCODE
$output | Tee-Object -FilePath $Log
if ($rc -ne 0) { throw "WHATIF_CHILD_FAILED::$rc" }
$text = $output | Out-String
$required = @(
    "PALWAKF_AR1_AUTH_PREP_R4_PROMOTE_V1=PREFLIGHT_PASS",
    "SOURCE_DRIFT=NONE",
    "WHATIF=TRUE",
    "NO_FILES_CHANGED=TRUE",
    "PALWAKF_AR1_AUTH_PREP_R4_PROMOTE_V1=WHATIF_PASS"
)
foreach ($marker in $required) {
    if (-not $text.Contains($marker)) { throw "WHATIF_MARKER_MISSING::$marker" }
}
Write-Host "WHATIF_CHILD_EXIT_CODE=0"
Write-Host "WHATIF_LOG=$Log"
Write-Host "PALWAKF_AR1_AUTH_PREP_R4_PROMOTE_V1=WRAPPED_WHATIF_PASS"
