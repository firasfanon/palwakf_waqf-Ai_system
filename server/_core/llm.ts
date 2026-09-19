import { ENV } from "./env";
import { runtimeGetSystemSettings } from "../runtimeRepository";
import { detectHardwareAdaptiveProfile } from "../hardwareAdaptiveRuntime";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

type RuntimeLlmConfig = {
  provider: 'ollama' | 'openai_compatible' | 'disabled';
  enabled: boolean;
  baseUrl: string;
  apiUrl: string;
  apiKey: string;
  configuredModel: string;
  model: string;
  timeoutMs: number;
  fallbackModels: string[];
};

const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const OLLAMA_LOCAL_FALLBACK_MODELS = ['qwen2.5:3b', 'palwakf-llama3.2-3b-64k:local', 'llama3.2:3b'];
const OLLAMA_RESEARCH_FALLBACK_MODELS = ['qwen2.5:3b', 'deepseek-r1:latest', 'deepseek-v4-flash:cloud', 'glm-5.2:cloud'];

type OllamaTagResponse = {
  models?: Array<{ name?: string | null; model?: string | null }>;
};

async function tryListOllamaModels(baseUrl: string, timeoutMs: number): Promise<string[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(3000, Math.min(timeoutMs, 15000)));

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const json = (await response.json()) as OllamaTagResponse;
    const models = Array.isArray(json.models)
      ? json.models
          .map((item) => trim(item?.name || item?.model))
          .filter(Boolean)
      : [];

    return Array.from(new Set(models));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildOllamaFallbackModels(configuredModel: string, availableModels: string[] | null): string[] {
  const preferred = [configuredModel, ...OLLAMA_LOCAL_FALLBACK_MODELS].filter(Boolean);
  const unique = Array.from(new Set(preferred));

  if (!availableModels || availableModels.length === 0) {
    return unique;
  }

  const available = new Set(availableModels);
  return unique.filter((model) => available.has(model));
}

function shouldRetryWithFallback(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('model not found') ||
    message.includes('not_found_error') ||
    message.includes('404 Not Found') ||
    message.includes('402 Payment Required') ||
    message.includes('not included in your free usage') ||
    message.includes('انتهت مهلة انتظار مزود الذكاء قبل وصول الرد')
  );
}

function routeModelsForPrompt(configured: string[], availableModels: string[] | null, estimatedPromptTokens: number): string[] {
  const available = availableModels ? new Set(availableModels) : null;
  const candidates = estimatedPromptTokens >= 900
    ? [...OLLAMA_RESEARCH_FALLBACK_MODELS, ...configured, ...OLLAMA_LOCAL_FALLBACK_MODELS]
    : [...configured, ...OLLAMA_LOCAL_FALLBACK_MODELS];
  return Array.from(new Set(candidates)).filter(model => !available || available.has(model));
}

