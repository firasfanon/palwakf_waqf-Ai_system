param(
  [string]$RuntimeFile = $env:ASSISTANT_LOCAL_RUNTIME_FILE
)

function Find-RuntimeFile {
  param(
    [string]$BaseDir,
    [string]$Override
  )

  $candidates = @()

  if ($Override) {
    $candidates += (Join-Path $BaseDir $Override)
  }

  $candidates += (Join-Path $BaseDir ".manus\db\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir ".palwakf\runtime\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir ".manus\runtime\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir "local_runtime_store.json")
  $candidates += (Join-Path $BaseDir "runtime\local_runtime_store.json")

  $candidates = $candidates | Select-Object -Unique

  foreach ($c in $candidates) {
    if (Test-Path $c) {
      return $c
    }
  }

  throw "Runtime file not found. Searched:`n- " + ($candidates -join "`n- ")
}

function New-Timestamp {
  return (Get-Date -Format "yyyyMMdd_HHmmss")
}

function Looks-LikeArabicMojibake {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  return (
    $Value.Contains("ط") -or
    $Value.Contains("ظ") -or
    $Value.Contains("Ù") -or
    $Value.Contains("Ø")
  )
}

function Repair-ArabicMojibake1252ToUtf8 {
  param([string]$Value)

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  $cp1252 = [System.Text.Encoding]::GetEncoding(1252)
  $utf8 = [System.Text.Encoding]::UTF8

  try {
    return $utf8.GetString($cp1252.GetBytes($Value))
  }
  catch {
    return $Value
  }
}

function Repair-StringIfNeeded {
  param(
    [string]$Value,
    [ref]$Counter
  )

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  if (Looks-LikeArabicMojibake $Value) {
    $fixed = Repair-ArabicMojibake1252ToUtf8 $Value

    if ($fixed -ne $Value) {
      $Counter.Value++
      return $fixed
    }
  }

  return $Value
}

function Repair-ObjectRecursive {
  param(
    $Node,
    [ref]$Counter
  )

  if ($null -eq $Node) {
    return $Node
  }

  if ($Node -is [string]) {
    return (Repair-StringIfNeeded -Value $Node -Counter $Counter)
  }

  if ($Node -is [System.Collections.IList]) {
    for ($i = 0; $i -lt $Node.Count; $i++) {
      $Node[$i] = Repair-ObjectRecursive -Node $Node[$i] -Counter $Counter
    }
    return $Node
  }

  $psobj = $Node -as [psobject]
  if ($psobj) {
    foreach ($prop in $psobj.PSObject.Properties) {
      if ($prop.IsGettable -and $prop.IsSettable) {
        if ($null -ne $prop.Value) {
          $prop.Value = Repair-ObjectRecursive -Node $prop.Value -Counter $Counter
        }
      }
    }
  }

  return $Node
}

$baseDir = (Get-Location).Path
$runtimePath = Find-RuntimeFile -BaseDir $baseDir -Override $RuntimeFile
$runtimeDir = Split-Path $runtimePath -Parent
$stamp = New-Timestamp

$backupDir = Join-Path $runtimeDir "backups"
$outputDir = Join-Path $runtimeDir "repair_reports"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$backupPath = Join-Path $backupDir ("local_runtime_store_pre_repair_" + $stamp + ".json")
Copy-Item -Force $runtimePath $backupPath

Write-Host "[repair.ar] runtime file: $runtimePath"
Write-Host "[repair.ar] backup: $backupPath"

$json = Get-Content $runtimePath -Raw | ConvertFrom-Json

$counter = 0

if ($null -ne $json) {
  $json = Repair-ObjectRecursive -Node $json -Counter ([ref]$counter)
}

$outputPath = Join-Path $outputDir ("local_runtime_store_repaired_" + $stamp + ".json")
$json | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 $outputPath

Write-Host "[repair.ar] repaired strings: $counter"
Write-Host "[repair.ar] repaired file: $outputPath"

$docs = @($json.knowledgeDocuments)
if ($docs.Count -gt 0) {
  Write-Host "[repair.ar] preview first knowledge document:"
  $docs[0] | Select-Object title, category, source, tags | ConvertTo-Json -Depth 8
}