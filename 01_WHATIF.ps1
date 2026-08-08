$ErrorActionPreference="Stop"; Set-StrictMode -Version Latest
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path; . (Join-Path $Root "PACKAGE_RUNTIME.ps1")
$E=Join-Path $Root "evidence"; New-Item -ItemType Directory -Path $E -Force|Out-Null
$F=Join-Path $E ("DEFAULT_PRIVILEGES_LOCAL_HARDENING_WHATIF_"+(Get-Date -Format "yyyyMMdd_HHmmss")+".txt")
Invoke-PsqlEvidence -SqlFile (Join-Path $Root "sql\01_WHATIF_READ_ONLY.sql") -EvidenceFile $F
$T=Get-Content -LiteralPath $F -Raw
foreach($M in @("ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_WHATIF_COMPLETE","GLOBAL_PUBLIC_FUNCTION_EXECUTE=REMAINS_EFFECTIVE","NO_DATABASE_WRITE","ROLLBACK")){if(-not $T.Contains($M)){throw "WHATIF_MARKER_NOT_FOUND::$M"}}
Write-Output "DEFAULT_PRIVILEGES_LOCAL_HARDENING_WHATIF=PASS"; Write-Output "DATABASE_WRITE=NO"; Write-Output "STOP_BEFORE_LIVE_WRITE=YES"
