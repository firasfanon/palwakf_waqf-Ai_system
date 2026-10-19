export type AssistantDataFilter =
  | { op: "eq"; column: string; value: unknown }
  | { op: "in"; column: string; values: unknown[] }
  | { op: "or"; expression: string };

export type AssistantDataOrder = {
  column: string;
  ascending?: boolean;
};

export type AssistantSelectRequest = {
  table: string;
  columns: string;
  filters?: AssistantDataFilter[];
  order?: AssistantDataOrder[];
  limit?: number;
  single?: "single" | "maybeSingle";
};

export type AssistantInsertRequest = {
  table: string;
  values: unknown;
  returning?: string;
  single?: "single" | "maybeSingle";
};

export type AssistantUpdateRequest = {
  table: string;
  values: unknown;
  filters: AssistantDataFilter[];
  returning?: string;
  single?: "single" | "maybeSingle";
};

export type AssistantDataResult<T = any> = {
  data: T | null;
  error: any | null;
};

export interface AssistantDataPort {
  rpc<T = any>(name: string, args?: Record<string, unknown>): Promise<AssistantDataResult<T>>;
  select<T = any>(request: AssistantSelectRequest): Promise<AssistantDataResult<T>>;
  insert<T = any>(request: AssistantInsertRequest): Promise<AssistantDataResult<T>>;
  update<T = any>(request: AssistantUpdateRequest): Promise<AssistantDataResult<T>>;
}
