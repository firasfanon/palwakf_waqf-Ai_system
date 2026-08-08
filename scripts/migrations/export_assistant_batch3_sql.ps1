
param(
  [string]$RuntimeFile = $env:ASSISTANT_LOCAL_RUNTIME_FILE
)

function Find-RuntimeFile {
  param([string]$BaseDir, [string]$Override)
  $candidates = @()
  if ($Override) { $candidates += (Join-Path $BaseDir $Override) }
  $candidates += (Join-Path $BaseDir ".palwakf\runtime\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir ".manus\db\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir ".manus\runtime\local_runtime_store.json")
  $candidates += (Join-Path $BaseDir "local_runtime_store.json")
  $candidates += (Join-Path $BaseDir "runtime\local_runtime_store.json")
  $candidates = $candidates | Select-Object -Unique
  foreach ($c in $candidates) {
    if (Test-Path $c) { return $c }
  }
  throw "Local runtime file not found. Searched:`n- " + ($candidates -join "`n- ")
}

function Get-DeterministicGuid {
  param([string]$Seed)
  $md5 = [System.Security.Cryptography.MD5]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Seed)
    $hash = $md5.ComputeHash($bytes)
  } finally {
    $md5.Dispose()
  }
  $hash[6] = ($hash[6] -band 0x0F) -bor 0x40
  $hash[8] = ($hash[8] -band 0x3F) -bor 0x80
  return [Guid]::New($hash)
}

function Escape-SqlText {
  param($Value)
  if ($null -eq $Value -or $Value -eq '') { return "null" }
  $s = [string]$Value
  return "'" + $s.Replace("'", "''") + "'"
}

function Escape-SqlJson {
  param($Value)
  if ($null -eq $Value) { return "'{}'::jsonb" }
  $json = $Value | ConvertTo-Json -Depth 25 -Compress
  return "'" + $json.Replace("'", "''") + "'::jsonb"
}

function To-IsoOrNull {
  param($Value)
  if ($null -eq $Value -or $Value -eq '') { return $null }
  try {
    return ([DateTime]$Value).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  } catch {
    return $null
  }
}

function Safe-Lower {
  param($Value)
  if ($null -eq $Value) { return "" }
  return ([string]$Value).ToLower()
}

function Infer-SourceType {
  param($Doc)
  if ($Doc.pdfUrl -or $Doc.fileUrl) { return "pdf_upload" }
  if ($Doc.sourceUrl -and ([string]$Doc.sourceUrl -like "local://*")) { return "seeded" }
  if ($Doc.sourceUrl -or ([string]$Doc.source -match "http")) { return "external_fetch" }
  return "manual"
}

function Infer-Status {
  param($Doc)
  if ($Doc.isActive -eq 1 -or $Doc.isActive -eq $true -or ([string]$Doc.isActive -eq 'true')) { return "approved" }
  return "draft"
}

function Infer-AuthorityLevel {
  param([string]$SourceType)
  if ($SourceType -in @("seeded","pdf_upload","external_fetch")) { return "reference" }
  return "unverified"
}

function Normalize-DomainScope {
  param([string]$Category)
  $value = ""
  if ($null -ne $Category) { $value = ([string]$Category).ToLower() }

  if ($value -in @("fiqh","jurisprudence","islamic_law")) { return "fiqh" }
  if ($value -in @("waqf_law","law","legal","regulation","regulations")) { return "waqf_law" }
  if ($value -in @("administrative","procedure","procedural")) { return "administrative" }
  if ($value -in @("historical","history")) { return "historical" }
  if ($value -in @("public_info","public")) { return "public_info" }
  if ($value -in @("internal_procedure","internal")) { return "internal_procedure" }
  return "other"
}

function Get-FirstNonEmptyString {
  param([Parameter(ValueFromRemainingArguments=$true)]$Values)
  foreach ($v in $Values) {
    if ($null -ne $v) {
      $s = [string]$v
      if ($s.Trim().Length -gt 0) { return $s }
    }
  }
  return $null
}

function Make-StoragePath {
  param([string]$InputPath, [string]$FallbackId)
  if ([string]::IsNullOrWhiteSpace($InputPath)) { return "legacy://missing-path/$FallbackId" }
  if ($InputPath -like "local://*") { return $InputPath }
  if ($InputPath -like "http://*" -or $InputPath -like "https://*") { return $InputPath }
  if ($InputPath -like "data:*") { return "legacy://inline-data-url/$FallbackId" }
  return $InputPath
}

