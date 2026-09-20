import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMBEDDING_DIMENSIONS,
  toPgVectorLiteral,
} from "./knowledgeEmbeddings";

describe("knowledge embeddings", () => {
  it("serializes exactly 768-dimensional vectors for pgvector", () => {
    const vector = Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, (_, i) => i / 1000);
    const literal = toPgVectorLiteral(vector);
    expect(literal.startsWith("[")).toBe(true);
    expect(literal.endsWith("]")).toBe(true);
    expect(literal.split(",")).toHaveLength(DEFAULT_EMBEDDING_DIMENSIONS);
  });

  it("fails closed on an embedding dimension mismatch", () => {
    expect(() => toPgVectorLiteral([1, 2, 3])).toThrow(/expected 768/);
  });
});
