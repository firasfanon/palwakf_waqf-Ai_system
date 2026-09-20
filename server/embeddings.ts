/**
 * Semantic search helpers.
 *
 * Embedding generation is local-first through Ollama and the dedicated
 * nomic-embed-text provider. This removes the legacy Forge/OpenAI placeholder
 * from the retrieval path while preserving the existing cosine/hybrid helpers.
 */

import { generateLocalEmbedding } from "./knowledgeEmbeddings";

export async function generateEmbeddings(text: string): Promise<number[]> {
  return generateLocalEmbedding(text);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * 
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns Similarity score between 0 and 1 (1 = identical, 0 = completely different)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Perform semantic search on a list of documents
 * 
 * @param queryEmbedding - Embedding vector of the search query
 * @param documents - Array of documents with their embeddings
 * @param topK - Number of top results to return (default: 5)
 * @returns Array of documents sorted by semantic similarity
 */
export function semanticSearch<T extends { embedding?: string }>(
  queryEmbedding: number[],
  documents: T[],
  topK: number = 5
): Array<T & { similarityScore: number }> {
  const results = documents
    .filter((doc) => doc.embedding) // Only include documents with embeddings
    .map((doc) => {
      const docEmbedding = JSON.parse(doc.embedding!);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      return {
        ...doc,
        similarityScore: similarity,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by similarity (descending)
    .slice(0, topK); // Take top K results

  return results;
}

/**
 * Hybrid search combining semantic and keyword-based search
 * 
 * @param queryEmbedding - Embedding vector of the search query
 * @param documents - Array of documents with embeddings and keyword scores
 * @param semanticWeight - Weight for semantic similarity (0-1, default: 0.7)
 * @param topK - Number of top results to return (default: 5)
 * @returns Array of documents sorted by combined score
 */
export function hybridSearch<T extends { embedding?: string | null; keywordScore?: number }>(
  queryEmbedding: number[],
  documents: T[],
  semanticWeight: number = 0.7,
  topK: number = 5
): Array<T & { similarityScore: number; keywordScore: number; combinedScore: number }> {
  const keywordWeight = 1 - semanticWeight;

  const results = documents
    .filter((doc) => doc.embedding) // Only include documents with embeddings
    .map((doc) => {
      const docEmbedding = JSON.parse(doc.embedding!);
      const similarityScore = cosineSimilarity(queryEmbedding, docEmbedding);
      const keywordScore = doc.keywordScore || 0;
      const combinedScore = similarityScore * semanticWeight + keywordScore * keywordWeight;

      return {
        ...doc,
        similarityScore,
        keywordScore,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore) // Sort by combined score (descending)
    .slice(0, topK); // Take top K results

  return results;
}
