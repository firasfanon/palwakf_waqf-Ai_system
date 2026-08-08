param(
  [string]$SourceRoot = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
)

$ErrorActionPreference = "Stop"

$verifier = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "scripts\verify-mega-batch-ar1-c4-uuid-knowledge-document-resolution.mjs"
if (!(Test-Path -LiteralPath $verifier -PathType Leaf)) {
  throw "VERIFIER_NOT_FOUND: $verifier"
}

node $verifier $SourceRoot
