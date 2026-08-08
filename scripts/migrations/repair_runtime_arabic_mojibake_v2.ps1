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

function Get-StrictEncoding {
  param([int]$CodePage)

  return [System.Text.Encoding]::GetEncoding(
    $CodePage,
    [System.Text.EncoderExceptionFallback]::new(),
    [System.Text.DecoderExceptionFallback]::new()
  )
}

function Contains-MojibakeMarkers {
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

function Get-ArabicScore {
  param([string]$Value)

  if ([string]::IsNullOrEmpty($Value)) {
    return -9999
  }

  $arabicCount = ([regex]::Matches($Value, '[\u0600-\u06FF]')).Count
  $mojibakeHits = ([regex]::Matches($Value, 'ط|ظ|Ù|Ø')).Count
  $replacementHits = ([regex]::Matches($Value, ' ')).Count
  $questionHits = ([regex]::Matches($Value, '\?')).Count

  return ($arabicCount * 5) - ($mojibakeHits * 3) - ($replacementHits * 8) - ($questionHits * 2)
}

function Try-RecodeToUtf8 {
  param(
    [string]$Value,
    [int]$SourceCodePage
  )

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  try {
    $enc = Get-StrictEncoding $SourceCodePage
    $utf8 = [System.Text.Encoding]::UTF8
    $bytes = $enc.GetBytes($Value)
    return $utf8.GetString($bytes)
  }
  catch {
    return $null
  }
}

function Choose-BestRepair {
  param([string]$Value)

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  if (-not (Contains-MojibakeMarkers $Value)) {
    return $Value
  }

  $candidates = @()
  $candidates += $Value

  $c1256 = Try-RecodeToUtf8 -Value $Value -SourceCodePage 1256
  if ($null -ne $c1256) { $candidates += $c1256 }

  $c1252 = Try-RecodeToUtf8 -Value $Value -SourceCodePage 1252
  if ($null -ne $c1252) { $candidates += $c1252 }

  $c28591 = Try-RecodeToUtf8 -Value $Value -SourceCodePage 28591
  if ($null -ne $c28591) { $candidates += $c28591 }

  $best = $Value
  $bestScore = Get-ArabicScore $Value

  foreach ($candidate in $candidates) {
    $score = Get-ArabicScore $candidate
    if ($score -gt $bestScore) {
      $best = $candidate
      $bestScore = $score
    }
  }

  return $best
}

function Repair-StringIfNeeded {
  param(
    [string]$Value,
    [ref]$Counter
  )

  if ([string]::IsNullOrEmpty($Value)) {
    return $Value
  }

  $fixed = Choose-BestRepair $Value

  if ($fixed -ne $Value) {
    $Counter.Value++
    return $fixed
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

$backupPath = Join-Path $backupDir ("local_runtime_store_pre_repair_v2_" + $stamp + ".json")
Copy-Item -Force $runtimePath $backupPath

Write-Host "[repair.ar.v2] runtime file: $runtimePath"
Write-Host "[repair.ar.v2] backup: $backupPath"

$json = Get-Content $runtimePath -Raw | ConvertFrom-Json

$counter = 0

if ($null -ne $json) {
  $json = Repair-ObjectRecursive -Node $json -Counter ([ref]$counter)
}

$outputPath = Join-Path $outputDir ("local_runtime_store_repaired_v2_" + $stamp + ".json")
$json | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 $outputPath

Write-Host "[repair.ar.v2] repaired strings: $counter"
Write-Host "[repair.ar.v2] repaired file: $outputPath"

$docs = @($json.knowledgeDocuments)
if ($docs.Count -gt 0) {
  Write-Host "[repair.ar.v2] preview first knowledge document:"
  $docs[0] | Select-Object title, category, source, tags | ConvertTo-Json -Depth 8
}