async function resolveRuntimeLlmConfig(): Promise<RuntimeLlmConfig> {
  const settings = await runtimeGetSystemSettings().catch(() => null);

  const enabled = settings?.llmEnabled ?? true;
  const provider = (settings?.llmProvider as RuntimeLlmConfig['provider'] | undefined) ?? (ENV.serviceApiUrl.includes('11434') ? 'ollama' : 'openai_compatible');
  const baseUrl = trim(settings?.llmBaseUrl) || trim(ENV.serviceApiUrl);
  const apiKey = trim(settings?.llmApiKey) || trim(ENV.serviceApiKey) || 'ollama';
  const model = trim(settings?.llmModel) || trim(ENV.serviceModel);
  const timeoutSeconds = Number(settings?.llmTimeoutSeconds || 90);

  if (!enabled || provider === 'disabled') {
    throw new Error('مزود الذكاء معطل حاليًا من إعدادات النظام');
  }
  if (!baseUrl) {
    throw new Error('رابط مزود الذكاء غير مضبوط');
  }
  if (!model) {
    throw new Error('نموذج الذكاء غير مضبوط');
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const timeoutMs = Math.max(5000, timeoutSeconds * 1000);
  const availableModels = provider === 'ollama'
    ? await tryListOllamaModels(normalizedBaseUrl, timeoutMs)
    : null;
  const fallbackModels = provider === 'ollama'
    ? buildOllamaFallbackModels(model, availableModels)
    : [model];
  if (provider === 'ollama' && availableModels && availableModels.length > 0 && fallbackModels.length === 0) {
    throw new Error(`لا يوجد أي نموذج متاح محليًا من النماذج المدعومة (${[model, ...OLLAMA_LOCAL_FALLBACK_MODELS].filter(Boolean).join(', ')})`);
  }

  const effectiveModel = fallbackModels[0] || model;

  return {
    provider,
    enabled,
    baseUrl: normalizedBaseUrl,
    apiUrl: `${normalizedBaseUrl}/v1/chat/completions`,
    apiKey,
    configuredModel: model,
    model: effectiveModel,
    timeoutMs,
    fallbackModels,
  };
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const runtimeConfig = await resolveRuntimeLlmConfig();
  const hardwareProfile = runtimeConfig.provider === 'ollama'
    ? await detectHardwareAdaptiveProfile()
    : null;

  const payloadBase: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payloadBase.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payloadBase.tool_choice = normalizedToolChoice;
  }

  payloadBase.max_tokens = params.maxTokens ?? params.max_tokens ?? hardwareProfile?.budgets.outputTokens ?? 768;
  if (runtimeConfig.provider === 'ollama') {
    payloadBase.options = { num_ctx: hardwareProfile?.budgets.contextTokens ?? 4096 };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payloadBase.response_format = normalizedResponseFormat;
  }

  const apiUrl = runtimeConfig.apiUrl;
  const promptChars = messages.reduce((sum, message) => sum + (typeof message.content === 'string' ? message.content.length : JSON.stringify(message.content ?? '').length), 0);
  const estimatedPromptTokens = Math.ceil(promptChars / 3.5);
  const availableModels = runtimeConfig.provider === 'ollama'
    ? await tryListOllamaModels(runtimeConfig.baseUrl, 5000)
    : null;
  const modelsToTry = runtimeConfig.provider === 'ollama'
    ? routeModelsForPrompt(runtimeConfig.fallbackModels?.length ? runtimeConfig.fallbackModels : [runtimeConfig.model], availableModels, estimatedPromptTokens)
    : [runtimeConfig.model];
  let lastError: Error | null = null;
  let json: InvokeResult | null = null;

  for (let index = 0; index < modelsToTry.length; index++) {
    const effectiveModel = modelsToTry[index];
    const payload: Record<string, unknown> = {
      ...payloadBase,
      model: effectiveModel,
    };

    const controller = new AbortController();
    const hardTimeoutMs = Math.min(runtimeConfig.timeoutMs, hardwareProfile?.budgets.attemptTimeoutMs ?? 45000);
    const timeout = setTimeout(() => controller.abort(), hardTimeoutMs);
    const startedAt = Date.now();
    console.log('[invokeLLM] request', {
      apiUrl,
      configuredModel: runtimeConfig.configuredModel,
      effectiveModel,
      messageCount: messages.length,
      hasTools: Boolean(tools?.length),
      fallbackAttempt: index,
      promptChars,
      estimatedPromptTokens,
      maxTokens: payloadBase.max_tokens,
      hardTimeoutMs,
    });

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${runtimeConfig.apiKey || 'ollama'}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
        );
        const canRetry = runtimeConfig.provider === 'ollama' && index < modelsToTry.length - 1 && shouldRetryWithFallback(error);
        if (canRetry) {
          console.warn('[invokeLLM] retrying with fallback model', {
            configuredModel: runtimeConfig.configuredModel,
            failedModel: effectiveModel,
            nextModel: modelsToTry[index + 1],
            reason: error.message,
          });
          lastError = error;
          continue;
        }
        throw error;
      }

      json = (await response.json()) as InvokeResult;
      if (json) {
        json.model = effectiveModel;
      }
      console.log('[invokeLLM] success', {
        configuredModel: runtimeConfig.configuredModel,
        effectiveModel,
        fallbackHappened: effectiveModel !== runtimeConfig.configuredModel,
        finishReason: json?.choices?.[0]?.finish_reason,
        usage: json?.usage,
        elapsedMs: Date.now() - startedAt,
      });
      break;
    } catch (error: any) {
      clearTimeout(timeout);
      const normalizedError = error?.name === 'AbortError'
        ? new Error('انتهت مهلة انتظار مزود الذكاء قبل وصول الرد')
        : (error instanceof Error ? error : new Error(String(error || 'Unknown LLM error')));
      const canRetry = runtimeConfig.provider === 'ollama' && index < modelsToTry.length - 1 && shouldRetryWithFallback(normalizedError);
      if (canRetry) {
        console.warn('[invokeLLM] retrying with fallback model', {
          configuredModel: runtimeConfig.configuredModel,
          failedModel: effectiveModel,
          nextModel: modelsToTry[index + 1],
          reason: normalizedError.message,
        });
        lastError = normalizedError;
        continue;
      }
      throw normalizedError;
    }
  }

  if (!json) {
    throw lastError ?? new Error('تعذر الحصول على رد من مزود الذكاء');
  }

  return json;
}
