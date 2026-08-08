param(
    [Parameter(Mandatory=$true)]
    [string]$BackupDir,
    [string]$SourceRoot = "D:\waqf_ai_model"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExistingTargets = @("PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md","CHANGELOG.md","CURRENT_TASK.md","STATE.md","ERROR_RECORD_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_2026_07_12.md","docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1.md","docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_UAT_AR.md")
$NewTargets = @("docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_BASELINE_ACCEPTANCE_AR.md","docs/ai/governed_agentic_rag/evidence/AR1_AUTHORITY_PREP_RUNTIME_ACCEPTANCE_20260713.json")

foreach ($rel in $ExistingTargets) {
    $backup = Join-Path $BackupDir $rel
    $target = Join-Path $SourceRoot $rel
    if (Test-Path -LiteralPath $backup) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
        Copy-Item -LiteralPath $backup -Destination $target -Force
        Write-Host "RESTORED :: $rel"
    }
}
foreach ($rel in $NewTargets) {
    $target = Join-Path $SourceRoot $rel
    if (Test-Path -LiteralPath $target) {
        Remove-Item -LiteralPath $target -Force
        Write-Host "REMOVED_CREATED :: $rel"
    }
}
Write-Host "$PromotionId=ROLLBACK_COMPLETE"