$baseDir = (Get-Location).Path
$runtimePath = Find-RuntimeFile -BaseDir $baseDir -Override $RuntimeFile
Write-Host "[batch3.sqlgen] runtime file: $runtimePath"

$json = Get-Content $runtimePath -Raw | ConvertFrom-Json
$knowledgeDocs = @($json.knowledgeDocuments)
$documentFiles = @($json.documentFiles)

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = Join-Path (Split-Path $runtimePath -Parent) "migration_reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$sqlPath = Join-Path $reportDir "migration_batch3_generated_$stamp.sql"

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("-- Batch 3 generated SQL")
$lines.Add("-- Source file: $runtimePath")
$lines.Add("-- Generated at: $(Get-Date -Format s)")
$lines.Add("begin;")
$lines.Add("")

$refCount = 0
$knowCount = 0
$fileCount = 0
$citeCount = 0

for ($i = 0; $i -lt $knowledgeDocs.Count; $i++) {
  $doc = $knowledgeDocs[$i]
  if ($null -eq $doc) { continue }

  $legacyId = Get-FirstNonEmptyString $doc.id $doc.documentId ("index:$i")
  $title = Get-FirstNonEmptyString $doc.title $doc.name $doc.label $doc.source ("Knowledge Document " + ($i + 1))
  $summary = Get-FirstNonEmptyString $doc.summary $doc.description
  $content = Get-FirstNonEmptyString $doc.content $doc.text $doc.body $summary
  if ($null -eq $content) { $content = "" }

  $category = Get-FirstNonEmptyString $doc.category
  $sourceType = Infer-SourceType $doc
  $status = Infer-Status $doc
  $authority = Infer-AuthorityLevel $sourceType
  $domain = Normalize-DomainScope $category
  $createdAt = To-IsoOrNull $doc.createdAt
  if (-not $createdAt) { $createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
  $updatedAt = To-IsoOrNull $doc.updatedAt
  if (-not $updatedAt) { $updatedAt = $createdAt }
  $sourceName = Get-FirstNonEmptyString $doc.source
  $sourceUrl = Get-FirstNonEmptyString $doc.sourceUrl $doc.source_url

  $refId = [string](Get-DeterministicGuid ("assistant.reference_documents:{0}:{1}" -f $legacyId, $title))
  $knowId = [string](Get-DeterministicGuid ("assistant.knowledge_documents:{0}:{1}" -f $legacyId, $title))

  $sourceIdSql = "null"
  if ($sourceName) {
    $sourceIdSql = "(select id from assistant.knowledge_sources ks where ks.name = " + (Escape-SqlText $sourceName) + " or ks.metadata_json->>'legacy_id' = " + (Escape-SqlText $sourceName) + " limit 1)"
  }

  $reviewDecision = "null"
  if ($status -eq "approved") { $reviewDecision = "'approve'" }

  $refMeta = @{
    legacy_id = $legacyId
    legacy_source_name = $sourceName
    legacy_source_url = $sourceUrl
    original_record = $doc
  }

  $knowMeta = @{
    legacy_id = $legacyId
    legacy_source_name = $sourceName
    legacy_source_url = $sourceUrl
    embedding_present = [bool]($null -ne $doc.embedding)
    original_record = $doc
  }

  $refSql = @"
insert into assistant.reference_documents (
  id, source_id, title, document_type, language, status, authority_level, domain_scope, source_type,
  summary, content_text, content_hash, metadata_json, effective_from, effective_to, approval_version,
  review_notes, review_decision, reviewed_by, reviewed_at, created_by, created_at, updated_at
) values (
  $(Escape-SqlText $refId),
  $sourceIdSql,
  $(Escape-SqlText $title),
  $(Escape-SqlText 'knowledge_seed'),
  $(Escape-SqlText 'ar'),
  $(Escape-SqlText $status),
  $(Escape-SqlText $authority),
  $(Escape-SqlText $domain),
  $(Escape-SqlText $sourceType),
  $(Escape-SqlText $summary),
  $(Escape-SqlText $content),
  $(Escape-SqlText $null),
  $(Escape-SqlJson $refMeta),
  null,
  null,
  1,
  null,
  $reviewDecision,
  null,
  $(if ($status -eq 'approved') { Escape-SqlText $createdAt } else { 'null' }),
  $(Escape-SqlText $null),
  $(Escape-SqlText $createdAt),
  $(Escape-SqlText $updatedAt)
)
on conflict (id) do update set
  source_id = excluded.source_id,
  title = excluded.title,
  summary = excluded.summary,
  content_text = excluded.content_text,
  metadata_json = excluded.metadata_json,
  updated_at = excluded.updated_at;
"@
  $lines.Add($refSql.Trim())
  $lines.Add("")
  $refCount++

  $tagsJson = if ($doc.tags) { $doc.tags } else { @() }

  $knowSql = @"
insert into assistant.knowledge_documents (
  id, reference_document_id, source_id, title, category, status, authority_level, domain_scope, source_type,
  summary, content, tags, is_chat_eligible, chat_priority, grounding_weight, approval_version,
  review_notes, review_decision, reviewed_by, reviewed_at, effective_from, effective_to, supersedes_document_id,
  metadata_json, created_by, created_at, updated_at
) values (
  $(Escape-SqlText $knowId),
  $(Escape-SqlText $refId),
  $sourceIdSql,
  $(Escape-SqlText $title),
  $(Escape-SqlText $category),
  $(Escape-SqlText $status),
  $(Escape-SqlText $authority),
  $(Escape-SqlText $domain),
  $(Escape-SqlText $sourceType),
  $(Escape-SqlText $summary),
  $(Escape-SqlText $content),
  $(Escape-SqlJson $tagsJson),
  $(if ($status -eq 'approved') { 'true' } else { 'false' }),
  50,
  1.0,
  1,
  null,
  $reviewDecision,
  null,
  $(if ($status -eq 'approved') { Escape-SqlText $createdAt } else { 'null' }),
  null,
  null,
  null,
  $(Escape-SqlJson $knowMeta),
  $(Escape-SqlText $null),
  $(Escape-SqlText $createdAt),
  $(Escape-SqlText $updatedAt)
)
on conflict (id) do update set
  reference_document_id = excluded.reference_document_id,
  source_id = excluded.source_id,
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  content = excluded.content,
  tags = excluded.tags,
  is_chat_eligible = excluded.is_chat_eligible,
  metadata_json = excluded.metadata_json,
  updated_at = excluded.updated_at;
"@
  $lines.Add($knowSql.Trim())
  $lines.Add("")
  $knowCount++

  $explicitFiles = @($documentFiles | Where-Object {
    $_.documentId -eq $legacyId -or $_.document_id -eq $legacyId -or $_.knowledgeDocumentId -eq $legacyId -or $_.knowledge_document_id -eq $legacyId
  })

  $fileCandidates = @()
  if ($explicitFiles.Count -gt 0) {
    $fileCandidates = $explicitFiles
  } else {
    if ($doc.sourceUrl) { $fileCandidates += [pscustomobject]@{ sourceUrl = $doc.sourceUrl } }
    elseif ($doc.source_url) { $fileCandidates += [pscustomobject]@{ sourceUrl = $doc.source_url } }
    elseif ($doc.pdfUrl) { $fileCandidates += [pscustomobject]@{ pdfUrl = $doc.pdfUrl } }
    elseif ($doc.fileUrl) { $fileCandidates += [pscustomobject]@{ fileUrl = $doc.fileUrl } }
  }

  $firstRefFileId = $null
  for ($fi = 0; $fi -lt $fileCandidates.Count; $fi++) {
    $f = $fileCandidates[$fi]
    $fileLegacyId = Get-FirstNonEmptyString $f.id $f.fileId ("$legacyId:file:$fi")
    $refFileId = [string](Get-DeterministicGuid ("assistant.reference_files:{0}:{1}" -f $fileLegacyId, $refId))
    if (-not $firstRefFileId) { $firstRefFileId = $refFileId }

    $candidatePath = Get-FirstNonEmptyString $f.storagePath $f.storage_path $f.fileUrl $f.file_url $f.pdfUrl $f.pdf_url $f.sourceUrl $f.source_url ("legacy://missing-path/$refFileId")
    $storagePath = Make-StoragePath -InputPath $candidatePath -FallbackId $refFileId
    $mime = Get-FirstNonEmptyString $f.mimeType $f.mime_type
    if (-not $mime) {
      if ($candidatePath -like "*.md*") { $mime = "text/markdown" }
      elseif ($candidatePath -like "*.txt*") { $mime = "text/plain" }
      elseif ($candidatePath -like "data:application/pdf*") { $mime = "application/pdf" }
    }

    $fileMeta = @{
      legacy_file_id = $fileLegacyId
      original_record = $f
    }

    $fileSql = @"
insert into assistant.reference_files (
  id, reference_document_id, storage_path, original_filename, mime_type, file_size_bytes,
  file_hash, is_primary, ocr_text, extracted_text, metadata_json
) values (
  $(Escape-SqlText $refFileId),
  $(Escape-SqlText $refId),
  $(Escape-SqlText $storagePath),
  $(Escape-SqlText (Get-FirstNonEmptyString $f.originalFilename $f.original_filename $f.fileName $sourceName)),
  $(Escape-SqlText $mime),
  $(if ($f.fileSize) { [int64]$f.fileSize } elseif ($f.file_size) { [int64]$f.file_size } else { 'null' }),
  $(Escape-SqlText (Get-FirstNonEmptyString $f.fileHash $f.file_hash)),
  $(if ($fi -eq 0) { 'true' } else { 'false' }),
  $(Escape-SqlText (Get-FirstNonEmptyString $f.ocrText $f.ocr_text)),
  $(Escape-SqlText (Get-FirstNonEmptyString $f.extractedText $f.extracted_text $(if ($fi -eq 0) { $content } else { $null }))),
  $(Escape-SqlJson $fileMeta)
)
on conflict (id) do update set
  storage_path = excluded.storage_path,
  original_filename = excluded.original_filename,
  mime_type = excluded.mime_type,
  file_size_bytes = excluded.file_size_bytes,
  file_hash = excluded.file_hash,
  is_primary = excluded.is_primary,
  ocr_text = excluded.ocr_text,
  extracted_text = excluded.extracted_text,
  metadata_json = excluded.metadata_json;
"@
    $lines.Add($fileSql.Trim())
    $lines.Add("")
    $fileCount++
  }

  $locator = Get-FirstNonEmptyString $sourceUrl $sourceName
  $excerpt = if ($content.Length -gt 500) { $content.Substring(0, 500) } else { $content }
  $citeMeta = @{ legacy_id = $legacyId }
  $citeId = [string](Get-DeterministicGuid ("assistant.knowledge_citations:{0}:{1}" -f $knowId, $refId))

  $citeSql = @"
insert into assistant.knowledge_citations (
  id, knowledge_document_id, reference_document_id, reference_file_id, citation_type, locator, excerpt, metadata_json
) values (
  $(Escape-SqlText $citeId),
  $(Escape-SqlText $knowId),
  $(Escape-SqlText $refId),
  $(Escape-SqlText $firstRefFileId),
  'source_link',
  $(Escape-SqlText $locator),
  $(Escape-SqlText $excerpt),
  $(Escape-SqlJson $citeMeta)
)
on conflict (id) do update set
  reference_file_id = excluded.reference_file_id,
  locator = excluded.locator,
  excerpt = excluded.excerpt,
  metadata_json = excluded.metadata_json;
"@
  $lines.Add($citeSql.Trim())
  $lines.Add("")
  $citeCount++
}

$lines.Add("commit;")
$lines.Add("")

$sqlText = $lines -join "`r`n"
Set-Content -Path $sqlPath -Value $sqlText -Encoding UTF8

Write-Host "[batch3.sqlgen] completed successfully"
Write-Host "[batch3.sqlgen] local knowledge document rows: $($knowledgeDocs.Count)"
Write-Host "[batch3.sqlgen] local document file rows: $($documentFiles.Count)"
Write-Host "[batch3.sqlgen] generated reference documents: $refCount"
Write-Host "[batch3.sqlgen] generated knowledge documents: $knowCount"
Write-Host "[batch3.sqlgen] generated reference files: $fileCount"
Write-Host "[batch3.sqlgen] generated citations: $citeCount"
Write-Host "[batch3.sqlgen] sql file: $sqlPath"
