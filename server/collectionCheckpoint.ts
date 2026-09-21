export type CollectionQueueItem = {
  url: string;
  depth: number;
  kind: "html" | "artifact";
};

export type CollectionCheckpoint = {
  runId: string;
  collectionId: string;
  queue: CollectionQueueItem[];
  seen: string[];
  completedUrls: string[];
  skipped: Array<{ url: string; reason: string }>;
  updatedAt: string;
};

export interface CollectionCheckpointStore {
  load(runId: string): Promise<CollectionCheckpoint | null>;
  save(checkpoint: CollectionCheckpoint): Promise<void>;
  clear(runId: string): Promise<void>;
}

export class InMemoryCollectionCheckpointStore
  implements CollectionCheckpointStore
{
  private readonly rows = new Map<string, CollectionCheckpoint>();

  async load(runId: string): Promise<CollectionCheckpoint | null> {
    const row = this.rows.get(runId);
    return row ? structuredClone(row) : null;
  }

  async save(checkpoint: CollectionCheckpoint): Promise<void> {
    this.rows.set(checkpoint.runId, structuredClone(checkpoint));
  }

  async clear(runId: string): Promise<void> {
    this.rows.delete(runId);
  }
}

export function buildInitialCheckpoint(input: {
  runId: string;
  collectionId: string;
  queue: CollectionQueueItem[];
}): CollectionCheckpoint {
  return {
    runId: input.runId,
    collectionId: input.collectionId,
    queue: [...input.queue],
    seen: [],
    completedUrls: [],
    skipped: [],
    updatedAt: new Date(0).toISOString(),
  };
}
