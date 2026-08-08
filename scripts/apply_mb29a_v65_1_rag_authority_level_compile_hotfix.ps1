[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$target = Join-Path $ProjectRoot 'server\rag.ts'
if (-not (Test-Path -LiteralPath $target)) {
  throw "Expected source file was not found: $target"
}

$old = 'authorityLevel: doc.trust?.authorityLevel || doc.authorityLevel || null,'
$new = 'authorityLevel: doc.trust?.authorityLevel ?? assessKnowledgeTrust(doc).authorityLevel,'
$content = [System.IO.File]::ReadAllText($target)
$matches = [regex]::Matches($content, [regex]::Escape($old)).Count

if ($matches -ne 1) {
  throw "Patch safety gate failed. Expected exactly one legacy expression; found $matches. No file was modified."
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = "$target.bak_mb29a_v65_1_$stamp"
Copy-Item -LiteralPath $target -Destination $backup -Force

$updated = $content.Replace($old, $new)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($target, $updated, $utf8NoBom)

Write-Host "Patch applied successfully. Backup: $backup"
Write-Host 'Next required command: pnpm.cmd run check'
