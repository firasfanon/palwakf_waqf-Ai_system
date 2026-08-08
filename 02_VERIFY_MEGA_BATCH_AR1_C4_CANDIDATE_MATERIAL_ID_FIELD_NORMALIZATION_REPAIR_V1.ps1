param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
)

$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$verifier = Join-Path $ScriptRoot "scripts\verify-mega-batch-ar1-c4-candidate-material-id-field-normalization.mjs"

if (!(Test-Path -LiteralPath $verifier -PathType Leaf)) {
  throw "VERIFIER_NOT_FOUND: $verifier"
}

node $verifier $SourceRoot
