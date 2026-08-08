param(
    [string]$SourceRoot = "D:\waqf_ai_model",
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PromotionId = "PALWAKF_AR1_AUTH_PREP_R4_PROMOTE_V1"
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadRoot = Join-Path $PackageRoot "payload"

$Preimage = ConvertFrom-Json @'
{
  "PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md": "3B1ABEDB8233FA0654EDF292C201517B60C8D7E2E884419AB429BB0A93C76355",
  "CHANGELOG.md": "EA86D2547AC3467FDD2B30115377922EF769B86F9E8175DC45067892B9C38CD3",
  "CURRENT_TASK.md": "39B4C8E1F84DB155600499AA515D479E04E213DA4681B66C63DA450AA2F21A3B",
  "STATE.md": "ABB9DAAF32C608227EA5F65515C5E250BBF1B108339F80EACD0F30B642575AC7",
  "ERROR_RECORD_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_2026_07_12.md": "5A323D323BA030E5F64E97BD3DA5DB8780B83D0E6D46E3253A4367D62B20D2FB",
  "docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1.md": "19CCCABC3A7FA5ED5589D0145A072A87953AFCA160F4784318C1B2D2CED80B98",
  "docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_UAT_AR.md": "18EB6B1C2981A656C7A06FDA1D1C2DF792D8FDB400A218F98B1C911D79546FAF"
}
'@

$Postimage = ConvertFrom-Json @'
{
  "PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md": "0F6D3268C6A18E7D886C9F0802851B8B292BCAA2E2FFAC2919FABA8AA3CE962E",
  "CHANGELOG.md": "99237D0B0F1582FF9F287FF75BC01D0E0BF132275D57370C7BA8C6AEECD52604",
  "CURRENT_TASK.md": "FE1516E54694E09963B74EBEA3E16626E12CED4B38CC2B59E6C65B9377714459",
  "STATE.md": "CE85065C42FEAF72EC21AC6C57DF63ACA51C05DD736196A27A84841DD29B3C73",
  "ERROR_RECORD_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_2026_07_12.md": "2E0CC791CCCFB2DA0B1F3026F9585BD5BA96E0CD9E0032ABB69FB63E1A7D0EE7",
  "docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1.md": "4070DA115D4A5D416932CE2A93611F45CABEA65E23E3D44511A7B74496755E85",
  "docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_UAT_AR.md": "00D241D4E6F9FAE985B33E35A9D728933ED47ED48D8C84D9D6BF58A2F557AA35",
  "docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_BASELINE_ACCEPTANCE_AR.md": "15D0667C436A4359CD17E362EC881AC1623F9A5789B486606D26844FD356DAB3",
  "docs/ai/governed_agentic_rag/evidence/AR1_AUTHORITY_PREP_RUNTIME_ACCEPTANCE_20260713.json": "8DB6DAE23861F409B78671ACE961754096BBFE207FB35DDB2AF4EC48DCD64A69"
}
'@

$ExistingTargets = @("PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md","CHANGELOG.md","CURRENT_TASK.md","STATE.md","ERROR_RECORD_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_2026_07_12.md","docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1.md","docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_UAT_AR.md")
$NewTargets = @("docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_BASELINE_ACCEPTANCE_AR.md","docs/ai/governed_agentic_rag/evidence/AR1_AUTHORITY_PREP_RUNTIME_ACCEPTANCE_20260713.json")

function Get-Hash([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

Write-Host "$PromotionId=PREFLIGHT_START"
Write-Host "SOURCE_ROOT=$SourceRoot"

$drift = @()
foreach ($rel in $ExistingTargets) {
    $target = Join-Path $SourceRoot $rel
    if (-not (Test-Path -LiteralPath $target)) {
        $drift += "MISSING_EXISTING::$rel"
        continue
    }
    $actual = Get-Hash $target
    $pre = [string]$Preimage.$rel
    $post = [string]$Postimage.$rel
    if ($actual -ne $pre -and $actual -ne $post) {
        $drift += "HASH_DRIFT::$rel::$actual"
    }
}
foreach ($rel in $NewTargets) {
    $target = Join-Path $SourceRoot $rel
    if (Test-Path -LiteralPath $target) {
        $actual = Get-Hash $target
        $post = [string]$Postimage.$rel
        if ($actual -ne $post) {
            $drift += "UNEXPECTED_EXISTING::$rel::$actual"
        }
    }
}

if ($drift.Count -gt 0) {
    $drift | ForEach-Object { Write-Host $_ }
    throw "SOURCE_DRIFT_DETECTED"
}

Write-Host "$PromotionId=PREFLIGHT_PASS"
Write-Host "SOURCE_DRIFT=NONE"

foreach ($rel in $ExistingTargets) {
    $target = Join-Path $SourceRoot $rel
    if ((Get-Hash $target) -eq [string]$Postimage.$rel) {
        Write-Host "ALREADY_POSTIMAGE :: $rel"
    } else {
        Write-Host "READY_REPLACE :: $rel"
    }
}
foreach ($rel in $NewTargets) {
    $target = Join-Path $SourceRoot $rel
    if (Test-Path -LiteralPath $target) {
        Write-Host "ALREADY_POSTIMAGE :: $rel"
    } else {
        Write-Host "READY_CREATE :: $rel"
    }
}

if ($WhatIf) {
    Write-Host "WHATIF=TRUE"
    Write-Host "NO_FILES_CHANGED=TRUE"
    Write-Host "$PromotionId=WHATIF_PASS"
    return
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = Join-Path $SourceRoot ("backups\" + $PromotionId + "_" + $timestamp)
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

foreach ($rel in $ExistingTargets) {
    $target = Join-Path $SourceRoot $rel
    if ((Get-Hash $target) -ne [string]$Postimage.$rel) {
        $backup = Join-Path $backupRoot $rel
        New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
        Copy-Item -LiteralPath $target -Destination $backup -Force
    }
}

foreach ($rel in ($ExistingTargets + $NewTargets)) {
    $src = Join-Path $PayloadRoot $rel
    $dst = Join-Path $SourceRoot $rel
    New-Item -ItemType Directory -Path (Split-Path -Parent $dst) -Force | Out-Null
    Copy-Item -LiteralPath $src -Destination $dst -Force
    Write-Host "APPLIED :: $rel"
}

foreach ($rel in ($ExistingTargets + $NewTargets)) {
    $dst = Join-Path $SourceRoot $rel
    $actual = Get-Hash $dst
    $expected = [string]$Postimage.$rel
    if ($actual -ne $expected) {
        throw "POSTIMAGE_HASH_MISMATCH::$rel::$actual::$expected"
    }
    Write-Host "PASS_HASH :: $rel :: $actual"
}

Write-Host "BACKUP_DIR=$backupRoot"
Write-Host "SOURCE_CODE_CHANGE=NO"
Write-Host "DATABASE_WRITE=NO"
Write-Host "BASELINE_R4_STATUS=ACCEPTED_LOCAL_ONLY"
Write-Host "PRODUCTION_NOT_APPROVED=YES"
Write-Host "$PromotionId=APPLY_PASS"
