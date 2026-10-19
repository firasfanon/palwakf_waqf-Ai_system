import type {
  AssistantDataFilter,
  AssistantDataPort,
  AssistantDataResult,
  AssistantInsertRequest,
  AssistantSelectRequest,
  AssistantUpdateRequest,
} from "../../ports/assistantDataPort";
import { getAssistantSupabaseClient } from "./assistantRuntimeClient";

function applyFilters(query: any, filters: AssistantDataFilter[] = []) {
  let next = query;
  for (const filter of filters) {
    if (filter.op === "eq") next = next.eq(filter.column, filter.value);
    else if (filter.op === "in") next = next.in(filter.column, filter.values);
    else if (filter.op === "or") next = next.or(filter.expression);
  }
  return next;
}

function finishQuery(query: any, single?: "single" | "maybeSingle") {
  if (single === "single") return query.single();
  if (single === "maybeSingle") return query.maybeSingle();
  return query;
}

class SupabaseAssistantDataAdapter implements AssistantDataPort {
  constructor(private readonly client: any) {}

  async rpc<T = any>(name: string, args: Record<string, unknown> = {}): Promise<AssistantDataResult<T>> {
    return await this.client.rpc(name, args);
  }

  async select<T = any>(request: AssistantSelectRequest): Promise<AssistantDataResult<T>> {
    let query = this.client.from(request.table).select(request.columns);
    query = applyFilters(query, request.filters);
    for (const order of request.order ?? []) {
      query = query.order(order.column, { ascending: order.ascending ?? true });
    }
    if (request.limit !== undefined) query = query.limit(request.limit);
    return await finishQuery(query, request.single);
  }

  async insert<T = any>(request: AssistantInsertRequest): Promise<AssistantDataResult<T>> {
    let query = this.client.from(request.table).insert(request.values);
    if (request.returning) query = query.select(request.returning);
    return await finishQuery(query, request.single);
  }

  async update<T = any>(request: AssistantUpdateRequest): Promise<AssistantDataResult<T>> {
    let query = this.client.from(request.table).update(request.values);
    query = applyFilters(query, request.filters);
    if (request.returning) query = query.select(request.returning);
    return await finishQuery(query, request.single);
  }
}

export function getAssistantDataPort(): AssistantDataPort | null {
  const client = getAssistantSupabaseClient();
  return client ? new SupabaseAssistantDataAdapter(client) : null;
}
