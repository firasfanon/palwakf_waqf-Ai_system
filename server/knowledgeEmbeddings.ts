export const DEFAULT_EMBEDDING_MODEL =
  process.env.PALWAKF_EMBEDDING_MODEL?.trim() || "nomic-embed-text";
export const DEFAULT_EMBEDDING_DIMENSIONS = 768;

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
}

export async function generateLocalEmbeddings(
  input: string | string[],
  model = DEFAULT_EMBEDDING_MODEL,
): Promise<number[][]> {
  const values = Array.isArray(input) ? input : [input];
  if (!values.length) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${ollamaBaseUrl()}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, input: values }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Ollama embedding failed: HTTP ${response.status}`);
    }
    const payload = await response.json() as any;
    const embeddings = Array.isArray(payload?.embeddings) ? payload.embeddings : [];
    if (embeddings.length !== values.length) {
      throw new Error("Ollama embedding count mismatch");
    }
    for (const vector of embeddings) {
      if (!Array.isArray(vector) || vector.length !== DEFAULT_EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch: expected ${DEFAULT_EMBEDDING_DIMENSIONS}, got ${Array.isArray(vector) ? vector.length : 0}`,
        );
      }
    }
    return embeddings;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  return (await generateLocalEmbeddings(text))[0] || [];
}

export function toPgVectorLiteral(values: number[]): string {
  if (values.length !== DEFAULT_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Cannot serialize embedding with ${values.length} dimensions; expected ${DEFAULT_EMBEDDING_DIMENSIONS}`,
    );
  }
  return `[${values.map((value) => Number(value).toFixed(9)).join(",")}]`;
}
