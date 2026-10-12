import OpenAI from "openai";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// Ollama speaks the OpenAI-compatible chat/completions API, so the official
// OpenAI SDK works against it unmodified — just point baseURL at the local
// server. No API key needed; Ollama doesn't check it.
export const ollama = new OpenAI({
  baseURL: `${OLLAMA_BASE_URL}/v1`,
  apiKey: "ollama",
});

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Small local models frequently double-encode nested arrays/objects in tool
 * arguments — e.g. {"periods": "[{...}, {...}]"} instead of a real nested
 * array. Recursively re-parses any string value that looks like JSON so the
 * caller gets properly nested data either way.
 */
function deepParseJsonStrings(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const looksLikeJson =
      (trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"));
    if (!looksLikeJson) return value;
    try {
      return deepParseJsonStrings(JSON.parse(trimmed));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(deepParseJsonStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepParseJsonStrings(v)]));
  }
  return value;
}

/**
 * Pulls structured tool-call output out of a chat completion. Smaller local
 * models (via Ollama's OpenAI-compat layer) are inconsistent in a few ways:
 * sometimes they skip the native `tool_calls` array and emit a JSON object
 * like {"name": "...", "parameters": {...}} as plain message content;
 * sometimes nested arrays/objects inside the arguments come back
 * double-stringified. This handles both.
 */
export function extractToolArguments<T>(
  message: { tool_calls?: Array<{ type: string; function?: { name: string; arguments: string } }>; content?: string | null },
  toolName: string,
): T | null {
  const nativeCall = message.tool_calls?.find((c) => c.type === "function" && c.function?.name === toolName);
  if (nativeCall?.function) {
    try {
      return deepParseJsonStrings(JSON.parse(nativeCall.function.arguments)) as T;
    } catch {
      // fall through to content parsing
    }
  }

  const content = message.content?.trim();
  if (!content) return null;

  const jsonText = content.startsWith("{") ? content : content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);

  try {
    const parsed = deepParseJsonStrings(JSON.parse(jsonText)) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      if (parsed.name === toolName && parsed.parameters) return parsed.parameters as T;
      if (!("name" in parsed)) return parsed as T;
    }
  } catch {
    // unparseable — caller falls back to mock
  }

  return null;
}
