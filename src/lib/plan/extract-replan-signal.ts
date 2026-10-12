import { replanSignalToolSchema } from "./plan-schema";
import { ollama, isOllamaAvailable, OLLAMA_MODEL, extractToolArguments } from "@/lib/llm/ollama-client";

export type ReplanSignal = {
  masteredTopics: string[];
  strugglingTopics: string[];
  circumstances: string;
};

const SYSTEM_PROMPT = `You're reading a student's free-text update about their study progress. Map what they say onto their real topic list — only use exact titles from the list provided, never invent a new one or guess at a topic that isn't listed. If they mention something that doesn't match any listed topic, ignore it rather than making one up.`;

/** Returns null (never partial/guessed data) if Ollama is unreachable or
 * the extraction fails — caller should proceed with just the explicit
 * form fields and circumstances left empty rather than block re-planning
 * on this being unavailable. */
export async function extractReplanSignal(
  message: string,
  knownTopics: string[],
): Promise<ReplanSignal | null> {
  if (!message.trim() || !(await isOllamaAvailable())) return null;

  try {
    const response = await ollama.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Real topic list:\n${knownTopics.map((t) => `- ${t}`).join("\n")}\n\nStudent's update:\n"${message.trim().slice(0, 2000)}"`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: replanSignalToolSchema.name,
            description: replanSignalToolSchema.description,
            parameters: replanSignalToolSchema.input_schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: replanSignalToolSchema.name } },
    });

    const parsed = extractToolArguments<ReplanSignal>(response.choices[0]?.message ?? {}, replanSignalToolSchema.name);
    if (!parsed) return null;

    const knownSet = new Set(knownTopics);
    return {
      masteredTopics: (parsed.masteredTopics ?? []).filter((t) => knownSet.has(t)),
      strugglingTopics: (parsed.strugglingTopics ?? []).filter((t) => knownSet.has(t)),
      circumstances: typeof parsed.circumstances === "string" ? parsed.circumstances : "",
    };
  } catch (err) {
    console.error("replan signal extraction failed", err);
    return null;
  }
}
