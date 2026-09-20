import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveAssistantSupabaseConfig } from "./canonicalRuntimeBinding";
import {
  generateLocalEmbedding,
  toPgVectorLiteral,
} from "./knowledgeEmbeddings";

let clientSingleton: SupabaseClient<any, any, any, any, any> | null = null;

function client() {
  if (clientSingleton) return clientSingleton;
  const config = resolveAssistantSupabaseConfig(process.env);
  if (!config) return null;
  clientSingleton = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "assistant" },
    global: { headers: { "x-assistant-runtime": "waqf-ai-governed-rag-v1" } },
  });
  return clientSingleton;
}

export type GovernedRagChunk = {
  chunkId: string;
  knowledgeDocumentId: string;
  referenceDocumentId: string;
  sourceId: string;
  title: string;
  category: string | null;
  sectionType: string;
  heading: string | null;
  locator: string | null;
  content: string;
  contentHash: string;
  sourceName: string | null;
  sourceUrl: string | null;
  referenceTitle: string | null;
  authorityLevel: string;
  citation: {
    id?: string;
    locator?: string | null;
    excerpt?: string | null;
    verificationStatus?: string | null;
    referenceDocumentId?: string | null;
  } | null;
  scores: {
    hybrid: number;
    semantic: number;
    lexical: number;
    trigram: number;
    entity: number;
    authority: number;
  };
};

export async function runtimeResolveKnowledgeEntities(
  query: string,
  limit = 12,
) {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.rpc("runtime_resolve_knowledge_entities_v1", {
    p_query: query,
    p_limit: limit,
  });
  if (error) return [];
  return (data || []).map((row: any) => row?.payload ?? row);
}

export async function runtimeHybridRagSearch(
  query: string,
  options?: { limit?: number; useEmbeddings?: boolean },
): Promise<GovernedRagChunk[]> {
  const c = client();
  if (!c) return [];

  let queryEmbedding: string | null = null;
  if (options?.useEmbeddings !== false) {
    try {
      const vector = await generateLocalEmbedding(query);
      queryEmbedding = vector.length ? toPgVectorLiteral(vector) : null;
    } catch {
      queryEmbedding = null;
    }
  }

  const { data, error } = await c.rpc("runtime_hybrid_rag_search_v1", {
    p_query: query,
    p_query_embedding: queryEmbedding,
    p_limit: Math.min(Math.max(options?.limit || 8, 1), 30),
  });
  if (error) {
    console.warn("[governedRuntimeRag] hybrid RAG RPC unavailable:", error.message);
    return [];
  }
  return (data || [])
    .map((row: any) => row?.payload ?? row)
    .filter((row: any) => row?.knowledgeDocumentId && row?.content);
}

export function mapGovernedChunkToKnowledgeDocument(
  chunk: GovernedRagChunk,
) {
  return {
    id: chunk.knowledgeDocumentId,
    uuid: chunk.knowledgeDocumentId,
    title: chunk.title,
    category: chunk.category,
    content: chunk.content,
    source: chunk.sourceName,
    sourceUrl: chunk.sourceUrl,
    referenceDocumentId: chunk.referenceDocumentId,
    authorityLevel: chunk.authorityLevel,
    status: "approved",
    isChatEligible: true,
    contentStatus: "production",
    visibilityScope: "public",
    chunkId: chunk.chunkId,
    chunkSectionType: chunk.sectionType,
    chunkHeading: chunk.heading,
    chunkLocator: chunk.locator,
    citations: chunk.citation
      ? [
          {
            id: chunk.citation.id,
            referenceDocumentId:
              chunk.citation.referenceDocumentId || chunk.referenceDocumentId,
            locator: chunk.citation.locator || chunk.locator,
            excerpt: chunk.citation.excerpt || chunk.content.slice(0, 1000),
            verificationStatus:
              chunk.citation.verificationStatus || "verified",
          },
        ]
      : [],
    relevanceScore: Number(chunk.scores?.hybrid || 0) * 100,
    governedRagScores: chunk.scores,
    runtimeSource: "supabase_governed_chunk_rag",
  };
}
