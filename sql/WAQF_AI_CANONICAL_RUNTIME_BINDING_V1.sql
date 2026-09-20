-- WAQF AI Canonical Runtime Binding V1
-- Read-only public projection for approved knowledge plus local-UAT review content.
-- No lifecycle mutation. No RLS weakening. No service-role exposure.

create or replace function assistant.runtime_public_knowledge_documents_v1(
  p_search text default null,
  p_category text default null,
  p_limit integer default 500
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path = pg_catalog, public, assistant
as $$
  select jsonb_build_object(
    'id', kd.id,
    'uuid', kd.id,
    'referenceDocumentId', kd.reference_document_id,
    'sourceId', kd.source_id,
    'title', kd.title,
    'content', coalesce(kd.content, ''),
    'category', coalesce(kd.category, 'reference'),
    'source', coalesce(kd.metadata_json->>'legacy_source_name', ks.name),
    'sourceUrl', coalesce(
      nullif(kd.metadata_json->>'legacy_source_url', ''),
      nullif(kd.metadata_json->>'source_url', ''),
      nullif(kd.metadata_json#>>'{original_payload,row,url}', ''),
      nullif(rd.metadata_json->>'source_url', ''),
      nullif(rd.metadata_json#>>'{original_payload,row,url}', ''),
      nullif(ks.base_url, '')
    ),
    'tags', kd.tags,
    'status', kd.status,
    'isChatEligible', kd.is_chat_eligible,
    'authorityLevel', kd.authority_level,
    'domainScope', kd.domain_scope,
    'sourceType', kd.source_type,
    'summary', kd.summary,
    'approvalVersion', kd.approval_version,
    'metadataJson', kd.metadata_json,
    'referenceDocument',
      case
        when rd.id is null then null
        else jsonb_build_object(
          'id', rd.id,
          'title', rd.title,
          'documentType', rd.document_type,
          'status', rd.status,
          'authorityLevel', rd.authority_level,
          'verificationStatus', rd.verification_status,
          'visibilityScope', rd.visibility_scope,
          'contentStatus', rd.content_status,
          'metadataJson', rd.metadata_json
        )
      end,
    'citations',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', kc.id,
              'referenceDocumentId', kc.reference_document_id,
              'referenceFileId', kc.reference_file_id,
              'citationType', kc.citation_type,
              'locator', kc.locator,
              'excerpt', kc.excerpt,
              'verificationStatus', kc.verification_status,
              'metadataJson', kc.metadata_json
            )
            order by kc.created_at asc
          )
          from assistant.knowledge_citations kc
          where kc.knowledge_document_id = kd.id
        ),
        '[]'::jsonb
      ),
    'createdAt', kd.created_at,
    'updatedAt', kd.updated_at
  ) as payload
  from assistant.knowledge_documents kd
  left join assistant.knowledge_sources ks
    on ks.id = kd.source_id
  left join assistant.reference_documents rd
    on rd.id = kd.reference_document_id
  where kd.status = 'approved'
    and lower(
      coalesce(
        kd.visibility_scope,
        kd.metadata_json->>'visibility_scope',
        'public'
      )
    ) = 'public'
    and lower(
      coalesce(
        kd.content_status,
        kd.metadata_json->>'content_status',
        'production'
      )
    ) = 'production'
    and lower(
      coalesce(
        kd.metadata_json->>'tool_origin',
        kd.metadata_json->>'toolOrigin',
        ''
      )
    ) <> 'waqf_research_answer'
    and (
      p_category is null
      or btrim(p_category) = ''
      or kd.category = btrim(p_category)
    )
    and (
      p_search is null
      or btrim(p_search) = ''
      or kd.title ilike '%' || btrim(p_search) || '%'
      or coalesce(kd.content, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(kd.tags::text, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(ks.name, '') ilike '%' || btrim(p_search) || '%'
    )
  order by kd.updated_at desc, kd.created_at desc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
$$;
revoke all on function assistant.runtime_public_knowledge_documents_v1(text, text, integer)
  from public;
grant execute on function assistant.runtime_public_knowledge_documents_v1(text, text, integer)
  to anon, authenticated, service_role;

comment on function assistant.runtime_public_knowledge_documents_v1(text, text, integer)
is 'Read-only runtime projection: approved + public + production knowledge only. Does not imply Chat/RAG eligibility.';

create or replace function assistant.runtime_legacy_review_content_v1(
  p_source_table text
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path = pg_catalog, public, assistant
as $$
  select lor.payload_json as payload
  from assistant.legacy_operational_records lor
  where p_source_table in ('faqs', 'suggested_questions')
    and lor.legacy_batch = 'legacy_manus_final_content_closure_v1'
    and lor.legacy_source_table = p_source_table
    and lor.status = 'staged_for_page_binding'
    and coalesce(
      (current_setting('request.headers', true)::jsonb ->>
        'x-palwakf-legacy-content-uat'),
      ''
    ) = 'enabled'
  order by
    case
      when coalesce(lor.payload_json->>'order', '') ~ '^[0-9]+$'
        then (lor.payload_json->>'order')::integer
      when coalesce(lor.payload_json->>'display_order', '') ~ '^[0-9]+$'
        then (lor.payload_json->>'display_order')::integer
      else 999999
    end,
    lor.created_at asc;
$$;
revoke all on function assistant.runtime_legacy_review_content_v1(text)
  from public;
grant execute on function assistant.runtime_legacy_review_content_v1(text)
  to anon, authenticated, service_role;

comment on function assistant.runtime_legacy_review_content_v1(text)
is 'Read-only local-UAT projection for exact recovered Legacy Manus FAQ/Suggested Question rows. Requires x-palwakf-legacy-content-uat=enabled. Review-only; no lifecycle promotion.';
